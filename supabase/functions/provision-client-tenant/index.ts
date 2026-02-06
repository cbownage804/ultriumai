import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify user
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { partner_id, client_name, client_email, client_domain, seat_count, enabled_modules, resale_price_per_seat } = body

    if (!partner_id || !client_name || !client_email || !enabled_modules?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify partner belongs to user
    const { data: partner, error: partnerError } = await supabase
      .from('reseller_partners')
      .select('id, user_id, discount_percent, tier, status')
      .eq('id', partner_id)
      .single()

    if (partnerError || !partner || partner.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Partner not found' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (partner.status !== 'active') {
      return new Response(JSON.stringify({ error: 'Partner account is not active' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Calculate wholesale price based on modules and discount
    const moduleBasePrices: Record<string, number> = {
      'horizon': 8, 'pursuit': 12, 'response': 6, 'sentinel': 10,
      'recon': 15, 'cortex': 5, 'comply': 8, 'atlas': 4, 'ledger': 3,
    }

    const wholesalePerSeat = enabled_modules.reduce((sum: number, mod: string) => {
      return sum + (moduleBasePrices[mod] || 5)
    }, 0) * (1 - partner.discount_percent / 100)

    // Create the tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('reseller_client_tenants')
      .insert({
        partner_id,
        client_name,
        client_email,
        client_domain: client_domain || null,
        seat_count: seat_count || 10,
        enabled_modules,
        monthly_price_per_seat: Math.round(wholesalePerSeat * 100) / 100,
        resale_price_per_seat: resale_price_per_seat || wholesalePerSeat * 1.3,
        status: 'active',
      })
      .select()
      .single()

    if (tenantError) throw tenantError

    // Create initial billing record for this month
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

    const wholesaleTotal = wholesalePerSeat * (seat_count || 10)
    const resaleTotal = (resale_price_per_seat || wholesalePerSeat * 1.3) * (seat_count || 10)

    await supabase.from('reseller_billing_records').insert({
      partner_id,
      tenant_id: tenant.id,
      period_start: periodStart,
      period_end: periodEnd,
      wholesale_amount: Math.round(wholesaleTotal * 100) / 100,
      resale_amount: Math.round(resaleTotal * 100) / 100,
      margin_amount: Math.round((resaleTotal - wholesaleTotal) * 100) / 100,
      seat_count: seat_count || 10,
      modules: enabled_modules,
      status: 'pending',
    })

    // If partner has MSP linked, create msp_client record
    const { data: msp } = await supabase
      .from('msps')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (msp) {
      const { data: mspClient } = await supabase
        .from('msp_clients')
        .insert({
          msp_id: msp.id,
          name: client_name,
          contact_email: client_email,
          domain: client_domain || null,
          status: 'active',
        })
        .select()
        .single()

      if (mspClient) {
        await supabase
          .from('reseller_client_tenants')
          .update({ msp_client_id: mspClient.id })
          .eq('id', tenant.id)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      tenant,
      wholesale_per_seat: wholesalePerSeat,
      message: `Client "${client_name}" provisioned with ${enabled_modules.length} modules and ${seat_count || 10} seats.`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Provisioning error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
