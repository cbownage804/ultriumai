

## Add "RustDesk Required" Notice for Technicians

### What this does
Adds a clear, persistent banner to the Remote Access areas so technicians know they must have RustDesk installed on their own computer before they can use the "Remote In" / "Connect" buttons. Includes a direct download link.

### Where the notice will appear
1. **RemoteAccessPanel** (device detail page) -- a small info banner above the Connect button
2. **RustDeskIntegration** (Remote Desktop page) -- a notice card at the top, before the device table
3. **VanguardDeviceDetails** -- a small note near the "Remote In" button

### What the banner will say
Something like:

> **RustDesk must be installed on this computer**
> To remote into devices, you need RustDesk installed locally so your browser can launch it. [Download RustDesk](https://rustdesk.com/download)

- Dismissible via localStorage so it doesn't annoy techs who already have it installed
- Uses the existing `ModuleIntroBanner` component for consistency (orange accent, "Guide" badge)

### Technical Details

**Files to modify:**

1. **`src/components/vanguard/device/RemoteAccessPanel.tsx`**
   - Import `ModuleIntroBanner` from the shared module instructions
   - Add a `ModuleIntroBanner` at the top of `CardContent`, before the providers list, with:
     - Title: "RustDesk Required on Your Computer"
     - Description: "To use Remote In, RustDesk must be installed on the computer you're working from."
     - Features: ["Download from rustdesk.com/download"]
     - docsUrl pointing to `https://rustdesk.com/download`
     - storageKey: `rustdesk-local-install-notice`
     - accentColor: `orange`

2. **`src/components/vanguard/RustDeskIntegration.tsx`**
   - Add a similar `ModuleIntroBanner` at the top of the page (after the header, before the stats grid)
   - Same messaging and download link

3. **`src/components/vanguard/VanguardDeviceDetails.tsx`**
   - Add a small text note or `ModuleIntroBanner` near the "Remote In" button area so techs see the requirement in context

