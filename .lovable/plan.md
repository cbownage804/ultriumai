
# Auto-Build System for Vanguard Agents

## Overview
Create a fully automated build and distribution system that compiles the Windows EXE agent via GitHub Actions and hosts it for direct download from the Ultrium platform.

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Repository                           │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ VanguardAgent/  │    │ .github/        │                     │
│  │  (C# Source)    │───▶│  workflows/     │                     │
│  └─────────────────┘    │   build.yml     │                     │
│                         └────────┬────────┘                     │
└────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │  GitHub Actions Runner   │
                    │  (Windows-latest)        │
                    │                          │
                    │  1. Build .NET 8 EXE     │
                    │  2. Sign binaries (opt)  │
                    │  3. Create Release       │
                    │  4. Upload artifacts     │
                    └───────────┬──────────────┘
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
         ┌─────────────────┐      ┌─────────────────────┐
         │ GitHub Releases │      │ Supabase Storage    │
         │ VanguardAgent-  │      │ (Optional CDN)      │
         │ v1.0.0.exe      │      │                     │
         └────────┬────────┘      └─────────────────────┘
                  │
                  ▼
         ┌─────────────────────────────────────────┐
         │  Frontend (VanguardSetup.tsx)           │
         │  ┌───────────────────────────────────┐  │
         │  │ Download Windows Bundle           │  │
         │  │ → Fetches EXE from GitHub Release │  │
         │  │ → Bundles with user's config.json │  │
         │  │ → Generates complete ZIP          │  │
         │  └───────────────────────────────────┘  │
         └─────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: GitHub Actions Workflow

**File: `.github/workflows/build-vanguard-agent.yml`**

Creates automated build pipeline that:
- Triggers on push to `VanguardAgent/` directory or manual dispatch
- Runs on Windows runner with .NET 8 SDK
- Builds self-contained single-file EXE
- Creates GitHub Release with versioned artifacts
- Outputs:
  - `VanguardAgent.exe` (single-file, ~40MB)
  - `VanguardAgent-win-x64.zip` (complete package)
  - SHA256 checksums for verification

### Phase 2: Multi-Platform Build Matrix

Expand the workflow to build for multiple targets:
- `win-x64` (Windows 64-bit)
- `win-arm64` (Windows ARM)
- `linux-x64` (Linux 64-bit, optional)

### Phase 3: Frontend Integration

**Updates to `src/utils/generateWindowsAgentZip.ts`**

1. Fetch pre-built EXE from GitHub Releases API
2. Bundle the binary with user-specific `config.json`
3. Include installer scripts
4. Generate complete downloadable ZIP

**Updates to `src/pages/VanguardSetup.tsx`**

1. Add download progress indicator
2. Show build version/date from GitHub Release
3. Fallback messaging if build is unavailable

### Phase 4: Supabase Storage CDN (Optional)

For faster downloads, optionally mirror releases to Supabase Storage:
- Edge function triggered by GitHub webhook
- Copies releases to `storage/vanguard-releases/`
- Provides CDN-accelerated downloads

---

## Technical Details

### GitHub Actions Workflow

```yaml
# .github/workflows/build-vanguard-agent.yml
name: Build Vanguard Agent

on:
  push:
    paths:
      - 'VanguardAgent/**'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version tag (e.g., 1.0.0)'
        required: true
        default: '1.0.0'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET 8
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      
      - name: Restore dependencies
        run: dotnet restore VanguardAgent/VanguardAgent.csproj
      
      - name: Build & Publish
        run: |
          dotnet publish VanguardAgent/VanguardAgent.csproj `
            -c Release `
            -r win-x64 `
            --self-contained true `
            -p:PublishSingleFile=true `
            -p:IncludeNativeLibrariesForSelfExtract=true `
            -o ./dist
      
      - name: Create Release Package
        run: |
          Copy-Item VanguardAgent/config.json ./dist/
          Copy-Item VanguardAgent/README.md ./dist/
          Compress-Archive -Path ./dist/* -DestinationPath VanguardAgent-win-x64.zip
      
      - name: Generate Checksums
        run: |
          Get-FileHash ./dist/VanguardAgent.exe -Algorithm SHA256 | 
            Format-List | Out-File checksums.txt
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: vanguard-agent-windows
          path: |
            ./dist/VanguardAgent.exe
            ./VanguardAgent-win-x64.zip
            ./checksums.txt

  release:
    needs: build-windows
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    steps:
      - name: Download Artifacts
        uses: actions/download-artifact@v4
        with:
          name: vanguard-agent-windows
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ github.event.inputs.version }}
          name: Vanguard Agent v${{ github.event.inputs.version }}
          files: |
            VanguardAgent.exe
            VanguardAgent-win-x64.zip
            checksums.txt
          body: |
            ## Vanguard Agent v${{ github.event.inputs.version }}
            
            Enterprise RMM agent for Windows systems.
            
            ### Downloads
            - **VanguardAgent.exe** - Single-file executable
            - **VanguardAgent-win-x64.zip** - Complete package with installer
            
            ### Installation
            1. Download the ZIP and extract
            2. Run `install.bat` as Administrator
            3. Configure credentials in the Ultrium dashboard
```

### Updated ZIP Generator

```typescript
// src/utils/generateWindowsAgentZip.ts

const GITHUB_RELEASE_URL = 
  'https://github.com/YOUR_ORG/YOUR_REPO/releases/latest/download/VanguardAgent.exe';

export async function generateWindowsAgentZip(options: WindowsAgentZipOptions): Promise<Blob> {
  const { userId, apiEndpoint, secretKey, deviceName } = options;

  // Fetch the pre-built EXE from GitHub Releases
  const exeResponse = await fetch(GITHUB_RELEASE_URL);
  if (!exeResponse.ok) {
    throw new Error('Failed to fetch agent executable');
  }
  const exeBlob = await exeResponse.blob();

  const zip = new JSZip();

  // Include the actual EXE binary
  zip.file('VanguardAgent.exe', exeBlob);

  // User-specific config
  zip.file('config.json', JSON.stringify({
    user_id: userId,
    secret_key: secretKey,
    device_name: deviceName,
    api_endpoint: apiEndpoint,
    // ... other config
  }, null, 2));

  // Installer scripts
  zip.file('install.bat', INSTALL_BAT);
  zip.file('install.ps1', INSTALL_PS1);
  zip.file('uninstall.bat', UNINSTALL_BAT);
  zip.file('README.md', WINDOWS_README);

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
```

### Frontend Download with Progress

```typescript
// In VanguardSetup.tsx
const [downloadProgress, setDownloadProgress] = useState(0);

const handleDownloadWindowsZip = async () => {
  setIsDownloadingWindows(true);
  setDownloadProgress(0);
  
  try {
    // Show fetching EXE progress
    setDownloadProgress(10);
    toast.info('Fetching latest agent build...');
    
    const blob = await generateWindowsAgentZip({
      userId: user.id,
      apiEndpoint: API_ENDPOINT,
      secretKey: VANGUARD_SECRET,
      deviceName: 'Vanguard-Windows',
    });
    
    setDownloadProgress(90);
    downloadBlob(blob, 'vanguard-agent-windows.zip');
    setDownloadProgress(100);
    toast.success('Download complete!');
  } catch (error) {
    toast.error('Failed to generate download. Build may be in progress.');
  } finally {
    setIsDownloadingWindows(false);
  }
};
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.github/workflows/build-vanguard-agent.yml` | Create | GitHub Actions build pipeline |
| `VanguardAgent/VanguardAgent.csproj` | Modify | Add version info, ensure build config |
| `src/utils/generateWindowsAgentZip.ts` | Modify | Fetch EXE from GitHub Releases |
| `src/pages/VanguardSetup.tsx` | Modify | Add progress indicator, version display |
| `VanguardAgent/Resources/vanguard.ico` | Create | Application icon (placeholder) |

---

## Deployment Flow

1. **Code Push**: Any changes to `VanguardAgent/` trigger the build
2. **Build**: GitHub Actions compiles on Windows runner
3. **Artifacts**: EXE uploaded as build artifact for testing
4. **Release**: Manual workflow dispatch creates versioned release
5. **Download**: Users get latest EXE bundled with their credentials

---

## Security Considerations

- EXE is built in a clean GitHub Actions environment
- SHA256 checksums published with each release
- Code signing can be added with a certificate (optional future enhancement)
- User credentials are added at download time, never baked into the EXE
