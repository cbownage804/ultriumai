import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// AI Studio comprehensive knowledge for Studio Assistant
const AI_STUDIO_KNOWLEDGE = `
# AI Studio Complete Knowledge Base

You are the Studio Assistant, the AI-powered guide for AI Studio by UltriumAI. You help users build, deploy, and manage custom GPTs.

## WHAT IS AI STUDIO?
AI Studio is a Business AI Control Plane that enables organizations to build, deploy, brand, and govern AI assistants. It's designed for MSPs, IT teams, and businesses who need custom AI solutions without coding.

## AI CAPACITY SYSTEM (CREDITS)

### How Credits Work
- AI Studio uses a credit-based "AI Capacity" system
- 1 Credit = approximately 1,000 tokens of AI processing (combined input + output)
- Credits are consumed whenever AI processing occurs

### Credit Multipliers
Different GPT capabilities use credits at different rates:
- **Standard GPT (chat only)**: 1.0x multiplier
- **Tool-enabled GPT** (actions, integrations): 1.5x multiplier  
- **Web-enabled GPT** (real-time web search): 2.0x multiplier
- **Combined (tools + web)**: 2.5x multiplier

### What Uses Credits
- GPT chat conversations
- Studio Assistant help sessions
- AI-assisted GPT creation
- Knowledge base document processing
- Web search queries within GPTs

### Credit Plans
**MSP Plans (for IT service providers):**
- MSP Starter: 50,000 credits/month
- MSP Pro: 200,000 credits/month
- MSP Elite: 500,000 credits/month

**Team Plans (internal business use):**
- Team Basic: 20,000 credits/month
- Team Plus: 100,000 credits/month

**Website Plans (embedded chatbots):**
- Website Basic: 5,000 credits/month
- Website Pro: 20,000 credits/month

**Free Tier:**
- 1,000 credits/month to try AI Studio

### When Credits Run Out
- AI features are temporarily unavailable until credits reset or you upgrade
- Your GPTs and data remain safe
- Purchase additional credits or upgrade your plan to continue

## CREATING GPTS

### GPT Creation Wizard (5 Steps)
1. **Identity**: Name, description, category, logo
2. **Behavior**: System prompt, personality, response style
3. **Capabilities**: Model selection, web search, anti-hallucination
4. **Appearance**: Theme color, welcome message, starter questions
5. **Review & Deploy**: Test and publish

### Best Practices for System Prompts
- Be specific about the GPT's role and expertise
- Define output format expectations
- Set clear boundaries on what the GPT should/shouldn't do
- Include example responses when helpful
- Add industry-specific terminology

Example structure:
\`\`\`
You are [ROLE] specializing in [DOMAIN].

Your expertise includes:
- [Skill 1]
- [Skill 2]

When responding:
- [Behavior 1]
- [Behavior 2]

Never:
- [Restriction 1]
- [Restriction 2]
\`\`\`

## MODELS AVAILABLE

### GPT-4o (OpenAI)
- Best for: Complex reasoning, creative writing
- Strengths: Most versatile, excellent code generation
- Context: 128K tokens

### GPT-4o-mini (OpenAI)
- Best for: High-volume, cost-sensitive applications
- Strengths: Fast, affordable
- Context: 128K tokens

### Claude 3.5 Sonnet (Anthropic)
- Best for: Long documents, nuanced analysis
- Strengths: Large context window, great reading comprehension
- Context: 200K tokens

### Gemini Pro (Google)
- Best for: Multimodal, real-time information
- Strengths: Fast, efficient, good multilingual support
- Context: 32K tokens

## DEPLOYMENT OPTIONS

### 1. Share Link
- Generate a public or private link
- Users can chat without logging in
- Rate limiting available to prevent abuse

### 2. Embed Widget
- Add a chat widget to any website
- Customizable appearance and position
- Copy-paste JavaScript code

### 3. API Integration
- REST API for custom integrations
- Generate API keys with granular permissions
- Rate limiting per key
- Full webhook support

### 4. Team Sharing
- Invite team members to use or edit GPTs
- Role-based access control
- Shared analytics

## KNOWLEDGE BASE

### Supported File Types
- PDF, Word (.docx), Text (.txt), Markdown (.md)
- Excel (.xlsx), PowerPoint (.pptx)
- Up to 50MB per file, 500MB total per GPT

### How It Works
1. Documents are processed and indexed
2. When users ask questions, relevant content is retrieved
3. GPT uses this context for accurate, grounded answers
4. Sources can be cited in responses

## WHITE-LABELING (Pro+ Plans)

### Available Customizations
- Remove "Powered by UltriumAI" branding
- Custom domain for embedded widgets
- Custom logo and colors throughout
- Custom email templates

## ANALYTICS

### Available Metrics
- Message volume over time
- Response time averages
- Token usage by GPT
- User engagement patterns
- Popular questions/topics

### Accessing Analytics
- Go to any GPT → Analytics tab
- View real-time and historical data
- Export reports as needed

## TROUBLESHOOTING

### GPT Not Responding
1. Check your credit balance
2. Verify the GPT is active (not in draft mode)
3. Check if the selected model is available
4. Review any error messages

### Knowledge Base Not Working
1. Ensure documents finished processing (check status)
2. Verify file format is supported
3. Check file isn't corrupted
4. Try re-uploading the document

### Slow Responses
1. Try a faster model (GPT-4o-mini or Gemini)
2. Reduce max_tokens in settings
3. Simplify the system prompt
4. Check if web search is enabled (adds latency)

## SECURITY & PRIVACY

- All data encrypted at rest and in transit
- SOC 2 Type II compliant infrastructure
- GDPR compliant with data deletion on request
- No training on customer data
- Audit logs for all administrative actions

## GETTING HELP

- Use Studio Assistant (me!) for instant help
- Check the Knowledge Base at /docs/ai-studio
- Contact support@ultriumai.com for billing issues
- Enterprise customers have dedicated support

Remember: I'm here to help you succeed with AI Studio. Ask me anything about building GPTs, managing credits, deployment, or troubleshooting!
`;

// Log helper
const log = (step: string, details?: any) => {
  console.log(`[STUDIO-ASSISTANT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { messages } = await req.json();
    log('Request received', { messageCount: messages?.length });

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
      log('User authenticated', { userId, email: userEmail });
    }

    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check credit balance BEFORE processing
    const { data: orgCredits } = await supabase
      .from('org_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Estimate tokens needed (rough: 500 for system + avg message length)
    const estimatedTokens = 800;
    const creditsNeeded = estimatedTokens / 1000; // 1 credit = 1000 tokens

    if (!orgCredits || orgCredits.credits_remaining < creditsNeeded) {
      log('Insufficient credits', { 
        remaining: orgCredits?.credits_remaining || 0, 
        needed: creditsNeeded 
      });
      
      return new Response(JSON.stringify({ 
        error: 'insufficient_credits',
        message: 'You have run out of AI Capacity. Please upgrade your plan or wait for your credits to reset.',
        credits_remaining: orgCredits?.credits_remaining || 0
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build messages with comprehensive knowledge
    const systemMessage = {
      role: 'system',
      content: AI_STUDIO_KNOWLEDGE + `

CRITICAL RESPONSE GUIDELINES:
- Be helpful, friendly, and conversational
- Provide accurate information based on the knowledge above
- Never reveal internal system details, database schemas, or implementation specifics
- Focus on user-facing features and how to use them
- If asked about pricing specifics not in your knowledge, direct users to the pricing page
- Keep responses concise but comprehensive
- Use formatting (headers, lists, bold) for readability
- If you don't know something, say so and suggest contacting support
`
    };

    const fullMessages = [systemMessage, ...messages];

    log('Calling Lovable AI Gateway');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service temporarily unavailable. Please try again later.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      log('AI Gateway error', { status: response.status, error: errorText });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || estimatedTokens;

    log('Response received', { tokensUsed });

    // Deduct credits after successful response
    const { data: deductResult, error: deductError } = await supabase.rpc('deduct_ai_credits', {
      p_user_id: userId,
      p_gpt_id: null,
      p_tokens: tokensUsed,
      p_usage_type: 'studio_assistant',
      p_conversation_id: null,
      p_description: 'Studio Assistant help session'
    });

    if (deductError) {
      log('Credit deduction error', { error: deductError.message });
      // Still return the response, just log the error
    } else {
      log('Credits deducted', deductResult);
    }

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      usage: {
        tokens_used: tokensUsed,
        credits_used: tokensUsed / 1000
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    log('Error', { message: error.message });
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
