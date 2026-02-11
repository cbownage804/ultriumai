

## Fix: RustDesk Unattended Service Installation

### Problem
The screenshot shows RustDesk running in **portable mode** (yellow "Install" banner visible, one-time password shown). This means:
1. `--silent-install` either failed silently or didn't complete properly
2. The permanent password was never applied (still showing one-time password)
3. The `RustDesk2.toml` approve-mode settings are being ignored because there's no service context

### Root Cause
The current code runs `--silent-install` but doesn't verify it actually completed the service registration. RustDesk's `--silent-install` can silently fail if:
- The installer process exits before the service is fully registered
- The EXE was downloaded to a temp folder that gets cleaned up before installation finishes
- UAC elevation wasn't properly inherited

### Solution

**1. Fix the installation sequence in `RustDeskInstaller.cs`:**

- After `--silent-install`, add a polling loop that waits up to 60 seconds for the RustDesk service to appear in `sc query`
- If `--silent-install` doesn't produce a service, fall back to running `rustdesk.exe --install-service` explicitly
- Add a final fallback: manually create the service via `sc.exe create` pointing to the installed-path RustDesk executable (not the temp download)

**2. Fix the password and config timing:**

- Move the password (`--password`) and config (`RustDesk2.toml`) steps to AFTER the service is confirmed running -- currently they can fire before the service exists
- After setting the password, verify it took effect by checking if `RustDesk2.toml` contains `verification-method = 'use-permanent-password'` in the service profile path
- Add a service restart after all config is written

**3. Add post-install verification logging:**

- Log the exact service state after installation (`sc query RustDesk`)
- Log which config paths were successfully written
- Log whether `--password` CLI returned success
- Report the final RustDesk ID back to confirm end-to-end success

### Technical Details

Key changes to `VanguardAgent/Services/RustDeskInstaller.cs`:

**a) `EnsureRustDeskServiceInstalledAsync()` -- add retry/verification loop:**
```csharp
// Poll for service registration after --silent-install
for (int i = 0; i < 12; i++) // 60 seconds total
{
    await Task.Delay(5000);
    var (sc, out, _) = await RunProcessAsync("sc.exe", "query RustDesk", ...);
    if (sc == 0 && out.Contains("RustDesk")) break;
}
```

**b) Move config/password AFTER confirmed service start:**
```csharp
// In the main install flow:
// 1. Download + --silent-install
// 2. Poll until service exists (new)
// 3. THEN configure relay + password + RustDesk2.toml
// 4. Restart service
// 5. Verify final state (new)
```

**c) Use the INSTALLED exe path for `--password`, not the temp download path:**
The current code uses `FindRustDeskExePath()` which is correct, but if RustDesk installed to `C:\Program Files\RustDesk\`, we need to make sure we're calling that copy -- not the temp EXE.

**d) Add post-install verification method:**
```csharp
private async Task<bool> VerifyUnattendedAccessConfigured()
{
    // Check: service exists and running
    // Check: RustDesk2.toml has approve-mode = 'password'
    // Check: permanent password is set (not one-time)
    // Log all findings for remote diagnostics
}
```

### Files to Modify
- `VanguardAgent/Services/RustDeskInstaller.cs` -- fix install sequence, add verification

### After Implementation
You'll need to rebuild the MSI and redeploy to a test device. The agent logs will now show exactly what happened at each step, making it easy to diagnose if anything still fails.

