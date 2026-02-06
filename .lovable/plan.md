

# Add Softr-Style AI Capabilities to AI Studio

## Overview

Softr's standout AI features center around three core capabilities that differentiate it from basic chatbot builders:

1. **Ask AI (Data-Aware Chat)** -- An AI chat interface that reads live app data and answers questions about it in real time
2. **Database AI Agents** -- Autonomous agents that auto-fill, enrich, and transform database fields using AI (with web search)
3. **Vibe Coding Blocks** -- AI-generated UI components with CRUD actions connected to live data sources

These capabilities would transform AI Studio from a "custom GPT chatbot builder" into a **full-stack AI app builder** for MSPs and businesses.

---

## What Will Be Built

### 1. Ask AI -- Data-Connected Chat Mode

A new GPT mode that allows custom GPTs to query the user's live Supabase data and answer questions about it.

- Toggle in GPT settings: "Enable Data Insights"
- Connect a GPT to specific Supabase tables (tickets, agents, atlas_documents, etc.)
- Users ask natural language questions ("How many open tickets do I have?" / "Which devices are offline?") and AI responds with real answers from their data
- Respects user permissions -- only queries data belonging to the authenticated user
- Suggested prompts shown based on connected data sources

**Where it lives:** New tab in GPT Settings called "Data Sources" + enhanced chat interface

### 2. Database AI Agents

Autonomous AI agents that can auto-fill, enrich, and transform database records without user interaction.

- **Agent Builder UI**: Create agents that run on specific tables with trigger conditions
- **Trigger Types**: On new record, on field update, on schedule, manual
- **Agent Actions**: Auto-tag/categorize, summarize text fields, enrich with web search, draft responses, extract structured data
- **Model Selection**: Choose between Gemini Flash (fast/cheap) and GPT-5 (accurate) per agent
- **Conditions & Filters**: Only run when specific fields are empty, match a pattern, or meet criteria
- **Credit Controls**: Per-agent credit budgets to prevent runaway costs
- **Ready-Made Templates**: Lead enrichment, ticket auto-tagger, document summarizer, product cataloger

**Where it lives:** New top-level section in AI Studio: "AI Agents"

### 3. AI App Blocks (Vibe Coding Blocks)

Embeddable AI-generated UI components that users can describe in natural language and deploy.

- Describe a component in plain text ("Create a dashboard showing my ticket stats by priority")
- AI generates a React component preview
- Connect to live data sources for dynamic rendering
- Supports CRUD operations (create, update, delete records)
- Embeddable via iframe or script tag (extends existing embed/deploy system)

**Where it lives:** New section in GPT Deploy panel: "AI Blocks"

### 4. AI Workflows (Softr-style Transform Data actions)

Simple workflow chains that can be attached to GPTs.

- Define input triggers (form submission, webhook, schedule)
- Add transformation steps (AI summarize, AI classify, AI extract, AI translate)
- Output to database fields, email, webhook, or Slack
- Visual workflow builder with drag-and-drop steps

**Where it lives:** New tab in GPT Settings: "Workflows"

---

## Technical Plan

### Phase 1: Ask AI -- Data-Connected Chat

**New files:**
- `src/components/gpt/GPTDataSources.tsx` -- UI to connect GPT to Supabase tables, select which tables/columns are queryable
- `supabase/functions/ai-data-query/index.ts` -- Edge function that receives a natural language question, generates a safe SQL query via AI, executes it, then has AI narrate the results
- Update `GPTSettingsPanel.tsx` to add "Data Sources" tab
- Update `GPTChatInterface.tsx` to show data-insight badges and suggested data prompts

**Database changes:**
- New table `gpt_data_sources` (gpt_id, table_name, allowed_columns, is_enabled, created_at)

**How it works:**
1. User connects tables to their GPT in settings
2. When chatting, the system prompt includes the table schemas
3. AI generates a read-only SQL query, which is validated and executed server-side
4. Results are fed back to the AI to generate a natural language answer

### Phase 2: Database AI Agents

**New files:**
- `src/components/ai-studio/AIAgentsHub.tsx` -- Main agents dashboard listing all configured agents
- `src/components/ai-studio/AIAgentBuilder.tsx` -- Create/edit agent with trigger, conditions, model, prompt, output mapping
- `src/components/ai-studio/AIAgentTemplates.tsx` -- Pre-built agent templates
- `src/components/ai-studio/AIAgentRunHistory.tsx` -- Execution logs with status, credits used, results
- `supabase/functions/ai-agent-execute/index.ts` -- Edge function that executes an agent's logic (query data, run AI, write results back)

**Database changes:**
- New table `ai_agents` (id, user_id, name, description, target_table, trigger_type, trigger_config, conditions, model, system_prompt, output_mapping, credit_budget, is_enabled, created_at)
- New table `ai_agent_runs` (id, agent_id, status, input_data, output_data, credits_used, error, created_at)

**Template library (10+ pre-built agents):**
- Ticket Auto-Tagger (tickets table)
- Lead Enrichment (contacts)
- Document Summarizer (atlas_documents)
- Alert Classifier (realtime_alerts)
- Password Audit (atlas_passwords -- flag weak/old)
- Device Health Reporter (vanguard_agents)
- Compliance Gap Finder (compliance_frameworks)
- SLA Risk Predictor (tickets)
- Knowledge Base Gap Detector (knowledge_sources)
- Invoice Categorizer (billing data)

### Phase 3: AI App Blocks

**New files:**
- `src/components/gpt/GPTAppBlocks.tsx` -- Describe and generate embeddable UI blocks
- `src/components/gpt/AppBlockPreview.tsx` -- Live preview of generated blocks
- Extend `GPTDeployPanel.tsx` with block embed codes

### Phase 4: AI Workflows

**New files:**
- `src/components/ai-studio/AIWorkflowBuilder.tsx` -- Visual workflow editor
- `src/components/ai-studio/WorkflowStepConfig.tsx` -- Configure individual steps (AI transform, filter, output)
- `supabase/functions/ai-workflow-execute/index.ts` -- Executes workflow chains

**Database changes:**
- New table `ai_workflows` (id, user_id, gpt_id, name, steps, trigger_config, is_enabled, created_at)
- New table `ai_workflow_runs` (id, workflow_id, status, step_results, credits_used, created_at)

---

## Route and Navigation Updates

- `/ai-studio/agents` -- AI Agents Hub
- `/ai-studio/agents/new` -- Agent Builder
- `/ai-studio/agents/:id` -- Agent Detail / Edit
- `/ai-studio/workflows` -- Workflow Hub
- Update AI Studio sidebar/dashboard to include Agents and Workflows sections

---

## Credit Integration

All new features integrate with the existing AI Capacity credit system:
- Data queries: 1x multiplier (standard)
- Agent executions: 1.5x multiplier (automated)
- Workflow runs: 2x multiplier (multi-step)
- App block generation: 2x multiplier (complex)

---

## Implementation Priority

Given the scope, I recommend building in this order:

1. **Ask AI (Data Sources)** -- Highest impact, builds on existing chat infrastructure
2. **Database AI Agents** -- Core differentiator vs. competitors, template-driven
3. **AI Workflows** -- Extends agents with chaining
4. **AI App Blocks** -- Most complex, can come later

Phases 1 and 2 will be implemented first, with Phases 3 and 4 following as a second pass.

