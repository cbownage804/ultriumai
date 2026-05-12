import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

interface FailureEvent {
  projectId?: string;
  phase: string;
  category: string;
  errorMessage: string;
  filePath?: string;
  attempt?: number;
  modelUsed?: string;
  promptVersion?: string;
  resolved?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const events: FailureEvent[] = Array.isArray(body?.events) ? body.events : [];
    if (events.length === 0) {
      return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth header (best-effort — telemetry tolerates anon)
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const rows = events.slice(0, 50).map(e => ({
      user_id: userId,
      project_id: e.projectId ?? null,
      phase: String(e.phase).slice(0, 32),
      category: String(e.category).slice(0, 64),
      error_message: String(e.errorMessage ?? '').slice(0, 1000),
      file_path: e.filePath ? String(e.filePath).slice(0, 256) : null,
      attempt: typeof e.attempt === 'number' ? e.attempt : null,
      model_used: e.modelUsed ? String(e.modelUsed).slice(0, 64) : null,
      prompt_version: e.promptVersion ? String(e.promptVersion).slice(0, 32) : null,
      resolved: !!e.resolved,
    }));

    const { error } = await supabase.from('ai_builder_failures').insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200, // never block client
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
