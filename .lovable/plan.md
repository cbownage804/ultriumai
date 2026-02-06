

# Strategic Module Add-Ons & MSP Reseller Program

## Part 1: Reselling to MSPs & IT Companies

### Current State
Your Vanguard pricing already targets MSPs with per-technician plans (Pro $109, Growth $159, Power $189), but the **resale opportunity** is about letting MSPs white-label and resell your modules to *their* clients. This is the real revenue multiplier.

### Recommended Reseller Architecture

**MSP Partner Program (3 Tiers)**

| Tier | Monthly Commitment | Discount | White-Label | Co-Branding |
|------|-------------------|----------|-------------|-------------|
| Silver Partner | 10+ seats | 15% off | No | UltriumAI badge |
| Gold Partner | 25+ seats | 25% off | Partial | Your logo + "Powered by" |
| Platinum Partner | 50+ seats | 35% off | Full | Complete white-label |

**Key Reseller Features to Build:**
- **Bulk Licensing Dashboard** - MSPs purchase seat blocks at wholesale, assign to clients
- **Margin Calculator** - Shows MSPs their profit at different markups (e.g., buy at $8/user, sell at $15/user)
- **Client Provisioning API** - Auto-create isolated client tenants with selected modules
- **Reseller Billing Portal** - MSPs manage their client subscriptions, see MRR, churn
- **Marketing Kit Generator** - Co-branded collateral, proposals, and slide decks

---

## Part 2: Module Add-On Strategy

### Proposed Add-On Pricing Matrix

Each Vanguard module becomes a standalone purchasable add-on. The base plans include core modules, and everything else is upsellable:

| Module | Category | Per-User/Mo | Included In |
|--------|----------|-------------|-------------|
| **Pursuit XDR** | Security | $8 | Power+ |
| **Sentinel SaaS** | Security | $6 | Power+ |
| **Recon Pentest** | Security | $12 | Enterprise only |
| **Cortex AI** | AI | $5 | Growth+ |
| **Comply** | Compliance | $7 | Power+ |
| **Cross-Client SOC** | Intelligence | $10 | Enterprise only |
| **Atlas Documentation** | Operations | $3 | Growth+ |
| **Phishing Sim** | Security | $4 | Power+ |

**Strategic Bundling:**
- "Security Bundle" (Pursuit + Sentinel + Comply) = $18 vs $21 a la carte (save 15%)
- "Complete SOC" (All security + Cross-Client) = $35 vs $43 (save 20%)

---

## Part 3: Social Media Integration with Module Logos

### What Changes

**1. Add Vanguard module logos to the watermark system**

Update the `generate-social-image` edge function's `PRODUCT_LOGOS` and `PRODUCT_KEYWORDS` maps to include every Vanguard module:

```
horizon -> vanguard-horizon-logo.png
pursuit -> vanguard-pursuit-logo.png  
response -> vanguard-response-logo.png
sentinel -> vanguard-sentinel-logo.png
recon -> vanguard-recon-logo.png
cortex -> vanguard-cortex-logo.png
comply -> vanguard-comply-logo.png
atlas -> vanguard-atlas-logo.png
```

**2. Add Vanguard module content types to the AI Post Generator**

New "Vanguard Modules" group in `AIPostGenerator.tsx`:

- Horizon RMM - "Endpoint management & patch automation"
- Pursuit XDR - "Advanced threat detection & response"
- Response PSA - "Helpdesk & service management"
- Sentinel SaaS - "SaaS security monitoring"
- Recon Pentest - "Vulnerability assessment & pentesting"
- Cortex AI - "AI-powered IT intelligence"
- Comply - "Compliance lifecycle management"
- Atlas Docs - "IT documentation & knowledge base"

Each content type maps to its module's color theme and visual style, and auto-watermarks the generated image with that module's logo.

**3. Add visual styles per module**

Each module gets a custom visual prompt style matching its brand colors:
- Horizon = Cyan command center aesthetic
- Pursuit = Red/crimson threat hunting visuals
- Sentinel = Orange/amber SaaS monitoring dashboards
- Recon = Indigo penetration testing imagery
- etc.

**4. "MSP Marketing Mode" toggle in the AI Post Generator**

A new toggle that switches the generator into reseller-focused content:
- Generates posts positioning modules as value-adds for MSP clients
- Uses business-impact language ("increase MRR", "reduce churn", "upsell opportunity")
- Auto-includes ROI statistics and competitive positioning
- Watermarks with the Vanguard Suite logo instead of individual modules

---

## Technical Implementation Plan

### Files to Create
1. `src/config/vanguardAddons.ts` - Module add-on pricing, bundling logic, and reseller tiers
2. `src/pages/vanguard/VanguardPartnerProgram.tsx` - Reseller dashboard with margin calculator, bulk licensing, and marketing kit access
3. Module logo assets uploaded to `logos/` storage bucket (8 Vanguard module logos)

### Files to Edit
1. **`supabase/functions/generate-social-image/index.ts`** - Add Vanguard module entries to `PRODUCT_LOGOS`, `PRODUCT_KEYWORDS`, `CONTENT_TYPE_TO_PRODUCT`, and `VISUAL_STYLES`
2. **`src/components/social/AIPostGenerator.tsx`** - Add "Vanguard Modules" content type group with all 8 modules, plus "MSP Marketing Mode" toggle
3. **`src/config/vanguardPricing.ts`** - Expand `ADDONS` array from 2 items to include all modules with per-user pricing
4. **`src/pages/vanguard/VanguardSuite.tsx`** - Update the product modules list and pricing tiers to reflect the new add-on structure
5. **`src/components/vanguard/VanguardNavigation.tsx`** - Add "Partner Program" link under a new business/sales section

### Edge Function Changes
- **`generate-social-image`** - 8 new logo mappings, 8 new keyword sets, 8 new visual style prompts
- **`generate-social-post`** - Add MSP marketing mode context to system prompt when toggled

