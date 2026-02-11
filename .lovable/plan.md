

## MeshCentral as Primary Remote Access + RustDesk as Backup

### Overview
Add MeshCentral as the primary zero-touch remote access solution. MeshCentral runs entirely in the browser (no local install needed on the technician's side) and supports passing credentials programmatically. RustDesk stays as a backup for attended access scenarios.

### How MeshCentral Works (for context)
- You self-host a MeshCentral server (Node.js-based, single binary)
- A lightweight MeshAgent is installed on endpoints (similar to current RustDesk agent install)
- Technicians connect via a **web browser** -- no client software needed
- The server handles authentication, so the "Remote In" button simply opens a URL like `https://mesh.yourdomain.com/#/device/NODEID` with the technician already logged in via token
- True zero-touch: click button, see desktop. No passwords to paste.

### What Changes

**1. Database -- new columns on `vanguard_agents`**
- `meshcentral_node_id TEXT` -- the MeshCentral node ID reported by the agent
- `meshcentral_mesh_id TEXT` -- the mesh/group the device belongs to

**2. New Edge Function: `vanguard-meshcentral-auth`**
- Generates a short-lived MeshCentral login token for the current technician
- Returns a URL like `https://mesh.yourdomain.com/login?token=XYZ&gotonode=NODEID&viewmode=desktop`
- Uses the MeshCentral admin credentials stored as Supabase secrets (`MESHCENTRAL_URL`, `MESHCENTRAL_ADMIN_USER`, `MESHCENTRAL_ADMIN_PASS`)

**3. New config file: `src/config/vanguardMeshCentral.ts`**
- Stores the MeshCentral server URL (similar to `vanguardRemoteAccess.ts`)
- Helper functions: `isMeshCentralConfigured()`, `getMeshCentralDesktopUrl()`

**4. Update `RemoteAccessPanel.tsx`**
- Add MeshCentral as the first/default tab (primary)
- "Connect" button for MeshCentral opens a new browser tab directly to the MeshCentral web console with auto-login token -- true zero-touch
- RustDesk tab remains as "Backup / Attended Access"
- Update the providers list and tab ordering

**5. Update `VanguardDeviceDetails.tsx`**
- "Remote In" button now defaults to MeshCentral (opens browser tab)
- Falls back to RustDesk if MeshCentral node ID isn't available
- Remove the password-clipboard logic from the primary flow

**6. Update `RustDeskIntegration.tsx`**
- Rename to something like "Remote Desktop" page
- Show MeshCentral as primary with a device table
- Keep RustDesk section below as "Backup Remote Access"

**7. Update `vanguardRemoteAccess.ts`**
- Add `meshcentral` to `REMOTE_ACCESS_PROVIDERS`

**8. Update `.NET Agent: RustDeskInstaller.cs`** (or new `MeshCentralInstaller.cs`)
- Add a new service class that downloads and installs MeshAgent
- MeshAgent install is a single command: `meshagent -install -meshurl=wss://mesh.yourdomain.com -meshid=MESHID`
- Reports the `meshcentral_node_id` back to Vanguard API on heartbeat
- RustDesk installer remains unchanged (backup)

**9. Update banners/notices**
- Remove "RustDesk Required on Your Computer" banners since MeshCentral is browser-based
- Add a setup guide banner if MeshCentral server isn't configured yet

### Technical Details

**Migration (DB):**
```sql
ALTER TABLE public.vanguard_agents 
ADD COLUMN IF NOT EXISTS meshcentral_node_id TEXT,
ADD COLUMN IF NOT EXISTS meshcentral_mesh_id TEXT;
```

**Edge Function (`vanguard-meshcentral-auth`):**
- Accepts `{ node_id: string }` from authenticated technician
- Calls MeshCentral API: `POST /api/gettoken` with admin creds to generate a short-lived user token
- Returns `{ url: "https://mesh.server/login?token=...&gotonode=...&viewmode=12" }`

**Remote In button flow:**
1. Technician clicks "Remote In"
2. Frontend calls `vanguard-meshcentral-auth` edge function with the device's `meshcentral_node_id`
3. Edge function returns a one-time URL
4. Frontend opens URL in new tab -- technician sees remote desktop immediately

**Agent changes (summary):**
- New `MeshCentralInstaller.cs` service: downloads MeshAgent MSI, runs silent install with mesh server URL and mesh ID
- Heartbeat payload updated to include `meshcentral_node_id` (read from MeshAgent config file after install)
- RustDesk install continues in parallel as fallback

### File Summary
| File | Action |
|------|--------|
| `supabase/migrations/new.sql` | Add `meshcentral_node_id`, `meshcentral_mesh_id` columns |
| `supabase/functions/vanguard-meshcentral-auth/index.ts` | New -- generates login token + URL |
| `src/config/vanguardMeshCentral.ts` | New -- MeshCentral config constants |
| `src/config/vanguardRemoteAccess.ts` | Add MeshCentral provider |
| `src/components/vanguard/device/RemoteAccessPanel.tsx` | Add MeshCentral as primary tab |
| `src/components/vanguard/VanguardDeviceDetails.tsx` | "Remote In" defaults to MeshCentral |
| `src/components/vanguard/RustDeskIntegration.tsx` | Rename/restructure as unified Remote Desktop page |
| `VanguardAgent/Services/MeshCentralInstaller.cs` | New -- MeshAgent install + config |
| `VanguardAgent/Services/RustDeskInstaller.cs` | No changes (stays as backup) |

### Prerequisites (your side)
1. Deploy a MeshCentral server (can run on a small VPS, Docker, or same server as RustDesk relay)
2. Add Supabase secrets: `MESHCENTRAL_URL`, `MESHCENTRAL_ADMIN_USER`, `MESHCENTRAL_ADMIN_PASS`
3. Create a mesh group in MeshCentral for Vanguard devices
4. Rebuild the .NET agent MSI after adding `MeshCentralInstaller.cs`

