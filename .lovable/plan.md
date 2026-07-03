# Wrayth v0.6 — Ray Intelligence Engine

Consolidate the intelligence surface into one platform sharing a single pipeline, finish the missing modules (2, 4, 5, 6, 7), expand Module 1's input & enrichment coverage, and land the unified Intelligence Hub.

## What's already shipped (do not rebuild)

- **M1 Deep Threat Investigation** — URL, email, IP, domain, hash inputs; IOC extraction; MITRE mapping; confidence; executive + technical summary; recommended response; permanent record; follow-up actions; "Why Ray thinks this."
- **M3 Executive Reports** — generated per investigation (`executive_summary`).
- **M8 Incident Summary** — investigation `summary`.
- **M9 Attack Path Reasoning** — chain, blast radius, remediation planner.
- **M10 Board Reports** — 7/30/90-day cross-investigation digests, PDF export.
- **Bonus** — IOC correlation (`ray_ioc_index`), Investigation Graph, threat clustering.

## Shared pipeline (built once, used by every module)

Every intelligence module routes through the same server-side pipeline so evidence, MITRE mappings, memory, and recommendations are never duplicated.

```text
input → evidence extractor → security graph (ray_entities/relationships)
      → reasoning (LLM) → org memory (ray_org_memory / ray_ioc_index)
      → MITRE knowledge → recommendation engine → report generator
```

Implementation: extract the current investigation edge function's reusable phases into `supabase/functions/_shared/ray-pipeline.ts` (`extractEvidence`, `enrichIocs`, `reason`, `writeMemory`, `emitRecommendations`, `renderReport`). Every new module composes these; nothing calls the LLM directly.

## New modules

### M2 — Malware Behavior Analysis
- Route: `/app/intelligence/malware`
- Input: script/binary text OR file hash.
- Output: behaviors, MITRE IDs, likelihood %, risk, suggested response.
- Table: `ray_malware_analyses` (linked to `ray_investigations` when triggered from one).
- Cost: 4 credits.

### M4 — Security Policy Generator
- Route: `/app/intelligence/policies`
- Pick policy type (10) × standards (CIS/NIST/HIPAA/SOC2/ISO27001).
- Editable rich-text output; export DOCX + PDF.
- Table: `ray_policies` (title, type, standards, body_md, org_id).
- Cost: 10 credits.

### M5 — Compliance Gap Analysis
- Route: `/app/intelligence/compliance`
- Two modes: upload existing policies OR analyze live Wrayth data.
- Output: per-control pass/fail with evidence, overall %, remediation roadmap.
- Table: `ray_compliance_scans` + `ray_compliance_findings`.
- Cost: 15 credits.

### M6 — Large Log Analysis
- Route: `/app/intelligence/logs`
- Accept EVTX, CSV, Sentinel/Defender export, syslog, IIS, Apache, VPN, firewall.
- Client-side chunking (50k lines/chunk) → map-reduce summarization edge function.
- Output: observed events, top IPs/users, timeline, recommendations.
- Table: `ray_log_analyses` (file_name, byte_count, summary_json).
- Cost: 5 credits.

### M7 — Script Analysis
- Route: `/app/intelligence/scripts`
- Paste PowerShell/Batch/Bash/Python/JS.
- Output: purpose, safety, risk, MITRE, indicators, network/registry/file/persistence changes, plain-English explanation.
- Reuses M2's edge function with a `mode: 'script'` flag.
- Cost: 2 credits.

## Module 1 expansions

- Add input types: `email_headers`, `zip`, `attachment`, `powershell`, `event_log`, `defender_alert`, `m365_alert`.
- Add enrichers (best-effort, degrade gracefully): VirusTotal (if secret set), WHOIS, passive DNS, SPF/DKIM/DMARC parser for header inputs.
- Enrichers live in `_shared/enrichers/` and are called during `extractEvidence`.

## Intelligence Hub

New landing at `/app/intelligence` with:
- Grid of module tiles (Investigations, Malware, Logs, Scripts, Incident Reports, Executive Reports, Board Reports, Compliance, Policies, Attack Paths, Graph).
- "Recent activity" feed (unions the module tables).
- Reorganize sidebar: single **AI Intelligence** section with 11 items; sub-items collapsible.

## Ray Compute pricing

Wire the credit cost table into `ai_credit_ledger` per module. Every module page shows cost before running.

## Sprint breakdown

1. **Sprint A — foundation:** extract shared pipeline; Intelligence Hub landing; sidebar reorg.
2. **Sprint B — M7 + M2:** script/malware behavior (share one function).
3. **Sprint C — M6:** large log analysis with chunking.
4. **Sprint D — M4:** policy generator + DOCX export.
5. **Sprint E — M5:** compliance gap analysis.
6. **Sprint F — M1 expansion:** new input types + enrichers.

Each sprint ends with a shipped, usable feature — no half-built modules.

## Technical notes

- New tables all follow existing RLS pattern (`user_id`, `org_id`, `authenticated`+`service_role` grants, has_role for admin).
- All edge functions use `google/gemini-2.5-flash` by default; escalate to `google/gemini-2.5-pro` for M5/M9 (compliance + attack paths) where reasoning depth matters.
- File uploads (EVTX, ZIP, attachments) go through a private storage bucket `ray-intelligence-uploads` with 7-day auto-expiry.
- DOCX export via `docx` package; PDF continues to use `wraythPdf.ts`.
- Hub feed is a single view `ray_intelligence_activity` unioning the module tables.

## Out of scope for v0.6

- Real-time collaboration on investigations.
- Custom MITRE overlays / user-authored playbooks.
- Cross-tenant intelligence sharing.

## Suggested starting point

Sprint A (foundation + hub) — smallest, highest leverage, unlocks every later sprint. Want me to start there, or pick a specific module to build first?
