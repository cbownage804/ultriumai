

## Fix: C# Build Error in RustDeskInstaller.cs

### Problem
The GitHub Actions build fails with:
> **Line 487**: A local or parameter named 'serviceOk' cannot be declared in this scope because that name is used in an enclosing local scope

In `TryInstallViaDirectDownloadAsync()`, the variable `serviceOk` is declared twice:
- Line 487 (inside an `if (IsRustDeskInstalled())` block after MSI install)
- Line 570 (at the method level after EXE fallback install)

C# does not allow a variable in an inner block to shadow one in an enclosing scope within the same method.

There are also 3 null-dereference warnings at lines 701, 702, and 1597.

### Fix

**1. Rename the inner `serviceOk` variables to avoid the scope conflict:**

In `TryInstallViaDirectDownloadAsync()` (line 487), rename to `msiServiceOk`:
```csharp
var msiServiceOk = await EnsureRustDeskServiceInstalledAsync();
if (msiServiceOk)
```

This also applies to the same pattern in `TryInstallViaWingetAsync()` (line 358) and `TryInstallViaChocolateyAsync()` (line 409) -- those may not currently error since they're in separate methods, but renaming them for consistency is good practice.

**2. Address the null-dereference warnings (lines 701, 702, 1597):**

Add null checks or use the null-conditional operator (`?.`) where the compiler flags possible null references. I'll inspect those lines during implementation and add appropriate guards.

### Files to Modify
- `VanguardAgent/Services/RustDeskInstaller.cs` -- rename shadowed variable, fix null warnings

