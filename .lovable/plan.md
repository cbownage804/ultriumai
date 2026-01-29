

# Next Priority Tasks for Vanguard Production Readiness

Based on my analysis, here are the remaining items ordered by impact and effort:

---

## Priority 1: Data Export (SafeSuiteSettings.tsx)

**Current State:** Line 53-56 has a `TODO` placeholder:
```typescript
const handleExportData = async () => {
  toast.info('Preparing data export...');
  // TODO: Implement data export
};
```

**Implementation Plan:**
1. Create an edge function `safesuite-data-export` that:
   - Fetches all user's SafePass passwords (encrypted)
   - Fetches breach monitoring history
   - Fetches 2FA backup codes (encrypted)
   - Packages as encrypted JSON with user's master password derivation
   
2. Update `handleExportData` to call the edge function and trigger a download

**Effort:** ~1 hour | **Impact:** High (GDPR/data portability compliance)

---

## Priority 2: Email Integration (Notification Engine)

**Current State:** The `vanguard-notification-engine` has a placeholder for email:
```typescript
async function sendEmail(to: string[], subject: string, body: string): Promise<boolean> {
  // In production, integrate with SendGrid, Resend, or AWS SES
  console.log(`[Email] Sending to ${to.join(', ')}: ${subject}`);
  return true; // Just logs, doesn't actually send
}
```

**Implementation Plan:**
1. Add `RESEND_API_KEY` secret to the project
2. Implement actual email sending using Resend API (simpler than SendGrid)
3. Add branded HTML email templates for:
   - Security alerts
   - Breach notifications
   - Weekly reports

**Effort:** ~1 hour | **Impact:** High (enables all email notifications)

---

## Priority 3: Console.log Cleanup

**Current State:** 
- 1,000+ `console.log`/`console.error` statements across 93+ files
- A `devLog` utility already exists in `src/lib/logger.ts`

**Implementation Plan:**
1. Use find-and-replace to migrate console statements to `devLog`:
   - `console.log(` → `devLog.log(`
   - `console.error(` → `devLog.error(`
   - `console.warn(` → `devLog.warn(`
   
2. Add import statement to affected files:
   ```typescript
   import { devLog } from '@/lib/logger';
   ```

3. This ensures logs are dev-only (except errors which always log)

**Effort:** ~2 hours | **Impact:** Medium (cleaner production console)

---

## Priority 4: Empty State Polish

**Current State:** 42 files have generic empty states like:
- "No data available"
- "No metrics data"
- "No tickets in queue"

**Implementation Plan:**
1. Create a reusable `<EmptyState>` component with:
   - Contextual icon
   - Helpful message explaining why it's empty
   - Primary CTA button (e.g., "Add your first device")
   - Optional secondary CTA

2. Update high-visibility components first:
   - VanguardDashboard (main overview)
   - DeviceManagement (device list)
   - TicketList (helpdesk)
   - SecurityAlerts (SOC)

**Effort:** ~2 hours | **Impact:** Medium (better UX for new users)

---

## Suggested Order of Execution

| # | Task | Effort | Impact |
|---|------|--------|--------|
| 1 | Data Export | 1 hr | High |
| 2 | Email Integration | 1 hr | High |
| 3 | Console.log Cleanup | 2 hrs | Medium |
| 4 | Empty State Polish | 2 hrs | Medium |

**Total estimated time:** ~6 hours

---

Which task would you like me to implement first? I recommend starting with **Data Export** or **Email Integration** since they're high-impact and relatively quick.

