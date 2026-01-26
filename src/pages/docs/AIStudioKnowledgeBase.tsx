import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, Bot, Sparkles, MessageSquare, Settings, Palette, Brain, 
  ChevronRight, ArrowLeft, BookOpen, HelpCircle, ListChecks, CheckCircle2,
  Code, BarChart3, Share2, Key, Upload, History, Sliders, Zap, Users,
  FileText, Globe, Lock, Play, Download, PenTool
} from "lucide-react";

// AI Studio Topics Data
const topics = [
  {
    id: "getting-started",
    name: "Getting Started",
    tagline: "Create your first custom GPT",
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    articles: [
      {
        id: "create-first-gpt",
        title: "Creating Your First Custom GPT",
        type: "guide",
        content: `
# Creating Your First Custom GPT

Build a custom AI assistant in just 5 minutes with AI Studio.

## Step 1: Open AI Studio
1. Log in to your UltriumAI account
2. Click **"AI Studio"** in the sidebar
3. Click **"Create New GPT"** or the **"+"** button

## Step 2: Choose Your Starting Point
- **Start from Scratch**: Build a completely custom GPT
- **Use a Template**: Choose from 36+ pre-built templates
- **Clone Existing**: Duplicate one of your existing GPTs

## Step 3: Configure Identity
1. **Name**: Give your GPT a memorable name
2. **Description**: Explain what your GPT does (2-3 sentences)
3. **Category**: Select the best fit (IT Support, Sales, Legal, etc.)
4. **Logo**: Upload an image or use the auto-generated avatar

## Step 4: Set Behavior
1. **System Prompt**: Write instructions for how your GPT should behave
2. **Personality**: Choose tone (Professional, Friendly, Technical)
3. **Response Style**: Set length and format preferences

> 💡 **Tip**: Be specific in your system prompt. Instead of "Be helpful," try "You are an IT helpdesk specialist who provides step-by-step troubleshooting guides for Windows and Mac issues."

## Step 5: Configure Capabilities
1. **Model**: Choose GPT-4o, Claude, or Gemini
2. **Web Search**: Enable for real-time information
3. **Anti-Hallucination**: Strict mode for factual responses
4. **Knowledge Base**: Upload documents for context

## Step 6: Customize Appearance
1. **Theme Color**: Pick your brand color
2. **Chat Bubble Style**: Round, Square, or Minimal
3. **Welcome Message**: First message shown to users
4. **Starter Questions**: Suggested prompts for users

## Step 7: Test & Deploy
1. Click **"Test GPT"** to try your creation
2. Refine based on responses
3. Click **"Save & Deploy"** when ready
4. Share via link, embed, or API
        `
      },
      {
        id: "template-library",
        title: "Using the Template Library",
        type: "guide",
        content: `
# Using the Template Library

AI Studio includes 36+ production-ready GPT templates.

## Browsing Templates
1. Go to **AI Studio → Templates**
2. Filter by category:
   - IT & Infrastructure
   - Cybersecurity
   - Software Development
   - Business Intelligence
   - Legal & Finance
   - Sales & Marketing
   - HR & Operations
   - Real Estate

## Installing a Template
1. Click on any template card
2. Review the features and use cases
3. Click **"Install Template"**
4. The GPT is now in your dashboard

## Customizing Installed Templates
All templates are fully editable after installation:
1. Go to **Your GPTs** and find the template
2. Click **"Settings"** or the gear icon
3. Modify any aspect:
   - Change the name and description
   - Edit the system prompt
   - Adjust capabilities
   - Update appearance

## Popular Templates

### IT Support GPT
- Tier 1 helpdesk automation
- Step-by-step troubleshooting
- Password reset workflows
- Software installation guides

### Security Analyst GPT
- Threat assessment
- Incident response procedures
- Log analysis assistance
- Compliance documentation

### Sales Assistant GPT
- Lead qualification
- Objection handling scripts
- Product knowledge base
- Meeting scheduling

### Legal Research GPT
- Contract analysis
- Compliance checking
- Case law research
- Document drafting
        `
      },
      {
        id: "dashboard-overview",
        title: "AI Studio Dashboard Overview",
        type: "guide",
        content: `
# AI Studio Dashboard Overview

Navigate the AI Studio interface efficiently.

## Main Dashboard
When you open AI Studio, you'll see:
- **Your GPTs**: All GPTs you've created or installed
- **Quick Stats**: Total GPTs, active chats, usage metrics
- **Recent Activity**: Latest conversations and updates

## Navigation Tabs

### Build Tab
Create and edit custom GPTs:
- GPT Creation Wizard
- Template Library
- Draft GPTs (work in progress)

### Chat Tab
Interact with your GPTs:
- Select any GPT to start chatting
- View conversation history
- Search past conversations

### Analytics Tab
Monitor performance:
- Message volume over time
- Response time metrics
- Token usage tracking
- User engagement stats

### Deploy Tab
Share and integrate:
- Public share links
- Embed widget code
- API endpoints
- Team sharing controls

### Settings Tab
Configure each GPT:
- Identity (name, description, logo)
- Behavior (system prompt, personality)
- Capabilities (model, tools, knowledge)
- Appearance (theme, welcome message)

## Quick Actions
- **New GPT**: Create from scratch
- **Quick Chat**: Jump into a conversation
- **View Analytics**: See performance overview
- **Browse Templates**: Find pre-built solutions
        `
      }
    ],
    faqs: [
      {
        q: "How many GPTs can I create?",
        a: "Free accounts can create up to 3 GPTs. Pro accounts have unlimited GPTs. Enterprise accounts include advanced features like white-labeling and priority support."
      },
      {
        q: "Can I use GPT-4, Claude, and Gemini?",
        a: "Yes! AI Studio supports multiple AI models. Select your preferred model in the GPT configuration. Pro users can access all models; free users are limited to GPT-4o-mini."
      },
      {
        q: "What's the difference between templates and custom GPTs?",
        a: "Templates are pre-configured GPTs with optimized prompts for specific use cases. They save setup time but are fully customizable after installation. Custom GPTs start from scratch."
      },
      {
        q: "Can I delete a GPT and its data?",
        a: "Yes, go to the GPT Settings → Danger Zone → Delete GPT. This permanently removes the GPT and all its conversation history. This action cannot be undone."
      }
    ]
  },
  {
    id: "configuration",
    name: "Configuration & Settings",
    tagline: "Fine-tune your GPT's behavior",
    icon: Sliders,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    articles: [
      {
        id: "system-prompts",
        title: "Writing Effective System Prompts",
        type: "guide",
        content: `
# Writing Effective System Prompts

The system prompt defines your GPT's personality, knowledge, and behavior.

## System Prompt Basics
The system prompt is a set of instructions that tells the AI:
- Who it is (role/persona)
- What it knows (expertise areas)
- How it should respond (format, tone, style)
- What it should/shouldn't do (guidelines, restrictions)

## Anatomy of a Great System Prompt

\`\`\`
You are [ROLE] specializing in [DOMAIN].

Your expertise includes:
- [Skill 1]
- [Skill 2]
- [Skill 3]

When responding:
- [Behavior guideline 1]
- [Behavior guideline 2]
- [Format preference]

Never:
- [Restriction 1]
- [Restriction 2]
\`\`\`

## Example: IT Support GPT

\`\`\`
You are an expert IT Support Specialist for a corporate environment.

Your expertise includes:
- Windows 10/11 and macOS troubleshooting
- Microsoft 365 administration
- Network connectivity issues
- Printer and hardware problems
- Password resets and account access

When responding:
- Always provide step-by-step instructions with numbered steps
- Ask clarifying questions before providing solutions
- Suggest both quick fixes and permanent solutions
- Reference relevant Microsoft or Apple documentation when applicable
- Estimate time required for each fix

Never:
- Recommend downloading software from unofficial sources
- Provide advice that requires admin credentials the user shouldn't have
- Suggest changes that could affect other users without approval
\`\`\`

## Pro Tips

### Be Specific
❌ "Be helpful with customer questions"
✅ "Help customers troubleshoot account issues by first asking for their email address, then checking their account status, and providing step-by-step solutions"

### Define Output Format
❌ "Write good responses"
✅ "Format all responses with: 1) A brief summary, 2) Detailed explanation, 3) Next steps if applicable"

### Set Boundaries
❌ (Nothing about restrictions)
✅ "If asked about topics outside your expertise, politely redirect to the appropriate department. Never guess on security-related matters."
        `
      },
      {
        id: "model-selection",
        title: "Choosing the Right AI Model",
        type: "guide",
        content: `
# Choosing the Right AI Model

Select the best model for your use case.

## Available Models

### GPT-4o (OpenAI)
**Best for**: General purpose, creative writing, complex reasoning
- Most versatile model
- Strong at following complex instructions
- Good code generation
- Higher token cost

### GPT-4o-mini (OpenAI)
**Best for**: High-volume, cost-sensitive applications
- Faster response times
- Lower cost per token
- Good for simple Q&A
- Limited complex reasoning

### Claude 3.5 Sonnet (Anthropic)
**Best for**: Long documents, nuanced analysis
- Excellent at reading comprehension
- Strong ethical reasoning
- Great for content moderation
- Very large context window

### Gemini Pro (Google)
**Best for**: Multimodal, real-time information
- Native Google integration
- Good with current events
- Strong multilingual support
- Efficient for simple tasks

## Comparison Chart

| Feature | GPT-4o | GPT-4o-mini | Claude 3.5 | Gemini Pro |
|---------|--------|-------------|------------|------------|
| Speed | Medium | Fast | Medium | Fast |
| Cost | High | Low | Medium | Low |
| Reasoning | Excellent | Good | Excellent | Good |
| Creativity | Excellent | Good | Very Good | Good |
| Code | Excellent | Good | Very Good | Good |
| Context | 128K | 128K | 200K | 32K |

## When to Use Each

**Customer Support**: GPT-4o-mini (fast, cost-effective)
**Legal Analysis**: Claude 3.5 (nuanced understanding)
**Code Generation**: GPT-4o (best code quality)
**Quick Answers**: Gemini Pro (fast, efficient)
**Complex Reasoning**: GPT-4o or Claude 3.5
        `
      },
      {
        id: "knowledge-base",
        title: "Uploading Knowledge Base Documents",
        type: "guide",
        content: `
# Uploading Knowledge Base Documents

Give your GPT access to your organization's documents.

## Supported File Types
- PDF documents
- Word documents (.docx)
- Text files (.txt)
- Markdown files (.md)
- Excel spreadsheets (.xlsx)
- PowerPoint presentations (.pptx)

## How to Upload Documents
1. Go to your GPT's **Settings → Knowledge Base**
2. Click **"Upload Documents"**
3. Select files (up to 50MB each, 500MB total)
4. Wait for processing (1-5 minutes)
5. Documents are now searchable by your GPT

## Best Practices

### Document Quality
- Use clear, well-formatted documents
- Avoid scanned images (OCR quality varies)
- Remove duplicate content
- Keep documents up to date

### Organization
- Group related documents together
- Use descriptive filenames
- Create a document index
- Remove outdated versions

### Content Tips
- Include FAQs for common questions
- Add step-by-step procedures
- Include examples and templates
- Reference internal terminology

## How It Works
1. Documents are chunked into searchable segments
2. When a user asks a question, relevant chunks are retrieved
3. The GPT uses this context to provide accurate answers
4. Sources are cited in responses

## Managing Documents
- **View**: See all uploaded documents
- **Search**: Find specific content
- **Delete**: Remove outdated documents
- **Replace**: Update with newer versions
- **Organize**: Create folders by topic
        `
      },
      {
        id: "appearance-theming",
        title: "Customizing Appearance & Themes",
        type: "guide",
        content: `
# Customizing Appearance & Themes

Make your GPT match your brand.

## Theme Color
1. Go to **Settings → Appearance → Theme Color**
2. Choose from presets or enter a hex code
3. Preview changes in real-time
4. Color applies to:
   - Avatar accent ring
   - User message bubbles
   - Primary buttons
   - Link highlights

## Logo & Avatar
1. **Upload Custom Logo**: Square image, 512x512px recommended
2. **Auto-Generated**: Uses first letter with theme color
3. **Icon Library**: Choose from built-in icons

## Chat Interface

### Welcome Message
The first message users see:
- Greet users by purpose, not just "Hello"
- Explain what the GPT can help with
- Keep it under 2-3 sentences

**Example**: "Hi! I'm your IT Support Assistant. I can help troubleshoot computer issues, guide you through software installations, and answer technical questions. What can I help you with today?"

### Starter Questions
Suggested prompts shown to new users:
- Add 3-4 relevant questions
- Cover different use cases
- Make them specific, not generic

**Good Examples**:
- "How do I reset my password?"
- "My computer is running slow, what should I check?"
- "How do I set up my email on a new phone?"

**Avoid**:
- "Tell me something"
- "What can you do?"
- Generic phrases

### Placeholder Text
The input field placeholder:
- Guide users on what to type
- Match your GPT's purpose

**IT Support**: "Describe your technical issue..."
**Sales**: "Ask about our products and pricing..."
**Legal**: "Enter your legal question..."

## White-Label Options (Pro)
- Remove UltriumAI branding
- Custom domain for embed
- Custom email sender
- Branded PDF exports
        `
      }
    ],
    faqs: [
      {
        q: "How long can my system prompt be?",
        a: "System prompts can be up to 4,000 characters (about 600-800 words). For longer instructions, upload a document to the knowledge base and reference it."
      },
      {
        q: "Can I test changes before publishing?",
        a: "Yes! Use the 'Test GPT' button to try your changes in a sandbox. Your published version remains unchanged until you click 'Save & Deploy'."
      },
      {
        q: "How often should I update my knowledge base?",
        a: "Update whenever your documentation changes. For fast-moving topics, consider enabling web search as a supplement. Delete outdated documents promptly."
      },
      {
        q: "Can I use custom CSS for the embed widget?",
        a: "Yes, Pro and Enterprise plans allow custom CSS injection for embedded widgets. Use the 'Custom Styles' section in Appearance settings."
      }
    ]
  },
  {
    id: "conversations",
    name: "Conversations & History",
    tagline: "Manage chat sessions and history",
    icon: MessageSquare,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    articles: [
      {
        id: "managing-conversations",
        title: "Managing Conversations",
        type: "guide",
        content: `
# Managing Conversations

Keep your chat history organized.

## Conversation Sidebar
The sidebar shows all your conversations:
- **Recent First**: Latest at the top
- **Search**: Find by keyword
- **Grouped**: By date (Today, Yesterday, This Week, etc.)

## Starting New Conversations
1. Click **"New Chat"** or the **"+"** button
2. A fresh conversation starts
3. Previous context is not carried over
4. Each conversation is independent

## Renaming Conversations
Conversations auto-title from your first message, but you can rename:
1. Hover over the conversation
2. Click the **pencil icon**
3. Enter a descriptive name
4. Press Enter to save

## Deleting Conversations
1. Hover over the conversation
2. Click the **trash icon**
3. Confirm deletion
4. This action cannot be undone

## Resuming Past Conversations
1. Click any conversation in the sidebar
2. Previous messages load automatically
3. Continue where you left off
4. Context is maintained within the session

## Exporting Conversations
1. Open the conversation
2. Click **"Export"** in the menu
3. Choose format:
   - PDF (formatted document)
   - Markdown (.md file)
   - JSON (raw data)
4. Download the file
        `
      },
      {
        id: "conversation-context",
        title: "Understanding Conversation Context",
        type: "guide",
        content: `
# Understanding Conversation Context

How your GPT remembers and uses context.

## What Is Context?
Context is the "memory" of your conversation:
- Previous messages in the current chat
- The GPT's system prompt
- Knowledge base documents
- Uploaded files (in that session)

## Context Window
Each AI model has a limited context window:
- **GPT-4o**: ~128,000 tokens
- **Claude 3.5**: ~200,000 tokens
- **Gemini Pro**: ~32,000 tokens

When you exceed the limit, older messages are dropped.

## How Context Works

### Within a Conversation
- All messages are remembered
- References to earlier topics work
- "As I mentioned earlier..." makes sense
- Context builds throughout the chat

### Across Conversations
- Each conversation is independent
- Starting a new chat = fresh context
- No memory of previous sessions
- System prompt is reloaded each time

## Maximizing Context Effectiveness

### Be Explicit
Instead of: "What about the other one?"
Say: "What about the Dell laptop issue from earlier?"

### Summarize Long Conversations
If a conversation is getting long:
"Let's summarize what we've covered..."

### Reference Specifics
Instead of: "Like you said"
Say: "Based on your suggestion to restart the service..."

### Start Fresh When Needed
Complex new topics deserve new conversations.

## Knowledge Base vs. Context
- **Knowledge Base**: Permanent, searchable documents
- **Conversation Context**: Temporary, chat-specific

Upload reference materials to the knowledge base for consistent access across all conversations.
        `
      }
    ],
    faqs: [
      {
        q: "How long are conversations stored?",
        a: "Conversations are stored indefinitely for your account. You can delete them at any time. Enterprise accounts can set retention policies (e.g., auto-delete after 90 days)."
      },
      {
        q: "Can I share a conversation with someone?",
        a: "Yes, export the conversation as a PDF or use the 'Share' button to generate a read-only link. Shared links can be password-protected or time-limited."
      },
      {
        q: "Why does my GPT 'forget' what I said earlier?",
        a: "If a conversation is very long, older messages may be dropped to fit the context window. Also, starting a 'New Chat' creates a completely fresh session with no memory of previous chats."
      },
      {
        q: "Can I search across all my conversations?",
        a: "Yes! Use the search bar in the conversation sidebar. It searches message content across all your chats with that GPT."
      }
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Performance",
    tagline: "Track usage and optimize performance",
    icon: BarChart3,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    articles: [
      {
        id: "understanding-analytics",
        title: "Understanding Your Analytics Dashboard",
        type: "guide",
        content: `
# Understanding Your Analytics Dashboard

Track how your GPT is being used.

## Key Metrics

### Total Messages
- Count of all messages sent/received
- Track growth over time
- Compare periods (week over week, month over month)

### Average Response Time
- How quickly your GPT responds
- Measured in milliseconds
- Target: Under 3 seconds for most use cases

### Token Usage
- Total tokens consumed
- Breakdown by input vs. output
- Cost estimation based on usage

### Active Sessions
- Unique conversation sessions
- Daily/weekly/monthly active users
- Session duration metrics

## Charts & Visualizations

### Usage Over Time
Line chart showing:
- Daily message volume
- Trend indicators (up/down arrows)
- Peak usage times

### Response Time Distribution
Histogram showing:
- Fast responses (< 1s)
- Normal responses (1-3s)
- Slow responses (> 3s)

### Token Consumption
Bar chart showing:
- Input tokens (user messages)
- Output tokens (GPT responses)
- Daily/weekly breakdown

## Filtering & Date Ranges
- **Last 7 Days**: Quick view
- **Last 30 Days**: Monthly overview
- **Last 90 Days**: Quarterly trends
- **Custom Range**: Any date range

## Exporting Data
1. Click **"Export"** in the analytics tab
2. Choose format (CSV, PDF, Excel)
3. Select date range
4. Download report
        `
      },
      {
        id: "optimizing-performance",
        title: "Optimizing GPT Performance",
        type: "guide",
        content: `
# Optimizing GPT Performance

Improve response quality and speed.

## Response Time Optimization

### Choose the Right Model
- **Fastest**: GPT-4o-mini, Gemini Pro
- **Balanced**: Claude 3.5 Sonnet
- **Thorough**: GPT-4o

### Streamline System Prompt
- Remove unnecessary instructions
- Be concise but complete
- Avoid redundant guidelines

### Optimize Knowledge Base
- Remove duplicate documents
- Delete outdated content
- Use well-structured documents

## Quality Optimization

### Improve System Prompt
- Add examples of good responses
- Specify output format clearly
- Include edge case handling

### Curate Knowledge Base
- Add high-quality documents
- Include FAQs for common questions
- Update regularly with new information

### Enable Appropriate Features
- **Web Search**: For current information
- **Anti-Hallucination**: For factual accuracy
- **Citation Mode**: For verifiable responses

## User Experience

### Better Starter Questions
- Specific, action-oriented prompts
- Cover main use cases
- Guide users to successful interactions

### Improved Welcome Message
- Clear purpose statement
- Set expectations
- Encourage specific questions

### Iterate Based on Feedback
- Review conversation history
- Identify common failures
- Update prompts accordingly

## Monitoring & Alerting
1. Set baseline metrics
2. Configure alerts for anomalies
3. Review weekly analytics
4. A/B test prompt changes
        `
      }
    ],
    faqs: [
      {
        q: "How are tokens calculated?",
        a: "Tokens are roughly 4 characters or 3/4 of a word. Input tokens (user messages + system prompt + context) and output tokens (GPT responses) are counted separately. View detailed breakdowns in Analytics."
      },
      {
        q: "Can I see which questions users ask most?",
        a: "Yes! The 'Top Queries' section shows the most common topics and questions. Use this to improve your knowledge base and system prompt."
      },
      {
        q: "How do I reduce costs?",
        a: "Use GPT-4o-mini for simple tasks, streamline your system prompt, optimize knowledge base size, and set response length limits where appropriate."
      },
      {
        q: "Can I compare performance across multiple GPTs?",
        a: "Yes, go to Analytics → Overview to see a comparison dashboard. Compare message volume, response times, and user satisfaction across all your GPTs."
      }
    ]
  },
  {
    id: "deployment",
    name: "Deployment & Sharing",
    tagline: "Share your GPT with the world",
    icon: Share2,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    articles: [
      {
        id: "public-sharing",
        title: "Public Sharing & Links",
        type: "guide",
        content: `
# Public Sharing & Links

Make your GPT accessible to others.

## Making Your GPT Public
1. Go to **Settings → Visibility**
2. Toggle **"Public Access"** on
3. Your GPT is now accessible via its public URL
4. Anyone with the link can use it

## Share Link
Your public URL format:
\`https://ultriumai.com/gpt/[your-gpt-id]\`

Sharing options:
- **Copy Link**: Direct URL to your GPT
- **QR Code**: Generate scannable code
- **Social Share**: Twitter, LinkedIn, Facebook buttons

## Access Controls

### Public (No Login)
- Anyone can use without signing in
- No conversation history saved
- Best for demos and public tools

### Public (Login Required)
- Requires UltriumAI account
- Conversations are saved
- Usage is tracked per user

### Team Only
- Only invited team members can access
- Full analytics and history
- Best for internal tools

### Private
- Only you can access
- Testing and development
- Draft GPTs before publishing

## Usage Limits for Public GPTs
Free tier limits apply to anonymous users:
- 10 messages per day per user
- Rate limiting prevents abuse
- Upgrade for unlimited access
        `
      },
      {
        id: "embed-widget",
        title: "Embedding on Your Website",
        type: "guide",
        content: `
# Embedding on Your Website

Add your GPT to any website.

## Getting the Embed Code
1. Go to **Deploy → Embed Widget**
2. Configure widget settings:
   - Width and height
   - Position (bottom-right, bottom-left, etc.)
   - Show/hide branding
3. Copy the embed code

## Basic Embed Code
\`\`\`html
<!-- Add to your website -->
<iframe
  src="https://ultriumai.com/gpt/[your-gpt-id]/embed?embed=true"
  width="400"
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  allow="clipboard-write"
></iframe>
\`\`\`

## Floating Widget
For a chat button that expands:
\`\`\`html
<script
  src="https://ultriumai.com/embed/widget.js"
  data-gpt-id="[your-gpt-id]"
  data-position="bottom-right"
  data-primary-color="#3b82f6"
></script>
\`\`\`

## Customization Options
- **width/height**: Pixel values or percentages
- **position**: bottom-right, bottom-left, inline
- **primaryColor**: Your brand color (hex)
- **greeting**: Custom welcome message
- **hideHeader**: Remove the top bar
- **hideInput**: Hide input for display-only embeds

## Platform-Specific Guides

### WordPress
1. Edit page in WordPress
2. Add Custom HTML block
3. Paste embed code
4. Publish

### Shopify
1. Go to Themes → Edit Code
2. Open theme.liquid
3. Add script before </body>
4. Save

### Webflow
1. Add Embed element
2. Paste code
3. Publish site

### React/Next.js
\`\`\`jsx
<iframe
  src={\`\${process.env.EMBED_URL}\`}
  className="w-full h-[600px] rounded-lg"
/>
\`\`\`
        `
      },
      {
        id: "api-integration",
        title: "API Access & Integration",
        type: "guide",
        content: `
# API Access & Integration

Build custom integrations with the API.

## Getting Your API Key
1. Go to **Deploy → API Access**
2. Click **"Create API Key"**
3. Name your key (e.g., "Production", "Testing")
4. Copy and store securely - shown only once!

## API Key Security
- Never expose in client-side code
- Use environment variables
- Rotate keys periodically
- Set usage limits if available

## Basic API Call
\`\`\`javascript
const response = await fetch('https://api.ultriumai.com/v1/gpt/[gpt-id]/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    conversation_id: 'optional-for-context'
  })
});

const data = await response.json();
console.log(data.message);
\`\`\`

## Response Format
\`\`\`json
{
  "message": "Hello! I'm here to help...",
  "conversation_id": "conv_abc123",
  "tokens_used": 150,
  "response_time_ms": 850
}
\`\`\`

## Streaming Responses
For real-time streaming:
\`\`\`javascript
const response = await fetch('/api/gpt/[gpt-id]/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({ message: 'Write a story' })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
\`\`\`

## Rate Limits
- **Free**: 100 requests/day
- **Pro**: 10,000 requests/day
- **Enterprise**: Custom limits

## Error Handling
\`\`\`javascript
try {
  const response = await callGPT(message);
} catch (error) {
  if (error.status === 429) {
    // Rate limited - wait and retry
  } else if (error.status === 401) {
    // Invalid API key
  }
}
\`\`\`
        `
      }
    ],
    faqs: [
      {
        q: "Can I embed on multiple websites?",
        a: "Yes! Your embed code works on any website. For security, you can set allowed domains in Deploy → Security → Allowed Origins."
      },
      {
        q: "How do I track which website traffic comes from?",
        a: "Add UTM parameters to your embed URL: ?source=website-name. View traffic sources in Analytics → Acquisition."
      },
      {
        q: "Can I white-label the embed widget?",
        a: "Pro and Enterprise plans allow full white-labeling: remove 'Powered by UltriumAI', use custom domains, and apply custom CSS."
      },
      {
        q: "What's the API rate limit?",
        a: "Free: 100/day, Pro: 10,000/day, Enterprise: custom. Limits reset at midnight UTC. View current usage in Dashboard → API → Usage."
      }
    ]
  }
];

const AIStudioKnowledgeBase = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const filteredTopics = topics.filter(topic => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      topic.name.toLowerCase().includes(query) ||
      topic.tagline.toLowerCase().includes(query) ||
      topic.articles.some(a => 
        a.title.toLowerCase().includes(query) || 
        a.content.toLowerCase().includes(query)
      ) ||
      topic.faqs.some(f => 
        f.q.toLowerCase().includes(query) || 
        f.a.toLowerCase().includes(query)
      )
    );
  });

  const currentTopic = selectedTopic ? topics.find(t => t.id === selectedTopic) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => {
            if (selectedArticle) {
              setSelectedArticle(null);
            } else if (selectedTopic) {
              setSelectedTopic(null);
            } else {
              navigate('/docs');
            }
          }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              AI Studio Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              Complete documentation for creating and managing custom GPTs
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search guides, tutorials, and FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-6 text-lg"
          />
        </div>

        {/* Content */}
        {!selectedTopic ? (
          // Topic Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <Card 
                  key={topic.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${topic.bgColor}`}>
                        <Icon className={`h-6 w-6 ${topic.color}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="flex items-center justify-between">
                          {topic.name}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{topic.tagline}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {topic.articles.length} Guides
                      </span>
                      <span className="flex items-center gap-1">
                        <HelpCircle className="h-4 w-4" />
                        {topic.faqs.length} FAQs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : selectedArticle ? (
          // Article View
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{currentTopic?.name}</Badge>
                <Badge variant="outline">Guide</Badge>
              </div>
              <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedArticle.content.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={i} className="text-2xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-medium mt-4 mb-2">{line.slice(4)}</h3>;
                    } else if (line.startsWith('> ')) {
                      return (
                        <div key={i} className="bg-blue-500/10 border-l-4 border-blue-500 p-4 my-4 rounded-r">
                          {line.slice(2)}
                        </div>
                      );
                    } else if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    } else if (line.match(/^\d+\./)) {
                      return <li key={i} className="ml-4 list-decimal">{line.slice(line.indexOf('.') + 2)}</li>;
                    } else if (line.startsWith('```')) {
                      return null;
                    } else if (line.trim()) {
                      return <p key={i} className="my-2">{line}</p>;
                    }
                    return null;
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ) : (
          // Topic Detail View
          <Tabs defaultValue="guides" className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {currentTopic && (
                  <>
                    <div className={`p-3 rounded-xl ${currentTopic.bgColor}`}>
                      <currentTopic.icon className={`h-6 w-6 ${currentTopic.color}`} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{currentTopic.name}</h2>
                      <p className="text-muted-foreground">{currentTopic.tagline}</p>
                    </div>
                  </>
                )}
              </div>
              <TabsList>
                <TabsTrigger value="guides" className="gap-2">
                  <ListChecks className="h-4 w-4" />
                  Step-by-Step Guides
                </TabsTrigger>
                <TabsTrigger value="faqs" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  FAQs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="guides" className="space-y-4">
              {currentTopic?.articles.map((article) => (
                <Card 
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        {article.title}
                      </CardTitle>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="faqs">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {currentTopic?.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AIStudioKnowledgeBase;
