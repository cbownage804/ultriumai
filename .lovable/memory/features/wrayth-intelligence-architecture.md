---
name: Wrayth Intelligence architecture
description: Wrayth Intelligence product group, its flagship Deep Threat Investigation feature, and Ray Compute consumption rules
type: feature
---
Wrayth is organized as two product groups: **Protection** (monitoring/security, always included with plan) and **Intelligence** (on-demand AI reasoning, consumes Ray Compute).

## Sidebar structure
- Home / Vault / Threats / Exposure / Organization / Clients live under the top "Protection" section (unlabelled main group).
- "Intelligence" is a separate labeled section. Currently one entry: Investigations at `/app/intelligence/investigations`. Future: Attack Paths, Reports, Compliance, Policies — all under `/app/intelligence/*`.

## Naming rules
- Say "Wrayth Intelligence", never "AI features" or "Compute features".
- Frame Ray as the actor: "Ray watches / explains / investigates / recommends / fixes / documents".
- Monitoring is included. Intelligence uses Compute.

## Deep Threat Investigation (flagship)
- Route: `/app/intelligence/investigations`
- Page: `src/pages/safesuite/IntelligenceInvestigations.tsx`
- Edge function: `supabase/functions/ray-investigate` (verify_jwt = true)
- Table: `public.ray_investigations` (RLS: user_id = auth.uid())
- Cost: **3 Ray Compute per run** (stored on the row as `cost_ray_compute`)
- Model: `google/gemini-2.5-flash` via Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`, Bearer LOVABLE_API_KEY). Matches project convention in ray-brief/ray-chat.
- Input types (10): url, email, email_headers, ip, domain, file_hash, powershell, event_log, defender_alert, m365_alert.
- Structured output: verdict (benign/suspicious/malicious/inconclusive), confidence, confidence_score, summary, executive_summary, technical_findings[], mitre[], iocs[], recommended_response[], timeline[], evidence{}.
- Ray must stay grounded — no invented IOCs / WHOIS / MITRE IDs / breach history. System prompt enforces this.

## Roadmap (do not build until Investigations proves itself)
Phase 2: Attack Path Reasoning. Phase 3: Executive/Incident Reports. Phase 4: Compliance Gap Analysis (CIS/NIST first). Phase 5: Security Policy Generator. Don't scaffold empty pages — build one exceptional feature, ship, learn, reuse the engine.
