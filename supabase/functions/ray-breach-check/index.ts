// HIBP k-anonymity breach check. Client sends a 5-char SHA-1 prefix only;
// the actual password never leaves the browser. We forward to HIBP and
// return the suffix list. No auth required (no PII on the wire).
// deno-lint-ignore-file no-explicit-any

const HIBP = 'https://api.pwnedpasswords.com/range/';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { prefix } = await req.json();
    if (typeof prefix !== 'string' || !/^[A-F0-9]{5}$/i.test(prefix)) {
      return new Response(JSON.stringify({ error: 'invalid prefix' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const res = await fetch(HIBP + prefix.toUpperCase(), {
      headers: { 'Add-Padding': 'true', 'User-Agent': 'Wrayth-Ray/1.0' },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'upstream', status: res.status }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const text = await res.text();
    const suffixes = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.split(':')[0]);
    return new Response(JSON.stringify({ suffixes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
