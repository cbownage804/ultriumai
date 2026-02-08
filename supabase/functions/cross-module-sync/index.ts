import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !userData.user) throw new Error('Not authenticated')
    const userId = userData.user.id

    const body = await req.json().catch(() => ({}))
    const action = body.action || 'full_sync'

    console.log(`[CROSS-MODULE-SYNC] Action: ${action}, User: ${userId}`)

    const results = {
      clients_to_orgs: 0,
      devices_to_configs: 0,
      tickets_to_activity: 0,
      errors: [] as string[],
    }

    if (action === 'full_sync' || action === 'sync_clients') {
      await syncClientsToAtlasOrgs(userId, results)
    }
    if (action === 'full_sync' || action === 'sync_devices') {
      await syncDevicesToAtlasConfigs(userId, results)
    }
    if (action === 'full_sync' || action === 'sync_tickets') {
      await syncTicketsToAtlasActivity(userId, results)
    }

    console.log('[CROSS-MODULE-SYNC] Results:', results)

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[CROSS-MODULE-SYNC] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Vanguard MSP Clients → Atlas Organizations ─────────────────────
async function syncClientsToAtlasOrgs(userId: string, results: any) {
  // Get user's MSP
  const { data: msp } = await supabase
    .from('msps')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!msp) return

  // Get all MSP clients
  const { data: clients } = await supabase
    .from('msp_clients')
    .select('*')
    .eq('msp_id', msp.id)

  if (!clients?.length) return

  // Get existing sync mappings for this user's clients
  const { data: existingMaps } = await supabase
    .from('cross_module_sync_mappings')
    .select('source_record_id, target_record_id')
    .eq('user_id', userId)
    .eq('source_table', 'msp_clients')
    .eq('target_table', 'atlas_organizations')

  const mappedSourceIds = new Set(existingMaps?.map(m => m.source_record_id) || [])

  for (const client of clients) {
    if (mappedSourceIds.has(client.id)) {
      // Update existing org
      const mapping = existingMaps!.find(m => m.source_record_id === client.id)!
      await supabase
        .from('atlas_organizations')
        .update({
          name: client.company_name,
          primary_contact_name: client.contact_name || null,
          primary_contact_email: client.contact_email || null,
          primary_contact_phone: client.contact_phone || null,
          address: client.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mapping.target_record_id)

      await supabase
        .from('cross_module_sync_mappings')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('source_record_id', client.id)
        .eq('target_table', 'atlas_organizations')

      results.clients_to_orgs++
      continue
    }

    // Create new Atlas organization
    const { data: org, error } = await supabase
      .from('atlas_organizations')
      .insert({
        user_id: userId,
        name: client.company_name,
        primary_contact_name: client.contact_name || null,
        primary_contact_email: client.contact_email || null,
        primary_contact_phone: client.contact_phone || null,
        address: client.address || null,
        notes: `Auto-synced from Vanguard client. Industry: ${client.industry || 'N/A'}`,
      })
      .select('id')
      .single()

    if (error) {
      results.errors.push(`Client ${client.company_name}: ${error.message}`)
      continue
    }

    // Create sync mapping
    await supabase.from('cross_module_sync_mappings').insert({
      user_id: userId,
      source_module: 'vanguard',
      source_table: 'msp_clients',
      source_record_id: client.id,
      target_module: 'atlas',
      target_table: 'atlas_organizations',
      target_record_id: org.id,
      sync_direction: 'bidirectional',
    })

    results.clients_to_orgs++
  }
}

// ─── Vanguard Agents (Devices) → Atlas Configurations ───────────────
async function syncDevicesToAtlasConfigs(userId: string, results: any) {
  // Get all user's agents
  const { data: agents } = await supabase
    .from('vanguard_agents')
    .select('*')
    .eq('user_id', userId)

  if (!agents?.length) return

  // Get existing mappings
  const { data: existingMaps } = await supabase
    .from('cross_module_sync_mappings')
    .select('source_record_id, target_record_id')
    .eq('user_id', userId)
    .eq('source_table', 'vanguard_agents')
    .eq('target_table', 'atlas_configurations')

  const mappedSourceIds = new Set(existingMaps?.map(m => m.source_record_id) || [])

  // Resolve client→org mappings for linking
  const { data: clientOrgMaps } = await supabase
    .from('cross_module_sync_mappings')
    .select('source_record_id, target_record_id')
    .eq('user_id', userId)
    .eq('source_table', 'msp_clients')
    .eq('target_table', 'atlas_organizations')

  const clientToOrg = new Map(clientOrgMaps?.map(m => [m.source_record_id, m.target_record_id]) || [])

  for (const agent of agents) {
    const orgId = agent.client_id ? clientToOrg.get(agent.client_id) : null

    const configData = {
      user_id: userId,
      name: agent.hostname || agent.device_name || 'Unknown Device',
      configuration_type: agent.agent_type === 'pi_appliance' ? 'Network Appliance' : 'Workstation',
      organization_id: orgId || null,
      configuration_data: {
        os_type: agent.os_type,
        os_version: agent.os_version,
        ip_address: agent.local_ip,
        public_ip: agent.public_ip,
        agent_version: agent.agent_version,
        cpu_model: agent.cpu_model,
        total_ram_gb: agent.total_ram_gb,
        disk_total_gb: agent.disk_total_gb,
        last_seen: agent.last_seen,
        status: agent.status,
      },
      is_active: agent.status === 'online',
    }

    if (mappedSourceIds.has(agent.id)) {
      const mapping = existingMaps!.find(m => m.source_record_id === agent.id)!
      await supabase
        .from('atlas_configurations')
        .update({ ...configData, updated_at: new Date().toISOString() })
        .eq('id', mapping.target_record_id)

      await supabase
        .from('cross_module_sync_mappings')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('source_record_id', agent.id)
        .eq('target_table', 'atlas_configurations')

      results.devices_to_configs++
      continue
    }

    const { data: config, error } = await supabase
      .from('atlas_configurations')
      .insert(configData)
      .select('id')
      .single()

    if (error) {
      results.errors.push(`Agent ${agent.hostname}: ${error.message}`)
      continue
    }

    await supabase.from('cross_module_sync_mappings').insert({
      user_id: userId,
      source_module: 'vanguard',
      source_table: 'vanguard_agents',
      source_record_id: agent.id,
      target_module: 'atlas',
      target_table: 'atlas_configurations',
      target_record_id: config.id,
      sync_direction: 'bidirectional',
    })

    results.devices_to_configs++
  }
}

// ─── Tickets → Atlas Activity Logs ──────────────────────────────────
async function syncTicketsToAtlasActivity(userId: string, results: any) {
  // Get recent tickets (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)

  if (!tickets?.length) return

  // Get existing mappings
  const { data: existingMaps } = await supabase
    .from('cross_module_sync_mappings')
    .select('source_record_id')
    .eq('user_id', userId)
    .eq('source_table', 'tickets')
    .eq('target_table', 'atlas_activity_logs')

  const mappedSourceIds = new Set(existingMaps?.map(m => m.source_record_id) || [])

  // Client→org mapping for linking
  const { data: clientOrgMaps } = await supabase
    .from('cross_module_sync_mappings')
    .select('source_record_id, target_record_id')
    .eq('user_id', userId)
    .eq('source_table', 'msp_clients')
    .eq('target_table', 'atlas_organizations')

  const clientToOrg = new Map(clientOrgMaps?.map(m => [m.source_record_id, m.target_record_id]) || [])

  for (const ticket of tickets) {
    if (mappedSourceIds.has(ticket.id)) continue // Already synced

    const orgId = ticket.client_id ? clientToOrg.get(ticket.client_id) : null

    const { data: log, error } = await supabase
      .from('atlas_activity_logs')
      .insert({
        user_id: userId,
        resource_type: 'ticket',
        resource_id: ticket.id,
        resource_name: ticket.title || ticket.subject,
        action: `ticket_${ticket.status || 'created'}`,
        organization_id: orgId || null,
        changes: {
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          description: ticket.description,
        },
      })
      .select('id')
      .single()

    if (error) {
      results.errors.push(`Ticket ${ticket.id}: ${error.message}`)
      continue
    }

    await supabase.from('cross_module_sync_mappings').insert({
      user_id: userId,
      source_module: 'helpdesk',
      source_table: 'tickets',
      source_record_id: ticket.id,
      target_module: 'atlas',
      target_table: 'atlas_activity_logs',
      target_record_id: log.id,
      sync_direction: 'source_to_target',
    })

    results.tickets_to_activity++
  }
}
