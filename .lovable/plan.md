# Reposition Wrayth around Ray and outcomes

This is a copy + information-architecture change across five surfaces, not a visual redesign. Tokens, layout, and components stay as they are — the words, feature lists, tiers, and section structure change.

## The message

- Category: "AI-powered cybersecurity platform" (not "security tools").
- Core promise: "Your AI security analyst never sleeps."
- Mental model: Monitoring is included. Ray is always available. AI-heavy workloads (already gated by Ray Compute) stay separate.
- Kill everywhere: "Vault", "Watch", "Scan" as product names in marketing; "Ray messages / month"; "voice minutes"; per-scan quotas exposed to customers. Replace with capability names: AI Security Analyst, Threat Investigation, Exposure Monitoring, Endpoint Protection, Identity Monitoring, Weekly Executive Brief, Device Remediation, Microsoft 365 Security, Company Knowledge, AI Recommendations.

## Pricing tiers (single source of truth)

| Tier | Price | Positioning |
| --- | --- | --- |
| Free | $0 | Try Ray. 1 device, 2 identities, limited threat analysis, no remediation, no M365, no memory. |
| Pro | $15 / month | Individuals & power users. 5 devices, 10 identities, unlimited threat analysis, Windows agent, recommendations, one-click safe fixes, weekly brief. |
| Business | $39 / user / month | Flagship. Unlimited devices & identities, M365, Teams + Slack, Org Memory, Company Knowledge, daily + weekly exec briefs, approval workflows, full remediation, audit, release channels, white-label, priority support. |
| Enterprise | Contact Sales | Governance story only — SSO, SCIM, multi-org, RBAC, custom AI policies, custom Ray skills, private models (future), SIEM, API, compliance reporting, dedicated CSM, unlimited admins/orgs. |

Enterprise card is deliberately different: no price, no feature grid overlap — a governance narrative + "Talk to sales" CTA.

## Files changed

1. `src/pages/pricing/WraythPricing.tsx` — rewrite the four tier cards with the table above; drop scan/message/voice quotas; add capability-named bullets; new hero copy.
2. `src/pages/safesuite/SafeSuiteLanding.tsx` — new hero ("Your AI Security Analyst Never Sleeps." + subtext) and add four sections:
   - **Everything Ray Watches** — chip grid: Devices, Passwords, Threats, Dark Web, Microsoft 365, Software, Windows Updates, Browser Extensions, Startup Programs, Network Exposure, Local Admins, BitLocker, Firewall, Defender, Secure Boot, TPM, RDP, Services, Ports, Compliance.
   - **What Makes Wrayth Different** — four "Traditional tools X / Ray Y" contrast rows.
   - **One-Click Remediation** — action list: Enable BitLocker, Enable Firewall, Install Updates, Run Defender Scan, Disable RDP, Remove Local Admin, Lock Device, Sign Out User, Update Defender, Disable Browser Password Manager.
   - **Ray Works Everywhere** — Inside Wrayth, Microsoft Teams, Slack, Weekly Briefs, Daily Digests.
   - **What Ray Never Sees / What Ray Does Monitor** — two-column privacy panel.
3. `src/pages/safesuite/SafeSuiteFeatures.tsx` — replace Vault/Watch/Scan-labeled feature blocks with the capability names listed above.
4. `src/pages/safesuite/SafeSuiteBilling.tsx` — align tier names, prices, and included-features text with the new pricing table; remove exposed quota meters for messages/scans (keep device / identity / seat counts).
5. `src/pages/safesuite/WraythEnterprise.tsx` — rework as the governance pitch (SSO, SCIM, multi-org, RBAC, custom policies, SIEM, compliance, dedicated CSM). Remove any "Business + more" framing.
6. `src/pages/onboarding/RayOnboarding.tsx` — swap product-name copy ("SafePass vault", "SafeScan") for outcomes ("Password monitoring", "Threat analysis"); keep the flow and steps intact.

## Non-goals

- No changes to `AiCredits.tsx` (Ray Compute page just landed; its taxonomy already matches).
- No changes to backend `subscription_tiers` / Stripe products in this pass. Copy first; if the DB tier names need to follow, that's a separate migration.
- No visual redesign, no palette / typography changes.
- Quota limits (10 URL scans / month on Free, etc.) stay real in code where they already gate features — the change is not exposing them as headline "Ray messages / month"–style meters. Free-tier caps on scans and identities remain visible because they define the plan.

## After implementation

I'll run `tsgo --noEmit` and open the pricing and landing pages in the preview so you can spot-check copy before I touch onboarding.
