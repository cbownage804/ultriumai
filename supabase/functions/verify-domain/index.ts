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

    // Check CNAME record points to apps.ultriumai.com
    let cnameOk = false;
    try {
      const cnameRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domain}&type=CNAME`,
        { headers: { 'Accept': 'application/dns-json' } }
      );
      const cnameData = await cnameRes.json();
      if (cnameData.Answer) {
        cnameOk = cnameData.Answer.some((a: any) => {
          const val = (a.data || '').replace(/\.$/, '').toLowerCase();
          return val === 'apps.ultriumai.com';
        });
      }
      console.log(`[verify-domain] CNAME check: ok=${cnameOk}`);
    } catch (cnameErr) {
      console.error('[verify-domain] CNAME lookup failed:', cnameErr);
    }

    // Also accept A record pointing to 185.158.133.1 as fallback
    let aRecordOk = false;
    if (!cnameOk) {
      try {
        const aRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
          { headers: { 'Accept': 'application/dns-json' } }
        );
        const aData = await aRes.json();
        if (aData.Answer) {
          aRecordOk = aData.Answer.some((a: any) => a.data === '185.158.133.1');
        }
        console.log(`[verify-domain] A record fallback check: ok=${aRecordOk}`);
      } catch (aErr) {
        console.error('[verify-domain] A record lookup failed:', aErr);
      }
    }

    const dnsPointingCorrectly = cnameOk || aRecordOk;
    const verified = txtVerified && dnsPointingCorrectly;

    return new Response(
      JSON.stringify({
        verified,
        txtVerified,
        cnameOk,
        aRecordOk,
        domain,
        message: verified
          ? 'Domain verified successfully!'
          : !txtVerified
            ? 'TXT record not found. DNS propagation can take up to 48 hours.'
            : 'CNAME/A record not pointing to apps.ultriumai.com. Please check your DNS settings.',
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
