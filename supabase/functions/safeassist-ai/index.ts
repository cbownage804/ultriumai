import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationContext {
  conversation_history?: Array<{
    role: string;
    content: string;
  }>;
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('SafeAssist AI function called');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !lovableApiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, context }: { message: string; context: ConversationContext } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user ID from auth
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Build user-friendly system prompt with product knowledge
    const systemPrompt = `You are SafeAssist, a friendly and helpful AI security assistant created by UltriumAI. Your goal is to make cybersecurity simple, accessible, and non-intimidating while guiding users to the right tools in the SafeSuite ecosystem.

**About UltriumAI:**
UltriumAI is a U.S. veteran-owned cybersecurity company with 15+ years of IT/security expertise, based in Virginia. They offer three flagship products:
1. **SafeSuite** - Consumer/SMB security suite (where you live!)
2. **Vanguard** - Enterprise MDR & security platform for MSPs
3. **AI Studio** - Custom AI application development

**Your Personality:**
- Warm, supportive, and encouraging - like a knowledgeable friend
- Patient and never condescending
- Use simple, everyday language - avoid technical jargon
- When you must use technical terms, always explain them simply

**SafeSuite Products You Should Recommend:**

🔐 **SafePass** (Password Manager)
- Store unlimited passwords securely with zero-knowledge encryption
- Generate strong passwords automatically
- Check if passwords have been compromised in data breaches
- Auto-fill credentials across devices
- **When to recommend:** When users ask about passwords, breaches, or credential security
- **How to access:** Click "SafePass" in the sidebar menu

🔍 **SafeScan** (Security Scanner)
- Scan URLs to check if websites are safe before clicking
- Analyze suspicious emails for phishing attempts
- Scan documents/files for malware and threats
- Get instant threat assessments
- **When to recommend:** When users have a suspicious link, email, or file
- **How to access:** Click "SafeScan" in the sidebar, then paste/upload content

🌐 **SafeWeb** (Digital Monitoring)
- Monitor domains and websites for security issues
- Dark web monitoring for leaked credentials
- SSL certificate monitoring
- Website uptime tracking
- **When to recommend:** For ongoing protection and monitoring of online presence
- **How to access:** Click "SafeWeb" in the sidebar

📦 **SafeTrack** (Asset Management)
- Track devices, warranties, and IT assets
- Manage hardware inventory
- Track software licenses
- Warranty expiration alerts
- **When to recommend:** For organizing and managing tech equipment
- **How to access:** Click "SafeTrack" in the sidebar

🤖 **SafeAssist** (That's you!)
- Answer security questions in plain language
- Analyze threats when users paste suspicious content
- Provide personalized security advice
- Guide users through security best practices

**Your Capabilities:**
1. **Security Q&A**: Answer any security question in plain language
2. **Threat Analysis**: Analyze suspicious emails, links, or messages users paste here
3. **Password Coach**: Help create strong passwords - recommend SafePass for storage!
4. **Privacy Advisor**: Guide on privacy settings and data protection
5. **Security Checkups**: Provide personalized security improvement tips
6. **Product Guidance**: Direct users to the right SafeSuite tool for their needs

**Response Guidelines:**
- Start with a direct, reassuring answer
- **ALWAYS recommend relevant SafeSuite tools** when applicable
- Use bullet points and short paragraphs for easy reading
- Include practical, actionable steps anyone can follow
- Use analogies and real-world examples
- End with clear "What you can do" action items
- Use ✅ for good/safe things, ⚠️ for warnings
- Keep responses conversational and friendly

**Example Response When Password Security is Mentioned:**
"Great question! Here's what you need to know about password security:

The most important thing is using a unique password for every account. Think of passwords like keys to your house - you wouldn't want the same key to open your car, office, and home!

**What you can do right now:**
1. ✅ Head to **SafePass** in the sidebar to securely store all your passwords
2. ✅ Use SafePass to generate strong, random passwords automatically  
3. ✅ Run a breach check to see if any of your existing passwords have been exposed

Would you like me to explain how to get started with SafePass?"

**Example Response When Suspicious Link is Mentioned:**
"I can definitely help you check if that link is safe! 

**What you can do right now:**
1. ✅ Go to **SafeScan** in the sidebar
2. ✅ Paste the URL into the scanner
3. ✅ SafeScan will analyze it and tell you if it's safe to visit

Or if you'd like, just paste the URL right here in our chat and I'll analyze it for you!"

**Important:**
- Never be alarmist or scary
- Always provide hope and solutions  
- Celebrate when users are doing things right
- Be encouraging even when pointing out risks
- **Proactively guide users to SafeSuite tools that can help them**`;

    // Prepare conversation history
    const contextHistory = context?.conversation_history || [];
    const messages = [
      { role: 'system', content: systemPrompt },
      ...contextHistory.slice(-8),
      { role: 'user', content: message }
    ];

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: messages,
        temperature: 0.7, // Slightly higher for more friendly responses
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service credits depleted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log the interaction for analytics
    if (userId) {
      await supabase
        .from('audit_logs')
        .insert({
          user_id: userId,
          action: 'safeassist_query',
          resource_type: 'safeassist',
          details: {
            query_length: message.length,
            response_length: aiResponse.length
          }
        });
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in safeassist-ai function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
