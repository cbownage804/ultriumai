

## Recon Hardware Page Redesign: Organization-Aware Management View

### Problem
The Recon Hardware page (`/vanguard/app/recon`) is currently a static product landing/purchase page. It needs to become a management dashboard that:
1. Shows the user's organizations (Sites) to choose from
2. Displays owned Recon hardware assigned to each organization
3. Falls back to the purchase portal if no hardware is owned
4. The "ubuntu" agent (device `vanguard-823d22f7`) should appear as a Recon unit under the Ultrium organization

### Data Context
- 3 MSP clients exist: KWC CPAs, Tegrity Marketing, Ultrium
- 3 agents exist: "ubuntu" (no client_id), "R15" (assigned to Ultrium), "R16" (no client_id)
- The "ubuntu" agent needs its `client_id` set to Ultrium's ID and potentially its `agent_type` updated to identify it as a recon unit
- `recon_inventory` and `recon_orders` tables exist for tracking hardware lifecycle

### Implementation

#### 1. Update the "ubuntu" agent record
- Set `client_id` to Ultrium's ID (`e0cd8626-2490-4cae-8ed1-2aa41b439ac6`)
- Add a distinguishing marker (e.g., tag or naming convention) so it can be identified as a Recon unit

#### 2. Redesign `ReconProductPage.tsx` into a dual-mode page
The page will check if the authenticated user has any Recon orders or inventory. If yes, show the management view. If no, show the existing purchase landing page.

**Management View Layout:**
- **Organization Selector** (top): Dropdown or card grid showing the user's MSP clients/sites
- **Selected Organization Panel**: 
  - Lists Recon units assigned to that organization (from `recon_inventory` joined with `vanguard_agents` via `agent_id` or `client_id`)
  - Shows unit status, serial number, firmware version, last heartbeat
  - "Add Recon Unit" button links to the purchase flow
- **No Units State**: If the selected organization has no units, show a CTA to purchase one

#### 3. Create `ReconHardwareManagement.tsx` component
- Fetches organizations from `msp_clients` for the current user
- Fetches Recon-related agents (linux/pi agents or agents linked to recon inventory) per organization
- Displays device cards with status, specs, and quick actions
- Includes a "Purchase New Unit" button that scrolls to or navigates to the existing pricing section

#### 4. Link agents to Recon inventory
- Query `vanguard_agents` where the agent is a Recon unit (by OS type, name pattern, or linked `recon_inventory.agent_id`)
- Cross-reference with `recon_inventory` for serial numbers, activation keys, and hardware tier info
- Display combined data per organization

### Technical Details

**New file:** `src/components/vanguard/recon/ReconHardwareManagement.tsx`
- Fetches `msp_clients` for org list
- Fetches `vanguard_agents` filtered to recon-type devices, joined by `client_id`
- Fetches `recon_inventory` for hardware metadata
- Renders org selector and per-org device cards

**Modified file:** `src/pages/vanguard/ReconProductPage.tsx`
- Add auth check: if logged in and has recon hardware, render `ReconHardwareManagement`
- If not logged in or no hardware, render existing landing page
- Keep purchase flow accessible via a button within the management view

**Database update:** Assign "ubuntu" agent to Ultrium
- `UPDATE vanguard_agents SET client_id = 'e0cd8626-...' WHERE id = '053b0bc1-...'`

### User Flow

```text
User visits Recon Hardware
       |
   Logged in?
   /        \
  No         Yes
  |           |
Landing    Has Recon units?
Page       /        \
          No         Yes
          |           |
        Landing    Org Selector
        Page       -> Unit Cards
                   -> Purchase More
```

