"""
Wrayth device agent — read-only posture reporter.

The agent enrolls once via a short code, receives a long-lived device
token, and posts a posture snapshot to Wrayth every hour. It runs
completely locally, ships no data other than the posture payload, and
self-uninstalls when the server revokes it.

Windows-first for v1. macOS/Linux collectors are stubbed and safe to run
but not shipped in the current release.
"""

from __future__ import annotations

import json
import os
import platform
import random
import socket
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib import request as urlreq
from urllib.error import HTTPError, URLError

try:
    from wrayth_actions import run_action_loop  # type: ignore
except Exception:  # noqa: BLE001
    run_action_loop = None  # type: ignore

AGENT_VERSION = "0.2.5"

# ---------------------------------------------------------------------------
# Config on disk
# ---------------------------------------------------------------------------

def _config_dir() -> Path:
    if platform.system() == "Windows":
        base = Path(os.environ.get("PROGRAMDATA", r"C:\ProgramData")) / "Wrayth"
    elif platform.system() == "Darwin":
        base = Path.home() / "Library" / "Application Support" / "Wrayth"
    else:
        base = Path(os.environ.get("XDG_CONFIG_HOME", str(Path.home() / ".config"))) / "wrayth"
    base.mkdir(parents=True, exist_ok=True)
    return base


CONFIG_PATH = _config_dir() / "wrayth-config.json"
LOG_PATH = _config_dir() / "agent.log"


def _log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc).isoformat()}] {msg}\n"
    try:
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass
    print(line.rstrip(), flush=True)


def _load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        try:
            return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except Exception as e:
            _log(f"config unreadable: {e}")
    # Fall back to a config file dropped next to the executable
    # (per-user download bundle drops it there).
    exe_dir = Path(sys.argv[0]).resolve().parent
    beside = exe_dir / "wrayth-config.json"
    if beside.exists():
        try:
            data = json.loads(beside.read_text(encoding="utf-8"))
            _save_config(data)
            return data
        except Exception as e:
            _log(f"bundled config unreadable: {e}")
    return {}


def _save_config(cfg: dict[str, Any]) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Posture collectors — Windows
# ---------------------------------------------------------------------------

def _run(cmd: list[str], timeout: int = 15) -> str:
    try:
        out = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=0x08000000 if platform.system() == "Windows" else 0,
        )
        return (out.stdout or "").strip()
    except Exception as e:
        _log(f"cmd failed {cmd[:1]}: {e}")
        return ""


def _ps(script: str, timeout_seconds: int = 25) -> str:
    return _run(
        [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
        timeout=timeout_seconds,
    )


def collect_windows() -> dict[str, Any]:
    posture: dict[str, Any] = {}

    # BitLocker on C: — capture status + method + percent encrypted
    bl = _ps(
        "try { $v = Get-BitLockerVolume -MountPoint 'C:'; "
        "\"$($v.ProtectionStatus)|$($v.VolumeStatus)|$($v.EncryptionPercentage)|"
        "$($v.EncryptionMethod)|$(($v.KeyProtector | ForEach-Object { $_.KeyProtectorType }) -join ',')\" } "
        "catch { 'unknown|unknown|0|unknown|' }"
    )
    bl_parts = (bl or "").split("|")
    while len(bl_parts) < 5:
        bl_parts.append("")
    ps_status, vol_status, pct, method, protectors = bl_parts[:5]
    try:
        pct_i = int(float(pct or 0))
    except ValueError:
        pct_i = 0
    posture["disk_encryption"] = {
        "enabled": ps_status.strip() in ("1", "On") or vol_status.strip() == "FullyEncrypted",
        "method": (method.strip() or "BitLocker") if ps_status.strip() != "unknown" else "unknown",
        "protection_status": ps_status.strip(),
        "volume_status": vol_status.strip(),
        "percent_encrypted": pct_i,
        "key_protectors": [p for p in protectors.split(",") if p],
    }

    # Firewall — per-profile detail so Ray can name what's off
    fw_raw = _ps(
        "Get-NetFirewallProfile | ForEach-Object { \"$($_.Name)=$($_.Enabled)\" }"
    )
    profiles: dict[str, bool] = {}
    for line in (fw_raw or "").splitlines():
        if "=" in line:
            name, val = line.split("=", 1)
            profiles[name.strip().lower()] = val.strip().lower() == "true"
    posture["firewall"] = {
        "enabled": any(profiles.values()) if profiles else False,
        "profiles": profiles,
        "all_profiles_enabled": bool(profiles) and all(profiles.values()),
    }

    # Defender — enabled + signature age + real-time protection + tamper protection
    defender = _ps(
        "$s = Get-MpComputerStatus; "
        "$age = if ($s.AntivirusSignatureLastUpdated) { "
        "[int](New-TimeSpan -Start $s.AntivirusSignatureLastUpdated -End (Get-Date)).TotalDays } else { -1 }; "
        "\"$($s.AntivirusEnabled)|$age|$($s.RealTimeProtectionEnabled)|"
        "$($s.IsTamperProtected)|$($s.AntivirusSignatureVersion)\""
    )
    d_parts = (defender or "").split("|")
    while len(d_parts) < 5:
        d_parts.append("")
    posture["antivirus"] = {
        "name": "Microsoft Defender",
        "enabled": d_parts[0].strip().lower() == "true",
        "definitions_age_days": int(d_parts[1]) if d_parts[1].lstrip("-").isdigit() else -1,
        "realtime_protection": d_parts[2].strip().lower() == "true",
        "tamper_protection": d_parts[3].strip().lower() == "true",
        "signature_version": d_parts[4].strip(),
    }

    # TPM
    tpm = _ps(
        "try { $t = Get-Tpm; \"$($t.TpmPresent)|$($t.TpmReady)|$($t.ManufacturerVersion)\" } "
        "catch { 'False|False|' }"
    )
    t_parts = (tpm or "").split("|")
    while len(t_parts) < 3:
        t_parts.append("")
    posture["tpm"] = {
        "present": t_parts[0].strip().lower() == "true",
        "ready": t_parts[1].strip().lower() == "true",
        "version": t_parts[2].strip(),
    }

    # Secure Boot
    sb = _ps("try { Confirm-SecureBootUEFI } catch { 'unknown' }")
    posture["secure_boot"] = {
        "enabled": sb.strip().lower() == "true",
        "supported": sb.strip().lower() != "unknown",
    }

    # UAC
    uac = _ps(
        "try { (Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System' "
        "-Name EnableLUA).EnableLUA } catch { 0 }"
    )
    posture["uac"] = {"enabled": uac.strip() == "1"}

    # Remote Desktop
    rdp = _ps(
        "try { (Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' "
        "-Name fDenyTSConnections).fDenyTSConnections } catch { 1 }"
    )
    posture["remote_desktop"] = {"enabled": rdp.strip() == "0"}

    # Local admins (count + names, excluding built-in Administrator)
    admins = _ps(
        "try { (Get-LocalGroupMember -Group 'Administrators' | ForEach-Object { $_.Name }) -join '|' } "
        "catch { '' }"
    )
    admin_list = [a for a in (admins or "").split("|") if a.strip()]
    posture["local_admins"] = {"count": len(admin_list), "members": admin_list[:10]}

    # Disk free space on C:
    disk = _ps(
        "$d = Get-PSDrive -Name C; \"$([int64]$d.Used)|$([int64]$d.Free)\""
    )
    used_s, _, free_s = (disk or "0|0").partition("|")
    try:
        used_b = int(used_s or 0)
        free_b = int(free_s or 0)
        posture["disk"] = {
            "used_gb": round(used_b / (1024 ** 3), 1),
            "free_gb": round(free_b / (1024 ** 3), 1),
            "total_gb": round((used_b + free_b) / (1024 ** 3), 1),
        }
    except ValueError:
        posture["disk"] = {"used_gb": 0, "free_gb": 0, "total_gb": 0}

    # Memory
    mem = _ps(
        "$m = Get-CimInstance Win32_OperatingSystem; "
        "\"$([int64]$m.TotalVisibleMemorySize)|$([int64]$m.FreePhysicalMemory)\""
    )
    tm, _, fm = (mem or "0|0").partition("|")
    try:
        posture["memory"] = {
            "total_gb": round(int(tm or 0) / (1024 ** 2), 1),
            "free_gb": round(int(fm or 0) / (1024 ** 2), 1),
        }
    except ValueError:
        posture["memory"] = {"total_gb": 0, "free_gb": 0}

    # Uptime + last boot
    uptime = _ps(
        "$b = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime; "
        "\"$([int]((Get-Date) - $b).TotalSeconds)|$($b.ToString('o'))\""
    )
    up_s, _, lb = (uptime or "0|").partition("|")
    try:
        posture["uptime_seconds"] = int(up_s)
    except ValueError:
        posture["uptime_seconds"] = 0
    if lb:
        posture["last_boot"] = lb.strip()

    # Pending updates count placeholder — real enumeration happens in
    # _update_categories() below (single COM scan, produces titles + counts).
    posture["pending_updates"] = 0

    # Last successful patch
    last_patch = _ps(
        "try { (Get-HotFix | Sort-Object InstalledOn -Descending | "
        "Select-Object -First 1).InstalledOn.ToString('o') } catch { '' }"
    )
    if last_patch:
        posture["last_patch_at"] = last_patch.strip()

    # Screen lock timeout
    lock = _ps(
        "try { (Get-ItemProperty 'HKCU:\\Control Panel\\Desktop' -Name ScreenSaveTimeOut)."
        "ScreenSaveTimeOut } catch { '0' }"
    )
    try:
        posture["screen_lock_seconds"] = int(lock)
    except ValueError:
        posture["screen_lock_seconds"] = 0

    # Browsers
    browsers: list[dict[str, str]] = []
    for name, path in {
        "Chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "Edge": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "Firefox": r"C:\Program Files\Mozilla Firefox\firefox.exe",
    }.items():
        if Path(path).exists():
            ver = _ps(f"(Get-Item '{path}').VersionInfo.ProductVersion")
            browsers.append({"name": name, "version": ver or "unknown"})
    posture["browsers"] = browsers

    # Installed software (name + version + publisher) from both 32/64-bit uninstall keys
    sw_raw = _ps(
        "$paths = 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',"
        "'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'; "
        "Get-ItemProperty $paths -ErrorAction SilentlyContinue | "
        "Where-Object { $_.DisplayName } | "
        "ForEach-Object { \"$($_.DisplayName)|$($_.DisplayVersion)|$($_.Publisher)\" }"
    )
    software: list[dict[str, str]] = []
    for line in (sw_raw or "").splitlines():
        parts = line.split("|", 2)
        while len(parts) < 3:
            parts.append("")
        name = parts[0].strip()
        if not name:
            continue
        software.append({
            "name": name,
            "version": parts[1].strip(),
            "publisher": parts[2].strip(),
        })
    # De-dupe by (name, version)
    seen = set()
    deduped = []
    for s in software:
        key = (s["name"].lower(), s["version"])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(s)
    posture["installed_software"] = deduped[:400]

    # Autoruns — HKLM + HKCU Run keys
    autoruns_raw = _ps(
        "$paths = 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',"
        "'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run',"
        "'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'; "
        "foreach ($p in $paths) { "
        "  try { $k = Get-ItemProperty $p -ErrorAction Stop; "
        "    $k.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | "
        "    ForEach-Object { \"$p||$($_.Name)||$($_.Value)\" } } catch {} }"
    )
    autoruns: list[dict[str, str]] = []
    for line in (autoruns_raw or "").splitlines():
        parts = line.split("||", 2)
        if len(parts) == 3 and parts[1].strip():
            autoruns.append({
                "location": parts[0].strip(),
                "name": parts[1].strip(),
                "command": parts[2].strip(),
            })
    posture["autoruns"] = autoruns[:100]

    # Non-Microsoft running services
    svc_raw = _ps(
        "Get-CimInstance Win32_Service | Where-Object { $_.State -eq 'Running' } | "
        "ForEach-Object { \"$($_.Name)|$($_.DisplayName)|$($_.StartName)|$($_.PathName)\" }"
    )
    services: list[dict[str, str]] = []
    for line in (svc_raw or "").splitlines():
        parts = line.split("|", 3)
        while len(parts) < 4:
            parts.append("")
        name = parts[0].strip()
        path = parts[3].strip().strip('"')
        # Skip clearly-Microsoft signed system services to reduce noise
        low = path.lower()
        if "\\windows\\system32\\" in low or "\\windows\\syswow64\\" in low:
            continue
        if not name:
            continue
        services.append({
            "name": name,
            "display_name": parts[1].strip(),
            "start_name": parts[2].strip(),
            "path": path,
        })
    posture["non_ms_services"] = services[:80]

    # Listening TCP ports bound to non-loopback
    ports_raw = _ps(
        "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | "
        "Where-Object { $_.LocalAddress -notin '127.0.0.1','::1' } | "
        "ForEach-Object { $p = (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).ProcessName; "
        "  \"$($_.LocalAddress)|$($_.LocalPort)|$p\" }"
    )
    listening: list[dict[str, Any]] = []
    seen_ports = set()
    for line in (ports_raw or "").splitlines():
        parts = line.split("|", 2)
        while len(parts) < 3:
            parts.append("")
        try:
            port = int(parts[1])
        except ValueError:
            continue
        key = (parts[0].strip(), port)
        if key in seen_ports:
            continue
        seen_ports.add(key)
        listening.append({
            "address": parts[0].strip(),
            "port": port,
            "process": parts[2].strip(),
        })
    posture["listening_ports"] = listening[:60]

    # Browser extensions (Chrome + Edge)
    ext_raw = _ps(
        r"""
$out = @()
$profiles = @(
  @{Browser='Chrome'; Path="$env:LOCALAPPDATA\Google\Chrome\User Data"},
  @{Browser='Edge';   Path="$env:LOCALAPPDATA\Microsoft\Edge\User Data"}
)
foreach ($b in $profiles) {
  if (-not (Test-Path $b.Path)) { continue }
  Get-ChildItem $b.Path -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -eq 'Default' -or $_.Name -like 'Profile*'
  } | ForEach-Object {
    $extDir = Join-Path $_.FullName 'Extensions'
    if (-not (Test-Path $extDir)) { return }
    Get-ChildItem $extDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $id = $_.Name
      $ver = Get-ChildItem $_.FullName -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
      if (-not $ver) { return }
      $manifest = Join-Path $ver.FullName 'manifest.json'
      if (-not (Test-Path $manifest)) { return }
      try {
        $m = Get-Content $manifest -Raw | ConvertFrom-Json
        $out += "$($b.Browser)|$id|$($m.name)|$($m.version)"
      } catch {}
    }
  }
}
$out -join "`n"
"""
    )
    extensions: list[dict[str, str]] = []
    for line in (ext_raw or "").splitlines():
        parts = line.split("|", 3)
        while len(parts) < 4:
            parts.append("")
        if not parts[1].strip():
            continue
        extensions.append({
            "browser": parts[0].strip(),
            "id": parts[1].strip(),
            "name": parts[2].strip(),
            "version": parts[3].strip(),
        })
    posture["browser_extensions"] = extensions[:120]

    # -----------------------------------------------------------------
    # v0.2.x additions — deeper posture Ray can act on.
    # Each block is wrapped independently so one slow/failing collector
    # never blocks the baseline posture from uploading.
    # -----------------------------------------------------------------

    def _safe(name: str, fn):
        try:
            fn()
        except Exception as e:  # noqa: BLE001
            _log(f"posture collector '{name}' failed: {e}")

    # RDP security detail (NLA + Remote Assistance)
    def _rdp():
        rdp_detail = _ps(
            "$rdp = (Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server' -Name fDenyTSConnections -ErrorAction SilentlyContinue).fDenyTSConnections; "
            "$nla = (Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server\\WinStations\\RDP-Tcp' -Name UserAuthentication -ErrorAction SilentlyContinue).UserAuthentication; "
            "$ra  = (Get-ItemProperty 'HKLM:\\System\\CurrentControlSet\\Control\\Remote Assistance' -Name fAllowToGetHelp -ErrorAction SilentlyContinue).fAllowToGetHelp; "
            "\"$rdp|$nla|$ra\""
        )
        r_parts = (rdp_detail or "").split("|")
        while len(r_parts) < 3:
            r_parts.append("")
        posture["rdp_security"] = {
            "rdp_enabled": r_parts[0].strip() == "0",
            "nla_enabled": r_parts[1].strip() == "1",
            "remote_assistance_enabled": r_parts[2].strip() == "1",
        }
    _safe("rdp_security", _rdp)

    # Local admin detail — enabled flag + built-in flag for each
    def _admins():
        admins_detail_raw = _ps(
            "try { Get-LocalGroupMember -Group 'Administrators' | ForEach-Object { "
            "  $u = $null; try { $u = Get-LocalUser -SID $_.SID -ErrorAction Stop } catch {} ; "
            "  $enabled = if ($u) { $u.Enabled } else { 'unknown' } ; "
            "  $builtin = if ($_.SID -like '*-500') { 'true' } else { 'false' } ; "
            "  \"$($_.Name)|$($_.ObjectClass)|$enabled|$builtin|$($_.SID)\" } } catch {}"
        )
        admin_details: list[dict[str, Any]] = []
        for line in (admins_detail_raw or "").splitlines():
            parts = line.split("|", 4)
            while len(parts) < 5:
                parts.append("")
            if not parts[0].strip():
                continue
            admin_details.append({
                "name": parts[0].strip(),
                "object_class": parts[1].strip(),
                "enabled": parts[2].strip().lower() == "true",
                "is_builtin": parts[3].strip().lower() == "true",
                "sid": parts[4].strip(),
            })
        posture["local_admins_detail"] = admin_details[:20]
    _safe("local_admins_detail", _admins)

    # Browser password manager status
    def _browser_pw():
        def _reg_dword(path: str, name: str) -> str:
            return _ps(
                f"try {{ (Get-ItemProperty '{path}' -Name {name} -ErrorAction Stop).{name} }} catch {{ '' }}"
            ).strip()
        chrome_off = _reg_dword("HKLM:\\SOFTWARE\\Policies\\Google\\Chrome", "PasswordManagerEnabled")
        edge_off = _reg_dword("HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge", "PasswordManagerEnabled")
        firefox_off = _reg_dword("HKLM:\\SOFTWARE\\Policies\\Mozilla\\Firefox", "PasswordManagerEnabled")

        def _count_passwords(login_db: Path) -> int:
            if not login_db.exists():
                return -1
            try:
                import sqlite3, shutil, tempfile
                tmp = Path(tempfile.gettempdir()) / f"wrayth_{login_db.stat().st_mtime_ns}.db"
                shutil.copy2(str(login_db), str(tmp))
                with sqlite3.connect(f"file:{tmp}?mode=ro", uri=True, timeout=2) as db:
                    cur = db.execute("SELECT COUNT(*) FROM logins")
                    n = int(cur.fetchone()[0])
                try: tmp.unlink()
                except Exception: pass
                return n
            except Exception:
                return -1

        local_app = Path(os.environ.get("LOCALAPPDATA", ""))
        chrome_logins = _count_passwords(local_app / "Google/Chrome/User Data/Default/Login Data")
        edge_logins = _count_passwords(local_app / "Microsoft/Edge/User Data/Default/Login Data")
        posture["browser_passwords"] = {
            "chrome": {
                "manager_disabled_by_policy": chrome_off == "0",
                "stored_count": chrome_logins,
            },
            "edge": {
                "manager_disabled_by_policy": edge_off == "0",
                "stored_count": edge_logins,
            },
            "firefox": {
                "manager_disabled_by_policy": firefox_off == "0",
                "stored_count": -1,
            },
        }
    _safe("browser_passwords", _browser_pw)

    # Defender detail
    def _defender():
        mpd = _ps(
            "$s = Get-MpComputerStatus; $p = Get-MpPreference; "
            "\"$($s.QuickScanEndTime)|$($s.FullScanEndTime)|$($p.MAPSReporting)|$($p.PUAProtection)|$($p.SubmitSamplesConsent)\""
        )
        m_parts = (mpd or "").split("|")
        while len(m_parts) < 5:
            m_parts.append("")
        posture["defender_detail"] = {
            "last_quick_scan": m_parts[0].strip(),
            "last_full_scan": m_parts[1].strip(),
            "cloud_protection": m_parts[2].strip() in ("1", "2", "Basic", "Advanced"),
            "pua_protection": m_parts[3].strip() in ("1", "Enabled"),
            "sample_submission": m_parts[4].strip(),
        }
    _safe("defender_detail", _defender)

    # Startup impact — augment autoruns with signed/publisher/exists info.
    # This was the biggest cost: 40 sequential PS invocations. Cap to 15
    # and skip entirely on the very first check-in so posture uploads fast.
    def _autoruns_enrich():
        if not autoruns:
            return
        enriched = []
        for entry in autoruns[:15]:
            cmd = entry["command"]
            exe = cmd
            if exe.startswith('"'):
                end = exe.find('"', 1)
                if end > 0:
                    exe = exe[1:end]
            else:
                exe = exe.split(" ")[0]
            info = _ps(
                f"try {{ $p='{exe.replace(chr(39), chr(39)+chr(39))}'; "
                "$exists = Test-Path $p; "
                "$sig = if ($exists) { (Get-AuthenticodeSignature -FilePath $p -ErrorAction SilentlyContinue) } else { $null }; "
                "$pub = if ($sig -and $sig.SignerCertificate) { $sig.SignerCertificate.Subject } else { '' }; "
                "$status = if ($sig) { $sig.Status } else { 'Missing' }; "
                "\"$exists|$status|$pub\" } catch { 'false|Error|' }"
            )
            eparts = (info or "").split("|", 2)
            while len(eparts) < 3:
                eparts.append("")
            enriched.append({
                **entry,
                "exists": eparts[0].strip().lower() == "true",
                "signature": eparts[1].strip(),
                "publisher": eparts[2].strip(),
                "signed": eparts[1].strip() == "Valid",
            })
        posture["autoruns"] = enriched + autoruns[15:]
    _safe("autoruns_enrich", _autoruns_enrich)

    # Windows Update enumeration — one COM scan produces titles, KBs,
    # category, and optional/preview flags. Preview/Insider builds are
    # excluded from `pending_updates` because the "Install pending updates"
    # action also skips them; that keeps the tile in sync with what will
    # actually be installed. Optional driver updates from Windows Update
    # (the ones under Settings → Windows Update → Advanced options →
    # Optional updates) ARE counted because Ray can install them.
    def _update_categories():
        raw = _ps(
            "try { "
            "$MU='7971f918-a847-4430-9279-4a52d1efe18d'; "
            "try { $sm=New-Object -ComObject Microsoft.Update.ServiceManager; "
            "  if (-not ($sm.Services | Where-Object { $_.ServiceID -eq $MU })) { $sm.AddService2($MU,7,'') | Out-Null } } catch {} "
            "$s = (New-Object -ComObject Microsoft.Update.Session).CreateUpdateSearcher(); "
            "try { $s.ServerSelection = 3; $s.ServiceID = $MU } catch {} "
            "$r = $s.Search('IsInstalled=0 and IsHidden=0'); "
            "$out = @(); "
            "foreach ($u in $r.Updates) { "
            "  $cats = ($u.Categories | ForEach-Object { $_.Name }) -join ','; "
            "  $kb = ''; try { if ($u.KBArticleIDs.Count -gt 0) { $kb = 'KB' + $u.KBArticleIDs.Item(0) } } catch {} "
            "  $isDriver = [bool]($cats -match 'Driver'); "
            "  $isPreview = [bool]($u.Title -match '(?i)preview|beta|insider'); "
            "  $isOptional = $isDriver -or [bool]($u.BrowseOnly); "
            "  $cat = if ($cats -match 'Security') { 'security' } "
            "         elseif ($isDriver) { 'drivers' } "
            "         elseif ($cats -match 'Feature') { 'feature' } "
            "         elseif ($u.Title -match '(?i)Office|Microsoft 365') { 'office' } "
            "         else { 'other' }; "
            "  $out += [pscustomobject]@{ title=$u.Title; kb=$kb; category=$cat; is_driver=$isDriver; is_preview=$isPreview; is_optional=$isOptional } "
            "} "
            "ConvertTo-Json -Compress -InputObject @($out) "
            "} catch { '[]' }",
            timeout_seconds=60,
        )
        items: list[dict[str, Any]] = []
        try:
            parsed = json.loads(raw) if raw else []
            if isinstance(parsed, dict):
                parsed = [parsed]
            for it in parsed or []:
                items.append({
                    "title": str(it.get("title") or "").strip(),
                    "kb": str(it.get("kb") or "").strip(),
                    "category": str(it.get("category") or "other"),
                    "is_driver": bool(it.get("is_driver")),
                    "is_preview": bool(it.get("is_preview")),
                    "is_optional": bool(it.get("is_optional")),
                })
        except Exception:  # noqa: BLE001
            items = []
        # Preview builds are informational; not counted / not installed.
        installable = [i for i in items if not i["is_preview"]]
        cats = {"security": 0, "drivers": 0, "feature": 0, "office": 0, "other": 0}
        for i in installable:
            cats[i["category"]] = cats.get(i["category"], 0) + 1
        posture["pending_updates"] = len(installable)
        posture["update_categories"] = cats
        posture["pending_updates_list"] = installable[:25]
        posture["preview_updates_available"] = len(items) - len(installable)

    _safe("update_categories", _update_categories)

    posture["logged_in_user"] = os.environ.get("USERNAME", "")
    return posture


def collect_generic() -> dict[str, Any]:
    """Cross-platform baseline used when we're not on Windows."""
    return {
        "disk_encryption": {"enabled": False, "method": "unknown"},
        "firewall": {"enabled": False},
        "antivirus": {"name": "unknown", "enabled": False},
        "uptime_seconds": 0,
        "pending_updates": 0,
        "screen_lock_seconds": 0,
        "browsers": [],
        "logged_in_user": os.environ.get("USER", ""),
    }


def collect_posture() -> dict[str, Any]:
    base = {
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "os_version": platform.version(),
        "agent_version": AGENT_VERSION,
        "last_boot": None,
    }
    body = collect_windows() if platform.system() == "Windows" else collect_generic()
    base.update(body)
    return base


# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

def _post_json(url: str, body: dict[str, Any], token: str | None = None) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urlreq.Request(url, data=data, headers=headers, method="POST")
    with urlreq.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8") or "{}")


def redeem_code(cfg: dict[str, Any]) -> dict[str, Any]:
    api = cfg["api_base"].rstrip("/")
    body = {
        "code": cfg["enrollment_code"],
        "hostname": socket.gethostname(),
        "os": platform.system(),
        "os_version": platform.version(),
        "agent_version": AGENT_VERSION,
    }
    _log("redeeming enrollment code…")
    return _post_json(f"{api}/functions/v1/agent-enroll-redeem", body)


def ingest(cfg: dict[str, Any], posture: dict[str, Any]) -> dict[str, Any]:
    api = cfg["api_base"].rstrip("/")
    return _post_json(
        f"{api}/functions/v1/agent-ingest",
        posture,
        token=cfg["device_token"],
    )


# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def ensure_enrolled(cfg: dict[str, Any]) -> dict[str, Any]:
    if cfg.get("device_token"):
        return cfg
    if not cfg.get("enrollment_code") or not cfg.get("api_base"):
        raise SystemExit(
            "Wrayth agent is missing its enrollment code. "
            "Reinstall from the Wrayth Threat Center."
        )
    result = redeem_code(cfg)
    if "device_token" not in result:
        raise SystemExit(f"enrollment failed: {result}")
    cfg["device_id"] = result["device_id"]
    cfg["device_token"] = result["device_token"]
    cfg.pop("enrollment_code", None)
    _save_config(cfg)
    _log(f"enrolled as device {cfg['device_id']}")
    return cfg


def main() -> int:
    cfg = _load_config()
    if not cfg.get("api_base"):
        # Baked-in default; overridable via config
        cfg["api_base"] = "https://nsyobmjpdpvesjwdphlh.supabase.co"
    try:
        cfg = ensure_enrolled(cfg)
    except SystemExit as e:
        _log(str(e))
        return 1

    # Start the action executor in the background so approved actions
    # from the Wrayth UI get picked up between hourly posture reports.
    # When an action succeeds we set `posture_refresh_event` so the main
    # loop re-snapshots on its next tick — the UI reflects the fix in
    # ~30s instead of waiting up to an hour.
    posture_refresh_event = threading.Event()
    if run_action_loop is not None and platform.system() == "Windows":
        t = threading.Thread(
            target=run_action_loop,
            args=(lambda: cfg, _log, posture_refresh_event.set),
            name="wrayth-actions",
            daemon=True,
        )
        t.start()
        _log("action executor started")

    HEARTBEAT_INTERVAL = 30       # seconds — keeps `last_seen_at` fresh
    POSTURE_INTERVAL = 3600       # seconds — full posture snapshot cadence
    last_posture_at = 0.0         # 0 → forces immediate posture on startup

    while True:
        now_ts = time.time()
        wait = HEARTBEAT_INTERVAL
        try:
            due = now_ts - last_posture_at >= POSTURE_INTERVAL
            refresh_requested = posture_refresh_event.is_set()
            if due or refresh_requested:
                # Small settle delay so Windows finishes applying the
                # change (e.g. Defender toggles) before we re-read it.
                if refresh_requested and not due:
                    time.sleep(3)
                posture_refresh_event.clear()
                posture = collect_posture()
                resp = ingest(cfg, posture)
                last_posture_at = now_ts
                _log(f"posture ok{' (post-action)' if refresh_requested and not due else ''}: {resp}")
            else:
                resp = ingest(cfg, {
                    "heartbeat": True,
                    "agent_version": AGENT_VERSION,
                    "hostname": socket.gethostname(),
                })
                _log(f"heartbeat ok: {resp}")
        except HTTPError as e:
            if e.code == 401:
                _log("server revoked this device — exiting.")
                try:
                    CONFIG_PATH.unlink(missing_ok=True)
                except Exception:
                    pass
                return 0
            _log(f"http error {e.code}: {e.reason}")
            wait = 60
        except URLError as e:
            _log(f"network error: {e}")
            wait = 60
        except Exception as e:  # noqa: BLE001
            _log(f"unexpected: {e}")
            wait = 60

        # Wake early if an action fires mid-wait so we can re-snapshot.
        posture_refresh_event.wait(timeout=max(5, wait))



if __name__ == "__main__":
    sys.exit(main())
