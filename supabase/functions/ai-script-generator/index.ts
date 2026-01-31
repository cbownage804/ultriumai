import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      description, 
      language, 
      targetOS,
      requirements,
      includeErrorHandling,
      includeLogging,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const languageInfo: Record<string, string> = {
      powershell: 'PowerShell for Windows automation',
      bash: 'Bash for Linux/macOS automation',
      python: 'Python for cross-platform scripting',
      batch: 'Windows Batch/CMD scripting',
      vbscript: 'VBScript for legacy Windows automation'
    };

    const systemPrompt = `You are an expert IT automation script generator for an MSP platform. Generate production-ready scripts based on natural language descriptions.

Guidelines:
1. Write clean, well-commented code
2. Include proper error handling when requested
3. Add logging functionality when requested
4. Follow best practices for the target language
5. Consider security implications
6. Make scripts idempotent where possible
7. Include usage instructions in comments

For ${language || 'PowerShell'} (${languageInfo[language] || 'automation scripting'}):
- Use modern syntax and conventions
- Include parameter validation
- Handle edge cases gracefully

Format your response as JSON:
{
  "script": "The complete script code",
  "language": "powershell|bash|python|batch",
  "description": "What the script does",
  "requirements": ["requirement1", "requirement2"],
  "parameters": [
    {"name": "paramName", "type": "string", "required": true, "description": "what it does"}
  ],
  "usage": "How to run the script with examples",
  "warnings": ["any security or operational warnings"],
  "estimatedRuntime": "estimated execution time",
  "testingNotes": "How to safely test this script"
}`;

    const userMessage = `Generate a ${language || 'PowerShell'} script for ${targetOS || 'Windows'}.

Description: ${description}

${requirements ? `Additional Requirements:
${requirements}` : ''}

Options:
- Include error handling: ${includeErrorHandling !== false ? 'Yes' : 'No'}
- Include logging: ${includeLogging !== false ? 'Yes' : 'No'}

Please generate a production-ready script with appropriate comments and documentation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let scriptData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scriptData = JSON.parse(jsonMatch[0]);
      } else {
        // Extract script from code block if JSON parsing fails
        const codeMatch = content.match(/```(?:powershell|bash|python|batch)?\n?([\s\S]*?)```/);
        scriptData = {
          script: codeMatch ? codeMatch[1].trim() : content,
          language: language || 'powershell',
          description: description,
          requirements: [],
          usage: 'See script comments for usage instructions'
        };
      }
    } catch {
      const codeMatch = content.match(/```(?:powershell|bash|python|batch)?\n?([\s\S]*?)```/);
      scriptData = {
        script: codeMatch ? codeMatch[1].trim() : content,
        language: language || 'powershell',
        description: description,
        requirements: [],
        usage: 'See script comments for usage instructions'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      ...scriptData,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-script-generator:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
