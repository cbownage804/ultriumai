

# SafePass Multi-Account Switching & AI Autofill Plan

## Overview
Implement two key features from Keeper's latest release to make SafePass more competitive:
1. **Instant Account Switching** - Switch between multiple SafePass accounts without logging out
2. **SafePassAI Autofill** - Intelligent form detection and credential filling (within the app context)

---

## Feature 1: Instant Account Switching

### What It Does
Users can link multiple SafePass accounts (e.g., personal + work) and switch between them instantly from the header dropdown, without needing to sign out and sign back in.

### User Experience
- Click avatar in header to see all linked accounts
- One-click to switch to another account
- "Add Account" option to link additional accounts
- Remove accounts from the quick-switch list
- Each account maintains its own master password session

### Implementation

#### 1.1 Database: Linked Accounts Table
Create a new table to store linked account relationships:

```text
Table: safepass_linked_accounts
- id (uuid, primary key)
- primary_user_id (uuid, FK to auth.users) -- the "host" account
- linked_email (text) -- email of the linked account
- linked_user_id (uuid, FK to auth.users) -- resolved user id
- display_name (text) -- friendly name like "Work" or "Personal"
- is_active (boolean)
- last_accessed_at (timestamp)
- created_at (timestamp)
```

#### 1.2 New Components

| Component | Purpose |
|-----------|---------|
| `AccountSwitcher.tsx` | Dropdown showing linked accounts with switch/add/remove actions |
| `AddAccountDialog.tsx` | Modal to authenticate and link a new account |
| `useLinkedAccounts.ts` | Hook to manage linked accounts state and switching |

#### 1.3 Account Switch Flow

```text
User clicks account in dropdown
          |
          v
    Store current session to localStorage cache
          |
          v
    Check if target account session exists in cache
          |
          v
   [YES] Restore session from cache -> Reload vault
          |
   [NO] Prompt for master password of target account
          |
          v
    Decrypt and load target account's vault
```

#### 1.4 Security Considerations
- Each account's session is encrypted separately in localStorage
- Master passwords are NEVER stored - only session tokens with TTL
- Switching requires re-entering master password if session expired
- Clear all cached sessions on explicit sign-out

---

## Feature 2: SafePassAI Autofill

### What It Does
Within SafePass, AI analyzes form fields and context to suggest the most relevant credentials, especially useful when:
- Multiple credentials exist for the same domain
- Detecting which "account type" is being logged into
- Multi-step authentication flows

### Implementation Approach
Since SafePass is a web app (not a browser extension), this feature will focus on:
- **Credential Suggestion Intelligence** - When user searches or views a login form URL, suggest the best matching entry
- **Pattern Recognition** - Learn from user behavior which credentials they prefer for which contexts
- **Smart Search** - Natural language search of the vault ("my work gmail", "banking login")

#### 2.1 New Components

| Component | Purpose |
|-----------|---------|
| `SafePassAISearch.tsx` | Smart search bar with AI-powered suggestions |
| `AutofillSuggestions.tsx` | Context-aware credential recommendations |
| `useSafePassAI.ts` | Hook for AI-powered matching logic |

#### 2.2 Settings Addition
Add to SafePassSettings.tsx:

```text
SafePassAI Section:
- Toggle: Enable SafePassAI suggestions
- Toggle: Learn from my usage patterns
- Button: Clear learned patterns
```

#### 2.3 AI Matching Logic (Client-Side)
Uses local pattern matching (no server AI calls needed):

```text
1. Fuzzy match on title, URL, tags
2. Rank by last_used_at recency
3. Rank by usage frequency (new field)
4. Learn user preference patterns:
   - "User selected Entry A over Entry B for domain X" -> boost A for X
```

---

## Technical Summary

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/safepass/AccountSwitcher.tsx` | Account switching dropdown |
| `src/components/safepass/AddAccountDialog.tsx` | Dialog to link new account |
| `src/components/safepass/SafePassAISearch.tsx` | AI-powered smart search |
| `src/components/safepass/AutofillSuggestions.tsx` | Credential suggestions panel |
| `src/hooks/useLinkedAccounts.ts` | Manage linked accounts |
| `src/hooks/useSafePassAI.ts` | AI matching and learning logic |

### Files to Modify
| File | Changes |
|------|---------|
| `src/layouts/SafePassLayout.tsx` | Integrate AccountSwitcher in header |
| `src/pages/safesuite/SafePassSettings.tsx` | Add SafePassAI settings section |
| `src/components/safepass/PasswordVault.tsx` | Add smart search integration |

### Database Changes
| Table | Purpose |
|-------|---------|
| `safepass_linked_accounts` | Store multi-account relationships |
| `safepass_entries` (add column) | `usage_count` for AI ranking |
| `safepass_user_preferences` | Store learned patterns for AI |

---

## Implementation Order

1. **Phase 1: Multi-Account Switching**
   - Create database table for linked accounts
   - Build AccountSwitcher component
   - Add to header layout
   - Implement session caching and switching logic

2. **Phase 2: SafePassAI Features**
   - Add smart search to vault
   - Implement local pattern matching
   - Add settings toggles
   - Track usage patterns for ranking

---

## Notes
- The Keeper browser extension features (DOM parsing, autofill injection) require a browser extension, which is outside Lovable's scope
- This implementation focuses on the web app experience with intelligent credential management
- All AI processing is client-side to maintain zero-knowledge architecture

