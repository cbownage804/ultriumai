"""
Wrayth agent — action executor.

Runs alongside the posture loop. Every ~30 seconds it polls
agent-action-poll for approved actions, runs the corresponding
PowerShell command as SYSTEM (the service context), and reports
the result via agent-action-result.

Only a fixed whitelist of actions is supported. Nothing arbitrary
ever comes back from the server — we ignore action_types we don't
recognize.
"""
from __future__ import annotations

import json
import os
import platform
import subprocess
import time
from typing import Any
from urllib import request as urlreq
from urllib.error import HTTPError, URLError


POLL_INTERVAL_SECONDS = 30


def _ps(script: str, timeout: int = 600) -> tuple[int, str, str]:
    """Run a PowerShell block. Returns (returncode, stdout, stderr)."""
    try:
        proc = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-Command", script,
            ],
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=0x08000000,  # CREATE_NO_WINDOW
        )
        return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()
    except subprocess.TimeoutExpired:
        return 124, "", "timed out"
    except Exception as e:  # noqa: BLE001
        return 1, "", str(e)


def _try_json(s: str) -> Any:
    """Best-effort JSON decode for audit before/after snapshots."""
    try:
        return json.loads(s) if s else None
    except Exception:
        return (s or "").strip() or None


# ---------------------------------------------------------------------------
# Action handlers — each returns (ok: bool, result: dict, error: str|None)
# ---------------------------------------------------------------------------

def _enable_bitlocker(_params: dict[str, Any]) -> tuple[bool, dict, str | None]:
    # Turn on BitLocker (TPM + recovery password) if needed, then export the
    # recovery password so Wrayth can escrow it. Non-destructive if already on.
    script = r"""
$ErrorActionPreference = 'Stop'
$state = 'unknown'
try {
  $v = Get-BitLockerVolume -MountPoint 'C:'
  if ($v.ProtectionStatus -ne 'On') {
    Enable-BitLocker -MountPoint 'C:' -EncryptionMethod XtsAes256 `
      -UsedSpaceOnly -TpmProtector -SkipHardwareTest -ErrorAction SilentlyContinue | Out-Null
    $state = 'enabling'
  } else {
    $state = 'already_on'
  }
  $v = Get-BitLockerVolume -MountPoint 'C:'
  $hasRecovery = $v.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' }
  if (-not $hasRecovery) {
    Add-BitLockerKeyProtector -MountPoint 'C:' -RecoveryPasswordProtector | Out-Null
    $v = Get-BitLockerVolume -MountPoint 'C:'
  }
  $rp = ($v.KeyProtector | Where-Object { $_.KeyProtectorType -eq 'RecoveryPassword' } | Select-Object -First 1)
  $obj = [pscustomobject]@{
    state = $state
    protection_status = "$($v.ProtectionStatus)"
    volume_status = "$($v.VolumeStatus)"
    percent = [int]$v.EncryptionPercentage
    method = "$($v.EncryptionMethod)"
    recovery_key_id = "$($rp.KeyProtectorId)"
    recovery_password = "$($rp.RecoveryPassword)"
  }
  $obj | ConvertTo-Json -Compress
} catch {
  @{ state = 'error'; error = $_.Exception.Message } | ConvertTo-Json -Compress
  exit 1
}
"""
    rc, out, err = _ps(script)
    result: dict[str, Any] = {"stdout_raw": out[:2000]}
    try:
        parsed = json.loads(out) if out else {}
        if isinstance(parsed, dict):
            result.update(parsed)
    except Exception:
        pass
    return rc == 0, result, (err or None) if rc != 0 else None



def _enable_firewall(_params: dict[str, Any]) -> tuple[bool, dict, str | None]:
    before_rc, before, _ = _ps(
        "(Get-NetFirewallProfile | Select-Object Name,Enabled) | ConvertTo-Json -Compress"
    )
    rc, out, err = _ps("Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True; 'ok'")
    after_rc, after, _ = _ps(
        "(Get-NetFirewallProfile | Select-Object Name,Enabled) | ConvertTo-Json -Compress"
    )
    return rc == 0, {
        "stdout": out,
        "previous_value": _try_json(before),
        "new_value": _try_json(after),
        "rollback_possible": True,
        "rollback_action": "disable_firewall",
    }, err or None if rc != 0 else None


def _enable_defender(_params: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-MpPreference -DisableRealtimeMonitoring $false; "
        "Update-MpSignature -ErrorAction SilentlyContinue; 'ok'"
    )
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _defender_quick(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Start-MpScan -ScanType QuickScan; 'ok'", timeout=1800)
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _defender_full(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Start-MpScan -ScanType FullScan; 'ok'", timeout=5400)
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _install_updates(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    # Uses built-in COM: no extra module install required.
    script = r"""
$Session = New-Object -ComObject Microsoft.Update.Session
$Searcher = $Session.CreateUpdateSearcher()
$Result = $Searcher.Search("IsInstalled=0 and Type='Software'")
if ($Result.Updates.Count -eq 0) { 'no_updates'; exit 0 }
$ToInstall = New-Object -ComObject Microsoft.Update.UpdateColl
foreach ($u in $Result.Updates) {
  if (-not $u.EulaAccepted) { $u.AcceptEula() }
  $ToInstall.Add($u) | Out-Null
}
$Downloader = $Session.CreateUpdateDownloader()
$Downloader.Updates = $ToInstall
$Downloader.Download() | Out-Null
$Installer = $Session.CreateUpdateInstaller()
$Installer.Updates = $ToInstall
$Ir = $Installer.Install()
"installed:$($ToInstall.Count) rebootRequired:$($Ir.RebootRequired)"
"""
    rc, out, err = _ps(script, timeout=5400)
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _lock_screen(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    ok, details, err = _lock_active_user_session()
    if ok:
        return True, details, None

    # If the agent was launched manually inside the signed-in user's session,
    # the plain API call works. When running as the normal Windows service it
    # lives in session 0, where rundll32 can return "ok" without locking the
    # visible desktop, so only use this fallback for non-service sessions.
    if details.get("current_session") == details.get("active_session") and details.get("current_session") not in (0, None):
        rc, out, ps_err = _ps("rundll32.exe user32.dll,LockWorkStation; 'ok'")
        return rc == 0, {**details, "method": "current_user_rundll32", "stdout": out}, ps_err or None if rc != 0 else None

    return False, details, err or "Could not launch lock command in the active user session"


def _format_win_error(code: int) -> str:
    if code == 0:
        return "unknown Windows error"
    try:
        import ctypes

        return f"Windows error {code}: {ctypes.FormatError(code).strip()}"
    except Exception:  # noqa: BLE001
        return f"Windows error {code}"


def _current_session_id() -> int | None:
    if platform.system() != "Windows":
        return None
    try:
        import ctypes
        from ctypes import wintypes

        session_id = wintypes.DWORD()
        ok = ctypes.windll.kernel32.ProcessIdToSessionId(
            os.getpid(),
            ctypes.byref(session_id),
        )
        return int(session_id.value) if ok else None
    except Exception:  # noqa: BLE001
        return None


def _lock_active_user_session() -> tuple[bool, dict[str, Any], str | None]:
    """
    LockWorkStation only affects the caller's interactive desktop. The Wrayth
    agent normally runs as a Windows service in session 0, so calling rundll32
    directly can report success while doing nothing visible. Instead, launch
    rundll32 inside the active console user's session using the SYSTEM service's
    WTS token.
    """
    if platform.system() != "Windows":
        return False, {"method": "active_user_session", "os": platform.system()}, "lock_screen is Windows-only"

    try:
        import ctypes
        from ctypes import wintypes
    except Exception as e:  # noqa: BLE001
        return False, {"method": "active_user_session"}, str(e)

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    advapi32 = ctypes.WinDLL("advapi32", use_last_error=True)
    wtsapi32 = ctypes.WinDLL("wtsapi32", use_last_error=True)
    userenv = ctypes.WinDLL("userenv", use_last_error=True)

    active_session = int(kernel32.WTSGetActiveConsoleSessionId())
    current_session = _current_session_id()
    details: dict[str, Any] = {
        "method": "active_user_session",
        "active_session": active_session,
        "current_session": current_session,
    }
    if active_session == 0xFFFFFFFF:
        return False, details, "No active console session is available"

    token = wintypes.HANDLE()
    if not wtsapi32.WTSQueryUserToken(wintypes.ULONG(active_session), ctypes.byref(token)):
        code = ctypes.get_last_error()
        return False, {**details, "stage": "WTSQueryUserToken"}, _format_win_error(code)

    env = ctypes.c_void_p()
    env_created = False

    class STARTUPINFO(ctypes.Structure):
        _fields_ = [
            ("cb", wintypes.DWORD),
            ("lpReserved", wintypes.LPWSTR),
            ("lpDesktop", wintypes.LPWSTR),
            ("lpTitle", wintypes.LPWSTR),
            ("dwX", wintypes.DWORD),
            ("dwY", wintypes.DWORD),
            ("dwXSize", wintypes.DWORD),
            ("dwYSize", wintypes.DWORD),
            ("dwXCountChars", wintypes.DWORD),
            ("dwYCountChars", wintypes.DWORD),
            ("dwFillAttribute", wintypes.DWORD),
            ("dwFlags", wintypes.DWORD),
            ("wShowWindow", wintypes.WORD),
            ("cbReserved2", wintypes.WORD),
            ("lpReserved2", ctypes.c_void_p),
            ("hStdInput", wintypes.HANDLE),
            ("hStdOutput", wintypes.HANDLE),
            ("hStdError", wintypes.HANDLE),
        ]

    class PROCESS_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("hProcess", wintypes.HANDLE),
            ("hThread", wintypes.HANDLE),
            ("dwProcessId", wintypes.DWORD),
            ("dwThreadId", wintypes.DWORD),
        ]

    try:
        # Best-effort environment block. CreateProcessAsUser still works with
        # a null environment, but this keeps SystemRoot/PATH correct.
        if userenv.CreateEnvironmentBlock(ctypes.byref(env), token, False):
            env_created = True

        si = STARTUPINFO()
        si.cb = ctypes.sizeof(STARTUPINFO)
        si.lpDesktop = "winsta0\\default"
        pi = PROCESS_INFORMATION()

        system_root = os.environ.get("SystemRoot", r"C:\Windows")
        rundll32 = os.path.join(system_root, "System32", "rundll32.exe")
        command = f'"{rundll32}" user32.dll,LockWorkStation'
        CREATE_UNICODE_ENVIRONMENT = 0x00000400
        CREATE_NO_WINDOW = 0x08000000

        ok = advapi32.CreateProcessAsUserW(
            token,
            None,
            ctypes.c_wchar_p(command),
            None,
            None,
            False,
            CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW,
            env if env_created else None,
            None,
            ctypes.byref(si),
            ctypes.byref(pi),
        )
        if not ok:
            code = ctypes.get_last_error()
            return False, {**details, "stage": "CreateProcessAsUserW"}, _format_win_error(code)

        kernel32.CloseHandle(pi.hThread)
        kernel32.CloseHandle(pi.hProcess)
        return True, {**details, "pid": int(pi.dwProcessId), "launched_in_user_session": True}, None
    finally:
        if env_created:
            userenv.DestroyEnvironmentBlock(env)
        kernel32.CloseHandle(token)


def _sign_out(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    # Force logoff of the active console session.
    rc, out, err = _ps("shutdown.exe /l /f; 'ok'")
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


# ---------- v0.2.0 additions ---------------------------------------------

def _disable_rdp(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    before_rc, before, _ = _ps(
        "(Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name fDenyTSConnections).fDenyTSConnections"
    )
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' "
        "-Name fDenyTSConnections -Value 1; "
        "Disable-NetFirewallRule -DisplayGroup 'Remote Desktop' -ErrorAction SilentlyContinue; 'ok'"
    )
    return rc == 0, {
        "stdout": out,
        "previous_value": {"fDenyTSConnections": (before or "").strip() or "unknown"},
        "new_value": {"fDenyTSConnections": "1"},
        "rollback_possible": True,
        "rollback_action": "enable_rdp",
    }, err or None if rc != 0 else None


def _enable_rdp_nla(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' "
        "-Name UserAuthentication -Value 1; 'ok'"
    )
    return rc == 0, {
        "stdout": out,
        "new_value": {"UserAuthentication": "1"},
        "rollback_possible": True,
        "rollback_action": "disable_rdp_nla",
    }, err or None if rc != 0 else None


def _disable_remote_assistance(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Remote Assistance' "
        "-Name fAllowToGetHelp -Value 0; 'ok'"
    )
    return rc == 0, {
        "stdout": out,
        "new_value": {"fAllowToGetHelp": "0"},
        "rollback_possible": True,
        "rollback_action": "enable_remote_assistance",
    }, err or None if rc != 0 else None


_BROWSER_POLICY_PATHS = {
    "chrome": "HKLM:\\SOFTWARE\\Policies\\Google\\Chrome",
    "edge": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge",
    "firefox": "HKLM:\\SOFTWARE\\Policies\\Mozilla\\Firefox",
}


def _set_browser_password_manager(p: dict[str, Any], enabled: bool) -> tuple[bool, dict, str | None]:
    browser = str(p.get("browser") or "all").lower()
    targets = ("chrome", "edge", "firefox") if browser == "all" else (browser,)
    scripts = []
    for b in targets:
        path = _BROWSER_POLICY_PATHS.get(b)
        if not path:
            continue
        if enabled:
            # Remove the disable policy so the browser reverts to the user's choice (default = enabled).
            scripts.append(
                f"if (Test-Path '{path}') {{ Remove-ItemProperty '{path}' -Name PasswordManagerEnabled -ErrorAction SilentlyContinue }};"
            )
        else:
            scripts.append(
                f"New-Item -Path '{path}' -Force | Out-Null; "
                f"Set-ItemProperty '{path}' -Name PasswordManagerEnabled -Value 0 -Type DWord;"
            )
    if not scripts:
        return False, {"browser": browser}, "unsupported browser"
    rc, out, err = _ps(" ".join(scripts) + " 'ok'")
    return rc == 0, {"stdout": out, "browser": browser, "enabled": enabled}, err or None if rc != 0 else None


def _disable_browser_password_manager(p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    return _set_browser_password_manager(p, enabled=False)


def _enable_browser_password_manager(p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    return _set_browser_password_manager(p, enabled=True)


def _remove_local_admin(p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    name = str(p.get("name") or "").strip()
    if not name:
        return False, {}, "missing name"
    # Refuse to remove built-in Administrator (SID *-500)
    if name.lower().endswith("\\administrator") or name.lower() == "administrator":
        return False, {"reason": "builtin_administrator"}, "Use disable_builtin_administrator instead"
    safe = name.replace("'", "''")
    rc, out, err = _ps(
        f"Remove-LocalGroupMember -Group 'Administrators' -Member '{safe}' -ErrorAction Stop; 'ok'"
    )
    return rc == 0, {"stdout": out, "name": name}, err or None if rc != 0 else None


def _disable_builtin_administrator(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Get-LocalUser | Where-Object { $_.SID -like '*-500' } | Disable-LocalUser; 'ok'"
    )
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _enable_defender_pua(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Set-MpPreference -PUAProtection Enabled; 'ok'")
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _enable_defender_cloud(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-MpPreference -MAPSReporting Advanced -SubmitSamplesConsent SendSafeSamples; 'ok'"
    )
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _update_defender_signatures(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Update-MpSignature; 'ok'", timeout=600)
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _disable_defender_pua(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Set-MpPreference -PUAProtection Disabled; 'ok'")
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _disable_defender_cloud(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-MpPreference -MAPSReporting Disabled -SubmitSamplesConsent NeverSend; 'ok'"
    )
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _disable_firewall(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps("Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False; 'ok'")
    return rc == 0, {"stdout": out, "rollback_possible": True, "rollback_action": "enable_firewall"}, err or None if rc != 0 else None


def _enable_rdp(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' "
        "-Name fDenyTSConnections -Value 0; "
        "Enable-NetFirewallRule -DisplayGroup 'Remote Desktop' -ErrorAction SilentlyContinue; 'ok'"
    )
    return rc == 0, {"stdout": out, "rollback_possible": True, "rollback_action": "disable_rdp"}, err or None if rc != 0 else None


def _disable_rdp_nla(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' "
        "-Name UserAuthentication -Value 0; 'ok'"
    )
    return rc == 0, {"stdout": out, "rollback_possible": True, "rollback_action": "enable_rdp_nla"}, err or None if rc != 0 else None


def _enable_remote_assistance(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Set-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Remote Assistance' "
        "-Name fAllowToGetHelp -Value 1; 'ok'"
    )
    return rc == 0, {"stdout": out, "rollback_possible": True, "rollback_action": "disable_remote_assistance"}, err or None if rc != 0 else None


def _enable_builtin_administrator(_p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    rc, out, err = _ps(
        "Get-LocalUser | Where-Object { $_.SID -like '*-500' } | Enable-LocalUser; 'ok'"
    )
    return rc == 0, {"stdout": out}, err or None if rc != 0 else None


def _disable_startup_item(p: dict[str, Any]) -> tuple[bool, dict, str | None]:
    location = str(p.get("location") or "").strip()
    name = str(p.get("name") or "").strip()
    if not location or not name:
        return False, {}, "missing location/name"
    if "Run" not in location:
        return False, {}, "unsupported location"
    safe_loc = location.replace("'", "''")
    safe_name = name.replace("'", "''")
    rc, out, err = _ps(
        f"Remove-ItemProperty -Path '{safe_loc}' -Name '{safe_name}' -ErrorAction Stop; 'ok'"
    )
    return rc == 0, {"stdout": out, "removed": name}, err or None if rc != 0 else None


HANDLERS = {
    "enable_bitlocker": _enable_bitlocker,
    "enable_firewall": _enable_firewall,
    "enable_defender": _enable_defender,
    "run_defender_quick_scan": _defender_quick,
    "run_defender_full_scan": _defender_full,
    "install_windows_updates": _install_updates,
    "lock_screen": _lock_screen,
    "sign_out_user": _sign_out,
    "disable_rdp": _disable_rdp,
    "enable_rdp_nla": _enable_rdp_nla,
    "disable_remote_assistance": _disable_remote_assistance,
    "disable_browser_password_manager": _disable_browser_password_manager,
    "enable_browser_password_manager": _enable_browser_password_manager,
    "remove_local_admin": _remove_local_admin,
    "disable_builtin_administrator": _disable_builtin_administrator,
    "enable_builtin_administrator": _enable_builtin_administrator,
    "enable_defender_pua": _enable_defender_pua,
    "disable_defender_pua": _disable_defender_pua,
    "enable_defender_cloud": _enable_defender_cloud,
    "disable_defender_cloud": _disable_defender_cloud,
    "update_defender_signatures": _update_defender_signatures,
    "disable_firewall": _disable_firewall,
    "enable_rdp": _enable_rdp,
    "disable_rdp_nla": _disable_rdp_nla,
    "enable_remote_assistance": _enable_remote_assistance,
    "disable_startup_item": _disable_startup_item,
}


# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

def _post_json(url: str, body: dict, token: str) -> dict:
    data = json.dumps(body).encode("utf-8")
    req = urlreq.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    with urlreq.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8") or "{}")


def poll_actions(api_base: str, token: str) -> list[dict]:
    resp = _post_json(f"{api_base}/functions/v1/agent-action-poll", {}, token)
    return list(resp.get("actions") or [])


def report_result(
    api_base: str,
    token: str,
    action_id: str,
    ok: bool,
    result: dict,
    error: str | None,
) -> None:
    # Pull audit-trail fields out of the handler result so the server can
    # store them as first-class columns for rollback + timeline rendering.
    audit_keys = ("previous_value", "new_value", "rollback_possible",
                  "rollback_action", "requires_reboot")
    body: dict[str, Any] = {
        "action_id": action_id,
        "status": "succeeded" if ok else "failed",
        "result": {k: v for k, v in (result or {}).items() if k not in audit_keys},
        "error": error,
    }
    for k in audit_keys:
        if result and k in result:
            body[k] = result[k]
    _post_json(f"{api_base}/functions/v1/agent-action-result", body, token)



# ---------------------------------------------------------------------------
# Executor loop (called from wrayth_agent.main via a background thread)
# ---------------------------------------------------------------------------

def run_action_loop(cfg_getter, log) -> None:
    """cfg_getter() must return the current live config dict."""
    while True:
        cfg = cfg_getter() or {}
        api = (cfg.get("api_base") or "").rstrip("/")
        token = cfg.get("device_token")
        if not api or not token:
            time.sleep(POLL_INTERVAL_SECONDS)
            continue
        try:
            actions = poll_actions(api, token)
            for a in actions:
                atype = a.get("action_type")
                aid = a.get("id")
                handler = HANDLERS.get(atype)
                if not handler or platform.system() != "Windows":
                    report_result(api, token, aid, False, {}, f"unsupported:{atype}")
                    log(f"action {atype} rejected (unsupported on this OS)")
                    continue
                log(f"executing action {atype} ({aid})")
                try:
                    ok, result, err = handler(a.get("params") or {})
                    report_result(api, token, aid, ok, result, err)
                    log(f"action {atype} {'ok' if ok else 'failed'}: {err or ''}")
                except Exception as e:  # noqa: BLE001
                    report_result(api, token, aid, False, {}, str(e))
                    log(f"action {atype} crashed: {e}")
        except HTTPError as e:
            if e.code == 401:
                log("action poll: device revoked")
                return
            log(f"action poll http error {e.code}")
        except URLError as e:
            log(f"action poll network error: {e}")
        except Exception as e:  # noqa: BLE001
            log(f"action loop unexpected: {e}")
        time.sleep(POLL_INTERVAL_SECONDS)
