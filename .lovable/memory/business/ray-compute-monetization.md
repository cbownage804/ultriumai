---
name: Ray Compute Monetization Model
description: AI credits are branded "Ray Compute" and only bill for premium AI operations, never for core monitoring/conversations/briefs
type: feature
---
Credits sold in Wrayth are branded **Ray Compute** (not "AI Credits"). Sidebar label and /app/credits page both use this name.

**What consumes Ray Compute (premium AI):**
- Deep threat investigations (URL/header/SPF/DKIM/DMARC/WHOIS/VirusTotal/passive DNS)
- Executive incident reports (PDF, MITRE ATT&CK, exec + technical summary)
- Policy generation (password, IR, AUP, AI gov, HIPAA, SOC 2)
- Compliance analysis vs SOC 2 / HIPAA / PCI / CIS / NIST
- Remediation plans (with time, impact, rollback, comms, approval, window)
- Board / MSP / exec briefings
- Security coaching ("Explain Zero Trust")
- Log analysis, PowerShell generation, documentation generation

**Always included in the plan — NEVER charge credits for these:**
Ray conversations, monitoring, recommendations, daily/weekly briefs, device monitoring, threat monitoring, M365 monitoring, endpoint agent, timeline, organization memory, security alerts.

**Framing rule:** "Most of Wrayth is unlimited. Ray Compute is only used for advanced AI tasks that need significantly more processing power." Never nickel-and-dime users for asking Ray questions.

**Packs:** 5k/$10, 25k/$35 (highlighted), 100k/$99, 500k/$399. All non-expiring. Bonus credits used last.

**ai_credit_ledger.usage_type values** map to human labels via USAGE_LABELS in src/pages/safesuite/AiCredits.tsx: deep_investigation, executive_report, threat_analysis, policy_generation, compliance_analysis, remediation_plan, briefing, security_coach, log_analysis, powershell, documentation.
