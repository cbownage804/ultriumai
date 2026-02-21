

# Auto-Connect Registrar Detection for App Builder Domains

## What This Does
When a user enters a domain in the App Builder settings, the system will automatically detect their DNS provider (like Cloudflare, GoDaddy, Namecheap, etc.) and show a multi-step setup flow -- just like the Lovable screenshot you shared.

## How It Works

### Step-by-step flow after clicking "Connect Domain":
1. **Analyzing phase** -- A modal overlay appears showing progress steps:
   - "Analyzed [domain]" (with checkmark)
   - "Detected DNS provider: **Cloudflare**" (with checkmark + bold provider name)
   - "Getting your setup details." (spinner)
2. **Provider detected** -- Shows the provider's logo/icon, a message about one-time authorization, and:
   - A primary "Open [Provider] DNS Settings" button (links to their DNS management page)
   - A "Go to our manual setup" link (falls back to showing the raw DNS records)
   - A "Change provider" and "Show added DNS records" links at the bottom
3. **Provider not detected** -- Falls back to manual DNS record setup (current behavior)

### Technical Changes

**File: `ProjectSettingsModal.tsx`**
- Add `import { supabase }` for calling the edge function
- Add new state: `registrarInfo`, `isAnalyzing`, `analysisStep` (tracks which step of the animation we're on), `showManualSetup`
- Modify `handleAddDomain`:
  1. After domain validation, set `isAnalyzing = true` and create the domain entry
  2. Call `supabase.functions.invoke('detect-registrar', { body: { domain } })`
  3. Animate through the analysis steps with short delays (matching Lovable's UX)
  4. Store the registrar result on the domain entry
  5. Show the provider authorization panel or fall back to manual
- Extend `DomainEntry` interface with optional `registrar` field (name, icon, dnsUrl, instructions)
- Add a new "analyzing" overlay UI that renders inside the domain detail area
- Add provider panel UI with branded header, "Open DNS Settings" button, manual setup link
- Add "Detect Provider" button on existing domains that don't have a detected registrar

**No backend changes needed** -- the `detect-registrar` edge function already exists and supports GoDaddy, Cloudflare, Namecheap, Google Domains, Name.com, Hover, Route 53, Vercel, and Netlify.

### UI Matching Lovable's Design
- Analysis overlay with animated checkmarks and spinner for each step
- Provider card with icon, name, and "Auto-detected" badge
- Numbered step-by-step instructions from the provider-specific response
- Direct link button to open the provider's DNS settings page
- "Manual setup" fallback link to show raw DNS records
- "Change provider" link at the bottom

