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
  FileText, Globe, Lock, Play, Download, PenTool, Layers, Wand2
} from "lucide-react";

// AI Studio logo
import aiStudioLogo from "@/assets/ai-studio-logo.png";

// Topic branding config
const topicBranding = {
  "getting-started": {
    gradient: "from-blue-500 to-cyan-500",
    lightBg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    icon: "bg-blue-500",
  },
  "configuration": {
    gradient: "from-violet-500 to-purple-500",
    lightBg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-600 dark:text-violet-400",
    icon: "bg-violet-500",
  },
  "deployment": {
    gradient: "from-emerald-500 to-teal-500",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "bg-emerald-500",
  },
  "analytics": {
    gradient: "from-orange-500 to-amber-500",
    lightBg: "bg-orange-50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-600 dark:text-orange-400",
    icon: "bg-orange-500",
  },
  "advanced": {
    gradient: "from-rose-500 to-pink-500",
    lightBg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-600 dark:text-rose-400",
    icon: "bg-rose-500",
  },
};

// AI Studio Topics Data
const topics = [
  {
    id: "getting-started",
    name: "Getting Started",
    tagline: "Create your first custom GPT",
    description: "Learn the basics of AI Studio and build your first AI assistant",
    icon: Zap,
    branding: topicBranding["getting-started"],
    features: ["GPT Creation Wizard", "Template Library", "Quick Chat"],
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
    description: "Master system prompts, model selection, and knowledge bases",
    icon: Sliders,
    branding: topicBranding["configuration"],
    features: ["System Prompts", "Model Selection", "Knowledge Base"],
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
- Uses more AI capacity per interaction

### GPT-4o-mini (OpenAI)
**Best for**: High-volume applications
- Faster response times
- More efficient AI capacity usage
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
        q: "What if my GPT gives wrong answers?",
        a: "Check your system prompt for clarity, ensure your knowledge base is up-to-date, and consider enabling 'Anti-Hallucination' mode for stricter fact-checking."
      }
    ]
  },
  {
    id: "deployment",
    name: "Deployment & Sharing",
    tagline: "Share your GPT with the world",
    description: "Deploy via links, embeds, API, or team sharing",
    icon: Share2,
    branding: topicBranding["deployment"],
    features: ["Share Links", "Embed Widgets", "API Access"],
    articles: [
      {
        id: "sharing-options",
        title: "Sharing Your GPT",
        type: "guide",
        content: `
# Sharing Your GPT

Multiple ways to share your custom GPT with users.

## Share Link
The simplest way to share:
1. Go to **Your GPT → Deploy → Share Link**
2. Copy the unique URL
3. Anyone with the link can chat with your GPT
4. Optionally require sign-in

### Link Settings
- **Public**: Anyone can access
- **Unlisted**: Only those with link
- **Private**: Requires authentication

## QR Code
1. Go to **Deploy → QR Code**
2. Download the QR image
3. Add to business cards, posters, etc.
4. Scanning opens your GPT

## Embed Widget
Add your GPT to any website:
1. Go to **Deploy → Embed**
2. Customize the widget:
   - Position (bottom-right, bottom-left, etc.)
   - Size (compact, standard, full)
   - Launcher style (icon, button, bar)
3. Copy the embed code
4. Paste into your website's HTML

\`\`\`html
<script src="https://ultriumai.com/embed.js"
  data-gpt-id="your-gpt-id"
  data-position="bottom-right">
</script>
\`\`\`

## Team Sharing
Share with specific team members:
1. Go to **Deploy → Team**
2. Enter email addresses
3. Set permission level:
   - **Viewer**: Can chat only
   - **Editor**: Can modify settings
   - **Admin**: Full control
4. Send invitations
        `
      },
      {
        id: "api-integration",
        title: "API Integration",
        type: "guide",
        content: `
# API Integration

Integrate your GPT into applications via REST API.

## Getting API Keys
1. Go to **Settings → API**
2. Click **"Generate API Key"**
3. Name your key (e.g., "Production", "Development")
4. Set permissions and rate limits
5. Copy the key (shown only once!)

## Basic API Usage

### Send a Message
\`\`\`javascript
const response = await fetch('https://api.ultriumai.com/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    gpt_id: 'your-gpt-id',
    message: 'How do I reset my password?',
    conversation_id: 'optional-for-context'
  })
});

const data = await response.json();
console.log(data.response);
\`\`\`

### Streaming Responses
\`\`\`javascript
const eventSource = new EventSource(
  'https://api.ultriumai.com/v1/chat/stream?gpt_id=YOUR_GPT_ID'
);

eventSource.onmessage = (event) => {
  const chunk = JSON.parse(event.data);
  console.log(chunk.content);
};
\`\`\`

## Rate Limits
- **Free**: 100 requests/day
- **Pro**: 10,000 requests/day
- **Enterprise**: Unlimited

## Webhooks
Receive notifications for:
- New conversations
- Feedback received
- Usage thresholds
- Error alerts
        `
      },
      {
        id: "embed-customization",
        title: "Embed Widget Customization",
        type: "guide",
        content: `
# Embed Widget Customization

Fully customize how your GPT appears on websites.

## Widget Positions
- **Bottom Right**: Default, most common
- **Bottom Left**: Alternative placement
- **Full Page**: Takes entire viewport
- **Inline**: Embed within page content

## Launcher Styles

### Chat Icon
- Floating circular button
- Customizable icon
- Notification badge for new messages

### Text Button
- "Chat with us" or custom text
- Matches your brand colors
- Hover animations

### Persistent Bar
- Fixed bar at bottom of page
- Input field always visible
- Maximum visibility

## Customization Options

\`\`\`javascript
UltriumAI.init({
  gptId: 'your-gpt-id',
  
  // Appearance
  position: 'bottom-right',
  theme: 'light', // or 'dark', 'auto'
  primaryColor: '#6366f1',
  
  // Launcher
  launcher: {
    type: 'icon', // 'icon', 'button', 'bar'
    text: 'Need help?',
    icon: 'chat' // or 'help', 'bot', custom URL
  },
  
  // Behavior
  autoOpen: false,
  autoOpenDelay: 5000, // ms
  persistConversation: true,
  
  // Branding
  showBranding: false, // Pro feature
  customCSS: '...'
});
\`\`\`

## Advanced: Custom CSS

\`\`\`css
/* Override widget styles */
.ultrium-widget {
  --widget-primary: #6366f1;
  --widget-radius: 16px;
  --widget-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.ultrium-launcher {
  transform: scale(1.1);
}
\`\`\`
        `
      }
    ],
    faqs: [
      {
        q: "Can I use my own domain for the share link?",
        a: "Yes! Pro and Enterprise users can set up a custom domain (e.g., chat.yourcompany.com) that points to your GPT."
      },
      {
        q: "Is the embed widget mobile-friendly?",
        a: "Yes, the widget is fully responsive. On mobile devices, it expands to full-screen for the best chat experience."
      },
      {
        q: "What's the API rate limit?",
        a: "Free: 100/day, Pro: 10,000/day, Enterprise: unlimited. Rate limits reset at midnight UTC. Burst limits also apply."
      },
      {
        q: "Can I remove the UltriumAI branding?",
        a: "Yes, Pro and Enterprise plans include white-labeling. Remove the 'Powered by UltriumAI' badge and use your own branding."
      }
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Insights",
    tagline: "Measure and optimize performance",
    description: "Track usage, engagement, and user satisfaction",
    icon: BarChart3,
    branding: topicBranding["analytics"],
    features: ["Usage Metrics", "Conversation Analysis", "Feedback Tracking"],
    articles: [
      {
        id: "analytics-dashboard",
        title: "Understanding the Analytics Dashboard",
        type: "guide",
        content: `
# Understanding the Analytics Dashboard

Monitor your GPT's performance and user engagement.

## Key Metrics

### Conversations
- **Total Conversations**: All-time chat sessions
- **Active Today**: Users currently chatting
- **Avg. Length**: Messages per conversation
- **Return Rate**: Users who come back

### Messages
- **Total Messages**: All messages exchanged
- **User Messages**: What users asked
- **AI Responses**: What your GPT replied
- **Avg. Response Time**: How fast your GPT responds

### Satisfaction
- **Thumbs Up/Down**: Direct feedback
- **Completion Rate**: Users who got their answer
- **Escalation Rate**: Users who needed human help

## Time Ranges
- Last 24 hours
- Last 7 days
- Last 30 days
- Custom range

## Filtering
- By conversation topic
- By user segment
- By platform (web, mobile, API)
- By outcome (resolved, escalated)

## Exporting Data
1. Click **"Export"** in top right
2. Choose format: CSV, JSON, PDF
3. Select date range
4. Download report
        `
      },
      {
        id: "conversation-analysis",
        title: "Analyzing Conversations",
        type: "guide",
        content: `
# Analyzing Conversations

Learn from user interactions to improve your GPT.

## Conversation Logs
View all conversations:
1. Go to **Analytics → Conversations**
2. See list of all chats
3. Filter by date, rating, or topic
4. Click to view full transcript

## What to Look For

### Successful Conversations
- User got their answer quickly
- Positive feedback (thumbs up)
- No escalation needed
- Natural conversation flow

### Problem Areas
- Repeated questions (GPT didn't answer well)
- Negative feedback
- Escalation to human
- User frustration signals

## Topic Clustering
AI automatically groups conversations by topic:
- See what users ask most about
- Identify knowledge gaps
- Find new FAQ opportunities
- Discover unexpected use cases

## Sentiment Analysis
Track emotional tone:
- **Positive**: Happy, satisfied users
- **Neutral**: Standard interactions
- **Negative**: Frustrated or confused users

## Action Items
Based on analysis:
- Update system prompt for common issues
- Add documents to knowledge base
- Create canned responses
- Improve starter questions
        `
      },
      {
        id: "feedback-reports",
        title: "Feedback & Rating Reports",
        type: "guide",
        content: `
# Feedback & Rating Reports

Collect and analyze user satisfaction.

## Feedback Collection

### Thumbs Up/Down
- Appears after each response
- Quick, low-friction
- Good for volume metrics

### Detailed Feedback
- Optional text comments
- Specific issue categories
- Follow-up contact option

### CSAT Surveys
- End-of-conversation surveys
- 1-5 star ratings
- Custom questions

## Feedback Dashboard

### Overall Score
- Percentage of positive feedback
- Trend over time
- Comparison to benchmarks

### By Category
- Product questions: 92% positive
- Technical issues: 78% positive
- Billing questions: 85% positive

### Common Themes
- AI identifies patterns in feedback
- "GPT was too slow"
- "Answer was helpful but incomplete"
- "Loved the step-by-step format"

## Taking Action
1. Review negative feedback daily
2. Identify root causes
3. Update GPT configuration
4. Track improvement over time
5. Close the feedback loop
        `
      }
    ],
    faqs: [
      {
        q: "How long is conversation history stored?",
        a: "By default, 90 days for Pro and 365 days for Enterprise. You can adjust retention settings or export data before deletion."
      },
      {
        q: "Can I see individual user conversations?",
        a: "Yes, if users are authenticated. Anonymous users show as conversation IDs. Privacy settings can limit what data is stored."
      },
      {
        q: "How is sentiment analysis calculated?",
        a: "AI analyzes message content, punctuation, and conversation flow. Combined with explicit feedback for a complete picture."
      },
      {
        q: "Can I get alerts for negative feedback?",
        a: "Yes! Set up alerts in Settings → Notifications. Get emails or Slack messages when feedback drops below threshold."
      }
    ]
  },
  {
    id: "advanced",
    name: "Advanced Features",
    tagline: "Power user capabilities",
    description: "Webhooks, actions, multi-agent, and enterprise features",
    icon: Wand2,
    branding: topicBranding["advanced"],
    features: ["Webhooks", "Custom Actions", "Multi-Agent"],
    articles: [
      {
        id: "custom-actions",
        title: "Creating Custom Actions",
        type: "guide",
        content: `
# Creating Custom Actions

Extend your GPT with API integrations and workflows.

## What Are Actions?
Actions let your GPT:
- Call external APIs
- Query databases
- Create tickets
- Send emails
- Trigger workflows

## Creating an Action
1. Go to **Settings → Actions**
2. Click **"Add Action"**
3. Configure:
   - **Name**: "Create Support Ticket"
   - **Description**: When to use this action
   - **API Endpoint**: Your webhook URL
   - **Method**: POST, GET, etc.
   - **Headers**: Authentication, etc.
   - **Parameters**: What data to send

## Example: Ticket Creation

\`\`\`json
{
  "name": "create_ticket",
  "description": "Creates a support ticket when user requests human help",
  "endpoint": "https://api.yourapp.com/tickets",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{TICKET_API_KEY}}"
  },
  "body": {
    "subject": "{{conversation_summary}}",
    "user_email": "{{user_email}}",
    "priority": "{{detected_urgency}}",
    "transcript": "{{conversation_history}}"
  }
}
\`\`\`

## Available Variables
- \`{{user_message}}\`: Current user input
- \`{{conversation_history}}\`: Full transcript
- \`{{user_email}}\`: If authenticated
- \`{{gpt_id}}\`: Your GPT's ID
- \`{{timestamp}}\`: Current time

## Testing Actions
1. Use the **"Test"** button
2. Provide sample inputs
3. View API response
4. Check for errors
        `
      },
      {
        id: "webhooks",
        title: "Setting Up Webhooks",
        type: "guide",
        content: `
# Setting Up Webhooks

Receive real-time notifications about GPT events.

## Available Events
- \`conversation.started\`: New chat begins
- \`conversation.ended\`: Chat session closes
- \`message.received\`: User sends message
- \`message.sent\`: GPT responds
- \`feedback.received\`: User rates response
- \`action.triggered\`: Custom action executed
- \`error.occurred\`: Something went wrong

## Creating a Webhook
1. Go to **Settings → Webhooks**
2. Click **"Add Webhook"**
3. Enter your endpoint URL
4. Select events to listen for
5. Add any headers (auth, etc.)
6. Save and test

## Webhook Payload

\`\`\`json
{
  "event": "message.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "gpt_id": "gpt_abc123",
  "conversation_id": "conv_xyz789",
  "data": {
    "message": "How do I reset my password?",
    "user_id": "user_123",
    "metadata": {
      "platform": "web",
      "page_url": "https://yoursite.com/support"
    }
  }
}
\`\`\`

## Security
- Webhook requests include a signature
- Verify signature to ensure authenticity
- Use HTTPS endpoints only
- Rotate secrets periodically

## Retry Policy
- Failed webhooks retry 3 times
- Exponential backoff: 1min, 5min, 15min
- View failed deliveries in logs
- Manual retry available
        `
      },
      {
        id: "multi-agent",
        title: "Multi-Agent Orchestration",
        type: "guide",
        content: `
# Multi-Agent Orchestration

Connect multiple GPTs for complex workflows.

## What Is Multi-Agent?
Instead of one GPT doing everything:
- Specialized GPTs handle specific tasks
- Router directs users to right GPT
- Seamless handoffs between agents
- Each GPT is optimized for its role

## Architecture

\`\`\`
User → Router GPT → [
  IT Support GPT
  HR Questions GPT
  Sales Inquiries GPT
  General FAQ GPT
]
\`\`\`

## Setting Up Multi-Agent
1. Create your specialized GPTs
2. Create a Router GPT
3. Configure routing rules:
   - Keywords → specific GPT
   - Intent detection → automatic routing
   - User choice → menu selection

## Router Configuration

\`\`\`json
{
  "routes": [
    {
      "name": "IT Support",
      "gpt_id": "gpt_it_support",
      "triggers": ["password", "computer", "software", "network"],
      "intent": "technical_issue"
    },
    {
      "name": "HR",
      "gpt_id": "gpt_hr",
      "triggers": ["vacation", "benefits", "payroll", "policy"],
      "intent": "hr_question"
    },
    {
      "name": "Sales",
      "gpt_id": "gpt_sales",
      "triggers": ["pricing", "demo", "enterprise", "buy"],
      "intent": "purchase_interest"
    }
  ],
  "default": "gpt_general_faq"
}
\`\`\`

## Handoff Messages
When transferring between GPTs:
- "I'll connect you with our IT specialist..."
- "Let me transfer you to HR for that..."
- Maintain conversation context
- Seamless user experience
        `
      }
    ],
    faqs: [
      {
        q: "How many actions can I create per GPT?",
        a: "Free: 3 actions, Pro: 20 actions, Enterprise: unlimited. Complex workflows can chain multiple actions."
      },
      {
        q: "Can webhooks trigger actions in external systems?",
        a: "Yes! Connect to Zapier, Make, n8n, or any system that accepts webhooks. Create tickets, send notifications, update CRMs, etc."
      },
      {
        q: "Is multi-agent available on all plans?",
        a: "Multi-agent orchestration requires Pro or Enterprise. Free users can create multiple GPTs but not connect them."
      },
      {
        q: "Can I use my own AI model?",
        a: "Enterprise users can connect custom fine-tuned models or on-premise deployments. Contact sales for setup."
      }
    ]
  }
];

const AIStudioKnowledgeBase = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  const filteredTopics = topics.map(topic => ({
    ...topic,
    articles: topic.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    faqs: topic.faqs.filter(faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(topic => 
    topic.articles.length > 0 || 
    topic.faqs.length > 0 ||
    topic.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMarkdown = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-6 mb-4 text-foreground">{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-semibold mt-5 mb-3 text-foreground">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-medium mt-4 mb-2 text-foreground">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('> ')) {
        const isWarning = line.includes('⚠️') || line.includes('Important');
        const isTip = line.includes('💡') || line.includes('Tip');
        return (
          <div key={i} className={`p-4 rounded-lg my-3 border-l-4 ${
            isWarning 
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-800 dark:text-amber-200' 
              : isTip 
              ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-500 text-violet-800 dark:text-violet-200'
              : 'bg-muted border-primary text-muted-foreground'
          }`}>
            {line.replace('> ', '')}
          </div>
        );
      }
      if (line.startsWith('```')) {
        return null; // Handle code blocks separately
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="ml-4 text-muted-foreground flex items-start gap-2 my-1">
            <CheckCircle2 className="h-4 w-4 mt-1 text-violet-500 flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: formatText(line.replace('- ', '')) }} />
          </li>
        );
      }
      if (line.match(/^\d+\. /)) {
        return (
          <li key={i} className="ml-4 text-muted-foreground my-1 list-decimal list-inside">
            <span dangerouslySetInnerHTML={{ __html: formatText(line.replace(/^\d+\. /, '')) }} />
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-muted-foreground my-2" dangerouslySetInnerHTML={{ __html: formatText(line) }} />;
    });
  };

  const formatText = (text: string) => {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded text-sm font-mono text-violet-700 dark:text-violet-300">$1</code>');
  };

  const TopicCard = ({ topic }: { topic: typeof topics[0] }) => {
    const Icon = topic.icon;
    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden group ${topic.branding.border}`}
        onClick={() => setActiveTopic(topic.id)}
      >
        {/* Gradient header */}
        <div className={`h-2 bg-gradient-to-r ${topic.branding.gradient}`} />
        <CardHeader className={`${topic.branding.lightBg}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${topic.branding.icon} group-hover:scale-105 transition-transform shadow-md`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className={`text-xl ${topic.branding.text}`}>{topic.name}</CardTitle>
              <CardDescription className="text-sm">{topic.tagline}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <BookOpen className="h-4 w-4" />
            <span>{topic.articles.length} Guides</span>
            <span className="mx-2">•</span>
            <HelpCircle className="h-4 w-4" />
            <span>{topic.faqs.length} FAQs</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {topic.features.map(feature => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (activeArticle) {
    const topic = topics.find(t => t.articles.some(a => a.id === activeArticle.id));
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setActiveArticle(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {topic?.name || 'Articles'}
          </Button>

          <Card className="overflow-hidden">
            {topic && (
              <div className={`h-2 bg-gradient-to-r ${topic.branding.gradient}`} />
            )}
            <CardHeader className={topic ? topic.branding.lightBg : ''}>
              <div className="flex items-center gap-3 mb-2">
                {topic && (
                  <div className={`p-2 rounded-lg ${topic.branding.icon}`}>
                    <topic.icon className="h-5 w-5 text-white" />
                  </div>
                )}
                <Badge variant="outline" className="text-xs uppercase tracking-wider">
                  {activeArticle.type}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{activeArticle.title}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {renderMarkdown(activeArticle.content)}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (activeTopic) {
    const topic = topics.find(t => t.id === activeTopic);
    if (!topic) return null;

    const Icon = topic.icon;

    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setActiveTopic(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to AI Studio Knowledge Base
          </Button>

          {/* Topic Header with Branding */}
          <div className={`rounded-2xl overflow-hidden mb-8 ${topic.branding.lightBg} border ${topic.branding.border}`}>
            <div className={`h-2 bg-gradient-to-r ${topic.branding.gradient}`} />
            <div className="p-8">
              <div className="flex items-center gap-6 mb-4">
                <div className={`p-4 rounded-2xl ${topic.branding.icon} shadow-lg`}>
                  <Icon className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${topic.branding.text}`}>{topic.name}</h1>
                  <p className="text-lg text-muted-foreground">{topic.tagline}</p>
                  <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Badge className={`${topic.branding.icon} text-white`}>
                  <BookOpen className="h-3 w-3 mr-1" />
                  {topic.articles.length} Guides
                </Badge>
                <Badge variant="outline">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {topic.faqs.length} FAQs
                </Badge>
              </div>
            </div>
          </div>

          <Tabs defaultValue="guides" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="guides" className="gap-2">
                <ListChecks className="h-4 w-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="faqs" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQs
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="guides">
              <div className="grid md:grid-cols-2 gap-4">
                {topic.articles.map((article) => (
                  <Card 
                    key={article.id}
                    className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/30 group overflow-hidden`}
                    onClick={() => setActiveArticle(article)}
                  >
                    <div className={`h-1 bg-gradient-to-r ${topic.branding.gradient}`} />
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${topic.branding.lightBg} group-hover:scale-105 transition-transform`}>
                          <Icon className={`h-6 w-6 ${topic.branding.text}`} />
                        </div>
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-2">{article.type}</Badge>
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {article.title}
                          </CardTitle>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faqs">
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${topic.branding.gradient}`} />
                <CardHeader className={topic.branding.lightBg}>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className={`h-5 w-5 ${topic.branding.text}`} />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <Accordion type="single" collapsible className="space-y-2">
                    {topic.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="font-medium">{faq.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card className="overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${topic.branding.gradient}`} />
                <CardHeader className={topic.branding.lightBg}>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className={`h-5 w-5 ${topic.branding.text}`} />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {topic.features.map((feature, idx) => (
                      <div key={idx} className={`p-4 rounded-xl ${topic.branding.lightBg} border ${topic.branding.border}`}>
                        <CheckCircle2 className={`h-5 w-5 ${topic.branding.text} mb-2`} />
                        <p className="text-sm font-medium">{feature}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {/* Hero Header with AI Studio Branding */}
        <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTJIMjR2MmgxMnpNMzYgMzB2LTJIMjR2MmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative px-8 py-12 md:py-16">
            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                <Bot className="h-14 w-14 text-white" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  AI Studio Knowledge Base
                </h1>
                <p className="text-violet-100 text-lg">
                  Everything you need to build, deploy, and optimize custom GPTs
                </p>
              </div>
            </div>
            
            {/* Search */}
            <div className="max-w-2xl mx-auto md:mx-0">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-300" />
                <Input
                  placeholder="Search guides, FAQs, and documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-violet-200 focus:bg-white/20"
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <Layers className="h-3 w-3 mr-1" />
                5 Topics
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <BookOpen className="h-3 w-3 mr-1" />
                {topics.reduce((acc, t) => acc + t.articles.length, 0)} Guides
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                <HelpCircle className="h-3 w-3 mr-1" />
                {topics.reduce((acc, t) => acc + t.faqs.length, 0)} FAQs
              </Badge>
            </div>
          </div>
        </div>

        {/* Topic Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(searchQuery ? filteredTopics : topics).map(topic => (
            <TopicCard key={topic.id} topic={topic as typeof topics[0]} />
          ))}
        </div>

        {searchQuery && filteredTopics.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching with different keywords or browse the topics above.
            </p>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AIStudioKnowledgeBase;
