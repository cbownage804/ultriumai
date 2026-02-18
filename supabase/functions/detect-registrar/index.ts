const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map nameserver patterns to registrar info
const REGISTRAR_MAP: Array<{
  pattern: RegExp;
  name: string;
  id: string;
  icon: string;
  dnsUrl: string;
  instructions: string[];
}> = [
  {
    pattern: /domaincontrol\.com/i,
    name: 'GoDaddy',
    id: 'godaddy',
    icon: '🟢',
    dnsUrl: 'https://dcc.godaddy.com/manage/dns',
    instructions: [
      'Go to GoDaddy DNS Management for your domain',
      'Click "Add New Record"',
      'Add a CNAME record: Name = your subdomain (or @), Value = apps.ultriumai.com',
      'Add a TXT record: Name = _ultriumai, Value = (shown below)',
      'Save changes and wait for propagation',
    ],
  },
  {
    pattern: /cloudflare\.com/i,
    name: 'Cloudflare',
    id: 'cloudflare',
    icon: '🟠',
    dnsUrl: 'https://dash.cloudflare.com',
    instructions: [
      'Go to Cloudflare Dashboard → select your domain → DNS → Records',
      'Click "Add Record"',
      'Add a CNAME record: Name = @ (or subdomain), Target = apps.ultriumai.com, Proxy status = DNS only (gray cloud)',
      'Add a TXT record: Name = _ultriumai, Content = (shown below)',
      'Important: Set the CNAME proxy status to "DNS only" (gray cloud) for proper routing',
    ],
  },
  {
    pattern: /registrar-servers\.com|namecheap/i,
    name: 'Namecheap',
    id: 'namecheap',
    icon: '🔴',
    dnsUrl: 'https://ap.www.namecheap.com/domains/domaincontrolpanel',
    instructions: [
      'Go to Namecheap Dashboard → Domain List → Manage',
      'Click "Advanced DNS" tab',
      'Add a CNAME record: Host = @ (or subdomain), Value = apps.ultriumai.com',
      'Add a TXT record: Host = _ultriumai, Value = (shown below)',
      'For root domain, you may need to use URL Redirect instead of CNAME',
    ],
  },
  {
    pattern: /google|googledomains/i,
    name: 'Google Domains / Squarespace',
    id: 'google',
    icon: '🔵',
    dnsUrl: 'https://domains.squarespace.com',
    instructions: [
      'Go to Squarespace Domains (formerly Google Domains)',
      'Select your domain → DNS → Custom Records',
      'Add a CNAME record pointing to apps.ultriumai.com',
      'Add a TXT record: Host = _ultriumai, Value = (shown below)',
    ],
  },
  {
    pattern: /name\.com/i,
    name: 'Name.com',
    id: 'namecom',
    icon: '🟣',
    dnsUrl: 'https://www.name.com/account/domain',
    instructions: [
      'Go to Name.com → My Domains → select domain → DNS Records',
      'Add a CNAME record pointing to apps.ultriumai.com',
      'Add a TXT record: Host = _ultriumai, Value = (shown below)',
    ],
  },
  {
    pattern: /hover\.com/i,
    name: 'Hover',
    id: 'hover',
    icon: '🟤',
    dnsUrl: 'https://www.hover.com/control_panel/domain',
    instructions: [
      'Go to Hover → Domain → DNS tab',
      'Add a CNAME record pointing to apps.ultriumai.com',
      'Add a TXT record: Host = _ultriumai, Value = (shown below)',
    ],
  },
  {
    pattern: /aws|awsdns|amazonaws/i,
    name: 'Amazon Route 53',
    id: 'route53',
    icon: '🟡',
    dnsUrl: 'https://console.aws.amazon.com/route53/v2/hostedzones',
    instructions: [
      'Go to AWS Route 53 → Hosted Zones → select your domain',
      'Click "Create Record"',
      'Add a CNAME record: Name = @ or subdomain, Value = apps.ultriumai.com',
      'Add a TXT record: Name = _ultriumai, Value = (shown below)',
    ],
  },
  {
    pattern: /vercel-dns\.com/i,
    name: 'Vercel',
    id: 'vercel',
    icon: '⚫',
    dnsUrl: 'https://vercel.com/dashboard/domains',
    instructions: [
      'Go to Vercel Dashboard → Settings → Domains',
      'Select your domain → DNS Records',
      'Add a CNAME record pointing to apps.ultriumai.com',
      'Add a TXT record: Name = _ultriumai, Value = (shown below)',
    ],
  },
  {
    pattern: /netlify/i,
    name: 'Netlify',
    id: 'netlify',
    icon: '🌐',
    dnsUrl: 'https://app.netlify.com/teams',
    instructions: [
      'Go to Netlify → Domains → select your domain',
      'Add a CNAME record pointing to apps.ultriumai.com',
      'Add a TXT record: Name = _ultriumai, Value = (shown below)',
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();

    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Missing domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract root domain for NS lookup
    const parts = domain.split('.');
    const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain;

    console.log(`[detect-registrar] Looking up NS for ${rootDomain}`);

    // Query nameservers via DNS-over-HTTPS
    let nameservers: string[] = [];
    try {
      const nsRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${rootDomain}&type=NS`,
        { headers: { 'Accept': 'application/dns-json' } }
      );
      const nsData = await nsRes.json();

      if (nsData.Answer) {
        nameservers = nsData.Answer
          .filter((a: any) => a.type === 2)
          .map((a: any) => (a.data || '').replace(/\.$/, '').toLowerCase());
      }
    } catch (nsErr) {
      console.error('[detect-registrar] NS lookup failed:', nsErr);
    }

    console.log(`[detect-registrar] Nameservers: ${nameservers.join(', ')}`);

    // Match against known registrars
    let registrar = null;
    const nsString = nameservers.join(' ');

    for (const entry of REGISTRAR_MAP) {
      if (entry.pattern.test(nsString)) {
        registrar = {
          name: entry.name,
          id: entry.id,
          icon: entry.icon,
          dnsUrl: entry.dnsUrl,
          instructions: entry.instructions,
        };
        break;
      }
    }

    return new Response(
      JSON.stringify({
        domain: rootDomain,
        nameservers,
        registrar,
        detected: !!registrar,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[detect-registrar] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Detection failed', detected: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
