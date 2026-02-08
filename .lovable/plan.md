

# AI Studio Dashboard Redesign — App Builder as Centerpiece

## The Problem
The current dashboard is a grid of equally-weighted elements (stat cards, activity feed, quick-start links, onboarding wizard) that treat the App Builder as just one of many options. Nothing draws the user toward the core product.

## The New Layout

The redesigned dashboard will follow a clear visual hierarchy:

### 1. Hero App Builder CTA (Top — Full Width)
A prominent, visually striking card that dominates the top of the page. It will feature:
- A bold headline like "Build your next app" with a large text input or button to start a new project
- A gradient background (violet-to-cyan) to visually distinguish it from everything else
- A single primary action: "Start Building" that navigates directly to `/ai-studio/app-builder`
- Optionally shows the user's most recent project with a "Continue Building" shortcut

### 2. Recent Projects Row (Below Hero)
A horizontal row of project cards (from `builder_projects`) showing the user's recent App Builder projects. Each card shows the project name, last modified time, and a quick "Open" action. If no projects exist, this section shows a friendly empty state encouraging the user to create their first app.

### 3. Secondary Tools Section (Below Projects)
A compact, single row of smaller cards for the other AI Studio tools — GPTs, Agents, Workflows. These are still accessible but visually subordinate to the App Builder. Presented as a simple grid of 3 cards with icon + label + count.

### 4. Condensed Stats + Activity (Bottom)
The stats (credits, counts) and recent activity feed are collapsed into a smaller, less prominent section at the bottom — or moved into an expandable "Activity" panel so they don't clutter the main view.

### 5. Onboarding Wizard
The existing onboarding wizard will be simplified or replaced with the hero CTA itself. First-time users will see the hero with a "Get Started" prompt, removing the need for a separate multi-step wizard taking up half the page.

## Technical Details

### Files Modified
- **`src/components/ai-studio/AIStudioDashboardHub.tsx`** — Complete redesign of the component layout with the hierarchy described above
- **`src/components/ai-studio/AIStudioOnboardingWizard.tsx`** — Simplified or removed; its purpose is absorbed by the hero CTA
- **`src/pages/AIStudio.tsx`** — Remove the conditional onboarding wizard render since the dashboard itself handles first-time UX

### Data
- Reuses existing Supabase queries (`builder_projects`, `org_credits`, `custom_gpts`, `ai_agents`)
- Adds a query for recent `builder_projects` with `name`, `updated_at` to populate the projects row

### No new dependencies required

