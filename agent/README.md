# Wrayth Device Agent

Read-only posture reporter. Runs on the user's Windows machine, collects
device hygiene facts (BitLocker, firewall, Defender, pending updates,
uptime, installed browsers), and posts them to Wrayth every hour.

## What it does not do

- No remote execution, no remediation, no file access beyond the checks below.
- No screen capture, keystroke logging, or process listing.
- No data collection when the server revokes the device — the agent self-cleans.

## Local files

| Path (Windows) | Purpose |
| --- | --- |
| `%PROGRAMDATA%\Wrayth\wrayth-config.json` | Persistent config: `api_base`, `device_id`, `device_token` |
| `%PROGRAMDATA%\Wrayth\agent.log` | Rolling log |

`wrayth-config.json` shipped next to the EXE (per-user download bundle)
is read on first launch, then migrated into `%PROGRAMDATA%\Wrayth\`.

## Enrollment

1. User clicks **Install agent** in Wrayth → server mints an enrollment
   code (15-min TTL, one-time).
2. Web app produces a ZIP containing `WraythAgent.exe` +
   `wrayth-config.json` (holds `enrollment_code` + `api_base`).
3. Agent redeems the code → receives long-lived `device_token`, stores it
   in `%PROGRAMDATA%\Wrayth\`, immediately posts first check-in.

## Building locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r build-requirements.txt
pyinstaller --clean --noconfirm wrayth_agent.spec
# Output: dist\WraythAgent.exe
```

## CI

`.github/workflows/build-agent.yml` builds `WraythAgent.exe` on every
push to `main` that touches `agent/**`, and attaches it to a GitHub
Release whenever a tag matching `agent-v*` is pushed.

Cut a release:

```bash
git tag agent-v0.1.0
git push origin agent-v0.1.0
```
