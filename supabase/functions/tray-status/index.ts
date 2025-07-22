import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { device_id } = await req.json()

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Get device basic info
    const { data: device, error: deviceError } = await supabase
      .from('safenet_devices')
      .select('id, hostname, last_heartbeat, status, ip_address, os_info')
      .eq('id', device_id)
      .single()

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: 'Device not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Get alert counts using helper function
    const { data: alertCounts } = await supabase
      .rpc('get_device_alert_counts', { p_device_id: device_id })

    // 3. Get latest scan info using helper function
    const { data: latestScan } = await supabase
      .rpc('get_device_latest_scan', { p_device_id: device_id })

    // 4. Get recent vulnerabilities count
    const { data: vulnData } = await supabase
      .from('safenet_vulnerabilities')
      .select('severity')
      .eq('device_id', device_id)
      .eq('status', 'open')

    // 5. Get pending commands count
    const { data: pendingCommands } = await supabase
      .from('device_commands')
      .select('id')
      .eq('device_id', device_id)
      .eq('status', 'queued')

    // Determine online status (last heartbeat within 15 minutes)
    const lastHeartbeat = device.last_heartbeat ? new Date(device.last_heartbeat) : null
    const isOnline = lastHeartbeat ? 
      (Date.now() - lastHeartbeat.getTime()) < (15 * 60 * 1000) : false

    // Process vulnerability counts
    const vulnCounts = vulnData?.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Build comprehensive status response
    const statusResponse = {
      device: {
        id: device.id,
        hostname: device.hostname,
        ip_address: device.ip_address,
        os_info: device.os_info,
        status: device.status,
        online: isOnline,
        last_heartbeat: device.last_heartbeat
      },
      alerts: {
        critical: alertCounts?.[0]?.critical || 0,
        high: alertCounts?.[0]?.high || 0,
        medium: alertCounts?.[0]?.medium || 0,
        low: alertCounts?.[0]?.low || 0,
        info: alertCounts?.[0]?.info || 0,
        total: (alertCounts?.[0]?.critical || 0) + 
               (alertCounts?.[0]?.high || 0) + 
               (alertCounts?.[0]?.medium || 0) + 
               (alertCounts?.[0]?.low || 0) + 
               (alertCounts?.[0]?.info || 0)
      },
      vulnerabilities: {
        critical: vulnCounts.critical || 0,
        high: vulnCounts.high || 0,
        medium: vulnCounts.medium || 0,
        low: vulnCounts.low || 0,
        total: Object.values(vulnCounts).reduce((sum, count) => sum + count, 0)
      },
      last_scan: latestScan?.[0] ? {
        scan_id: latestScan[0].scan_id,
        scanned_at: latestScan[0].scanned_at,
        devices_found: latestScan[0].devices_found,
        scan_duration: latestScan[0].scan_duration,
        scan_type: latestScan[0].scan_type
      } : null,
      pending_commands: pendingCommands?.length || 0,
      status_summary: {
        // Overall status logic for tray icon color
        level: (() => {
          const criticalAlerts = alertCounts?.[0]?.critical || 0
          const criticalVulns = vulnCounts.critical || 0
          const highAlerts = alertCounts?.[0]?.high || 0
          const highVulns = vulnCounts.high || 0
          
          if (!isOnline) return 'offline'
          if (criticalAlerts > 0 || criticalVulns > 0) return 'critical'
          if (highAlerts > 0 || highVulns > 0) return 'warning'
          return 'healthy'
        })(),
        message: (() => {
          const criticalAlerts = alertCounts?.[0]?.critical || 0
          const criticalVulns = vulnCounts.critical || 0
          const highAlerts = alertCounts?.[0]?.high || 0
          
          if (!isOnline) return 'Device offline'
          if (criticalAlerts > 0) return `${criticalAlerts} critical alert${criticalAlerts > 1 ? 's' : ''}`
          if (criticalVulns > 0) return `${criticalVulns} critical vulnerabilit${criticalVulns > 1 ? 'ies' : 'y'}`
          if (highAlerts > 0) return `${highAlerts} high-priority alert${highAlerts > 1 ? 's' : ''}`
          return 'All systems healthy'
        })()
      },
      timestamp: new Date().toISOString()
    }

    return new Response(JSON.stringify(statusResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error fetching tray status:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})