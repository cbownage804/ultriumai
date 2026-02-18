const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, txtRecord } = await req.json();

    if (!domain || !txtRecord) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing domain or txtRecord' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[verify-domain] Checking DNS for ${domain}, expecting TXT: ${txtRecord}`);

    // Check TXT record via DNS-over-HTTPS
    let txtVerified = false;
    try {
      const dnsRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=_ultriumai.${domain}&type=TXT`,
        { headers: { 'Accept': 'application/dns-json' } }
      );
      const dnsData = await dnsRes.json();

      if (dnsData.Answer) {
        for (const answer of dnsData.Answer) {
          const val = (answer.data || '').replace(/"/g, '').trim();
          if (val === txtRecord) {
            txtVerified = true;
            break;
          }
        }
      }

      console.log(`[verify-domain] TXT check: verified=${txtVerified}, answers=${dnsData.Answer?.length || 0}`);
    } catch (dnsErr) {
      console.error('[verify-domain] TXT lookup failed:', dnsErr);
    }

    // Check A record points to 185.158.133.1
    let aRecordOk = false;
    try {
      const aRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
        { headers: { 'Accept': 'application/dns-json' } }
      );
      const aData = await aRes.json();
      if (aData.Answer) {
        aRecordOk = aData.Answer.some((a: any) => a.data === '159.203.128.171');
      }
      console.log(`[verify-domain] A record check: ok=${aRecordOk}`);
    } catch (aErr) {
      console.error('[verify-domain] A record lookup failed:', aErr);
    }

    const dnsPointingCorrectly = aRecordOk;
    const verified = txtVerified && dnsPointingCorrectly;

    return new Response(
      JSON.stringify({
        verified,
        txtVerified,
        aRecordOk,
        domain,
        message: verified
          ? 'Domain verified successfully!'
          : !txtVerified
            ? 'TXT record not found. DNS propagation can take up to 48 hours.'
            : 'A record not pointing to 159.203.128.171. Please check your DNS settings.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[verify-domain] Error:', error);
    return new Response(
      JSON.stringify({ verified: false, error: 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
