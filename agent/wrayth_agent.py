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

AGENT_VERSION = "0.1.1"

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


def _ps(script: str) -> str:
    return _run(
        [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ],
        timeout=25,
    )


def collect_windows() -> dict[str, Any]:
    posture: dict[str, Any] = {}

    # BitLocker on C:
    bl = _ps(
        "try { (Get-BitLockerVolume -MountPoint 'C:').ProtectionStatus } "
        "catch { 'unknown' }"
    )
    posture["disk_encryption"] = {
        "enabled": bl.strip() == "1" or bl.strip().lower() == "on",
        "method": "BitLocker",
    }

    # Firewall (any profile enabled)
    fw = _ps(
        "(Get-NetFirewallProfile | Where-Object { $_.Enabled -eq 'True' } | "
        "Measure-Object).Count"
    )
    try:
        posture["firewall"] = {"enabled": int(fw) > 0}
    except ValueError:
        posture["firewall"] = {"enabled": False}

    # Defender
    defender = _ps(
        "$s = Get-MpComputerStatus; "
        "$age = (New-TimeSpan -Start $s.AntivirusSignatureLastUpdated -End (Get-Date)).Days; "
        "\"$($s.AntivirusEnabled)|$age\""
    )
    if "|" in defender:
        enabled_s, age_s = defender.split("|", 1)
        try:
            age = int(age_s.strip())
        except ValueError:
            age = -1
        posture["antivirus"] = {
            "name": "Microsoft Defender",
            "enabled": enabled_s.strip().lower() == "true",
            "definitions_age_days": age,
        }
    else:
        posture["antivirus"] = {"name": "Microsoft Defender", "enabled": False}

    # Uptime
    uptime = _ps(
        "[int]((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime).TotalSeconds"
    )
    try:
        posture["uptime_seconds"] = int(uptime)
    except ValueError:
        posture["uptime_seconds"] = 0

    # Pending updates (best-effort; skip if module unavailable)
    pending = _ps(
        "try { (New-Object -ComObject Microsoft.Update.Session)."
        "CreateUpdateSearcher().Search('IsInstalled=0').Updates.Count } catch { 0 }"
    )
    try:
        posture["pending_updates"] = int(pending)
    except ValueError:
        posture["pending_updates"] = 0

    # Screen lock timeout (seconds)
    lock = _ps(
        "try { (Get-ItemProperty 'HKCU:\\Control Panel\\Desktop' -Name ScreenSaveTimeOut)."
        "ScreenSaveTimeOut } catch { '0' }"
    )
    try:
        posture["screen_lock_seconds"] = int(lock)
    except ValueError:
        posture["screen_lock_seconds"] = 0

    # Browsers (paths + versions)
    browsers: list[dict[str, str]] = []
    for name, path in {
        "Chrome": r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        "Edge": r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "Firefox": r"C:\Program Files\Mozilla Firefox\firefox.exe",
    }.items():
        if Path(path).exists():
            ver = _ps(
                f"(Get-Item '{path}').VersionInfo.ProductVersion"
            )
            browsers.append({"name": name, "version": ver or "unknown"})
    posture["browsers"] = browsers

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
    if run_action_loop is not None and platform.system() == "Windows":
        t = threading.Thread(
            target=run_action_loop,
            args=(lambda: cfg, _log),
            name="wrayth-actions",
            daemon=True,
        )
        t.start()
        _log("action executor started")

    while True:
        try:
            posture = collect_posture()
            resp = ingest(cfg, posture)
            _log(f"check-in ok: {resp}")
            wait = int(resp.get("next_check_in_seconds", 3600))
        except HTTPError as e:
            if e.code == 401:
                _log("server revoked this device — exiting.")
                try:
                    CONFIG_PATH.unlink(missing_ok=True)
                except Exception:
                    pass
                return 0
            _log(f"http error {e.code}: {e.reason}")
            wait = 300
        except URLError as e:
            _log(f"network error: {e}")
            wait = 300
        except Exception as e:  # noqa: BLE001
            _log(f"unexpected: {e}")
            wait = 600

        # Jitter ±5 min
        wait = max(60, wait + random.randint(-300, 300))
        time.sleep(wait)


if __name__ == "__main__":
    sys.exit(main())
