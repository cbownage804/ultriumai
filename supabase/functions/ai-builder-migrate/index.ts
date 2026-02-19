import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const { sql, supabaseUrl, supabaseServiceKey } = await req.json()

    if (!sql || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Missing required fields: sql, supabaseUrl, supabaseServiceKey' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate SQL — block dangerous operations
    const upperSql = sql.toUpperCase().trim()
    const blocked = ['DROP DATABASE', 'DROP SCHEMA', 'TRUNCATE ALL', 'ALTER SYSTEM']
    for (const b of blocked) {
      if (upperSql.includes(b)) {
        return new Response(JSON.stringify({ error: `Blocked: "${b}" is not allowed in migrations.` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Connect to the user's Supabase project using their service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Execute the migration via the Supabase SQL endpoint
    // We use the REST API to run raw SQL
    const sqlEndpoint = `${supabaseUrl}/rest/v1/rpc/`

    // Try executing via pg_net or direct REST — use the SQL editor endpoint
    const response = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ query: sql }),
    })

    // If the pg/query endpoint isn't available, try the Management API
    if (!response.ok && response.status === 404) {
      // Fallback: use the Supabase Management API SQL endpoint
      // Extract project ref from URL
      const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
      if (!projectRef) {
        return new Response(JSON.stringify({ 
          error: 'Could not extract project reference from URL.',
          fallback: true,
          sql,
        }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Try the database query endpoint
      const mgmtResponse = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({}),
      })

      // If we can't execute directly, return the SQL for manual execution
      // with instructions (graceful degradation)
      return new Response(JSON.stringify({
        success: false,
        fallback: true,
        sql,
        message: 'Direct SQL execution is not available. Please run this migration manually in your Supabase SQL Editor.',
        sqlEditorUrl: `https://supabase.com/dashboard/project/${projectRef}/sql/new`,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorMsg = errorText
      try {
        const parsed = JSON.parse(errorText)
        errorMsg = parsed.message || parsed.error || parsed.hint || errorText
      } catch { /* use raw text */ }

      return new Response(JSON.stringify({
        success: false,
        error: errorMsg,
        sql,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await response.json().catch(() => ({}))

    // Extract affected tables from the SQL for the summary
    const tableMatches = sql.match(/(?:CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:public\.)?(\w+)/gi) || []
    const affectedTables = tableMatches.map((m: string) => {
      const parts = m.split(/\s+/)
      return parts[parts.length - 1].replace('public.', '')
    })

    // Detect what was done
    const operations: string[] = []
    if (/CREATE\s+TABLE/i.test(sql)) operations.push('Created table(s)')
    if (/ALTER\s+TABLE/i.test(sql)) operations.push('Modified table(s)')
    if (/DROP\s+TABLE/i.test(sql)) operations.push('Dropped table(s)')
    if (/CREATE\s+POLICY/i.test(sql)) operations.push('Added RLS policies')
    if (/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql)) operations.push('Enabled RLS')
    if (/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/i.test(sql)) operations.push('Created function(s)')
    if (/CREATE\s+TRIGGER/i.test(sql)) operations.push('Created trigger(s)')
    if (/CREATE\s+INDEX/i.test(sql)) operations.push('Created index(es)')
    if (/INSERT\s+INTO/i.test(sql)) operations.push('Inserted data')

    return new Response(JSON.stringify({
      success: true,
      affectedTables,
      operations,
      result,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Migration execution error:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      success: false,
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
