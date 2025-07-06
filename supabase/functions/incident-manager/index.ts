import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface CreateIncidentRequest {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source_event_id?: string
  affected_systems?: string[]
  tags?: string[]
  user_id: string
}

interface UpdateIncidentRequest {
  incident_id: string
  status?: 'open' | 'assigned' | 'investigating' | 'escalated' | 'resolved' | 'closed'
  assigned_to?: string
  escalation_level?: number
  escalation_reason?: string
  impact_assessment?: string
  user_id: string
}

interface AddCommentRequest {
  incident_id: string
  comment: string
  is_internal?: boolean
  user_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...data } = await req.json()

    switch (action) {
      case 'create_incident':
        return await createIncident(data as CreateIncidentRequest)
      
      case 'update_incident':
        return await updateIncident(data as UpdateIncidentRequest)
      
      case 'add_comment':
        return await addComment(data as AddCommentRequest)
      
      case 'escalate_incident':
        return await escalateIncident(data)
      
      case 'get_incident_metrics':
        return await getIncidentMetrics(data.user_id)
      
      case 'check_sla_breaches':
        return await checkSLABreaches(data.user_id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }), 
          { status: 400, headers: corsHeaders }
        )
    }
  } catch (error) {
    console.error('Error in incident-manager:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: corsHeaders }
    )
  }
})

async function createIncident(data: CreateIncidentRequest) {
  try {
    // Calculate SLA deadlines based on priority
    const now = new Date()
    const responseSLA = getSLAMinutes(data.priority, 'response')
    const resolutionSLA = getSLAMinutes(data.priority, 'resolution')
    
    const slaDeadline = new Date(now.getTime() + (responseSLA * 60 * 1000))

    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .insert({
        user_id: data.user_id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        severity: data.severity,
        source_event_id: data.source_event_id,
        affected_systems: data.affected_systems || [],
        tags: data.tags || [],
        sla_deadline: slaDeadline.toISOString(),
        response_sla_minutes: responseSLA,
        resolution_sla_minutes: resolutionSLA
      })
      .select()
      .single()

    if (incidentError) {
      throw incidentError
    }

    // Log activity
    await logActivity({
      incident_id: incident.id,
      user_id: data.user_id,
      activity_type: 'created',
      description: `Incident created with ${data.priority} priority`,
      new_value: 'open'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        incident,
        message: 'Incident created successfully' 
      }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error creating incident:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create incident' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function updateIncident(data: UpdateIncidentRequest) {
  try {
    const updates: any = {}
    const activities: any[] = []

    if (data.status) {
      updates.status = data.status
      
      // Set timestamps based on status
      if (data.status === 'investigating') {
        updates.first_response_at = new Date().toISOString()
      }
      if (data.status === 'resolved' || data.status === 'closed') {
        updates.resolved_at = new Date().toISOString()
      }

      activities.push({
        incident_id: data.incident_id,
        user_id: data.user_id,
        activity_type: 'status_changed',
        description: `Status changed to ${data.status}`,
        new_value: data.status
      })
    }

    if (data.assigned_to) {
      updates.assigned_to = data.assigned_to
      updates.assigned_by = data.user_id
      updates.assigned_at = new Date().toISOString()

      activities.push({
        incident_id: data.incident_id,
        user_id: data.user_id,
        activity_type: 'assigned',
        description: `Incident assigned`,
        new_value: data.assigned_to
      })
    }

    if (data.escalation_level !== undefined) {
      updates.escalation_level = data.escalation_level
      updates.escalated_at = new Date().toISOString()
      updates.escalation_reason = data.escalation_reason

      activities.push({
        incident_id: data.incident_id,
        user_id: data.user_id,
        activity_type: 'escalated',
        description: `Incident escalated to level ${data.escalation_level}`,
        new_value: data.escalation_level.toString()
      })
    }

    if (data.impact_assessment) {
      updates.impact_assessment = data.impact_assessment
    }

    // Update incident
    const { error: updateError } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', data.incident_id)
      .eq('user_id', data.user_id)

    if (updateError) {
      throw updateError
    }

    // Log activities
    for (const activity of activities) {
      await logActivity(activity)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Incident updated successfully' 
      }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error updating incident:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to update incident' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function addComment(data: AddCommentRequest) {
  try {
    const { error: commentError } = await supabase
      .from('incident_comments')
      .insert({
        incident_id: data.incident_id,
        user_id: data.user_id,
        comment: data.comment,
        is_internal: data.is_internal || false
      })

    if (commentError) {
      throw commentError
    }

    // Log activity
    await logActivity({
      incident_id: data.incident_id,
      user_id: data.user_id,
      activity_type: 'commented',
      description: 'Added a comment to the incident'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Comment added successfully' 
      }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error adding comment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add comment' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function escalateIncident(data: any) {
  try {
    const { incident_id, user_id, escalation_reason, escalate_to } = data

    const { error: escalateError } = await supabase
      .from('incidents')
      .update({
        escalation_level: supabase.sql`escalation_level + 1`,
        escalated_at: new Date().toISOString(),
        escalation_reason,
        escalated_to: escalate_to,
        status: 'escalated'
      })
      .eq('id', incident_id)
      .eq('user_id', user_id)

    if (escalateError) {
      throw escalateError
    }

    // Log activity
    await logActivity({
      incident_id,
      user_id,
      activity_type: 'escalated',
      description: `Incident escalated: ${escalation_reason}`,
      new_value: 'escalated'
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Incident escalated successfully' 
      }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error escalating incident:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to escalate incident' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function getIncidentMetrics(userId: string) {
  try {
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))

    const metrics = {
      total_incidents: incidents.length,
      open_incidents: incidents.filter(i => ['open', 'assigned', 'investigating'].includes(i.status)).length,
      critical_incidents: incidents.filter(i => i.priority === 'critical').length,
      overdue_incidents: incidents.filter(i => 
        i.sla_deadline && new Date(i.sla_deadline) < now && !['resolved', 'closed'].includes(i.status)
      ).length,
      incidents_today: incidents.filter(i => new Date(i.created_at) >= today).length,
      incidents_this_week: incidents.filter(i => new Date(i.created_at) >= thisWeek).length,
      avg_resolution_time: calculateAverageResolutionTime(incidents.filter(i => i.resolved_at)),
      sla_compliance: calculateSLACompliance(incidents)
    }

    return new Response(
      JSON.stringify({ success: true, metrics }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error getting incident metrics:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get incident metrics' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function checkSLABreaches(userId: string) {
  try {
    const now = new Date()
    
    const { data: breaches, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .not('status', 'in', '(resolved,closed)')
      .lt('sla_deadline', now.toISOString())

    if (error) {
      throw error
    }

    // For each breach, we could send notifications here
    for (const incident of breaches || []) {
      console.log(`SLA breach detected for incident ${incident.id}: ${incident.title}`)
      
      // Could trigger notifications via the alert processor
      // await supabase.functions.invoke('siem-alert-processor', {
      //   body: {
      //     incident_id: incident.id,
      //     breach_type: 'sla_deadline',
      //     severity: incident.priority
      //   }
      // })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        breaches: breaches || [],
        count: breaches?.length || 0
      }), 
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error checking SLA breaches:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check SLA breaches' }), 
      { status: 500, headers: corsHeaders }
    )
  }
}

async function logActivity(activity: any) {
  try {
    await supabase
      .from('incident_activities')
      .insert(activity)
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

function getSLAMinutes(priority: string, type: 'response' | 'resolution'): number {
  const slaMatrix = {
    critical: { response: 60, resolution: 240 },    // 1h response, 4h resolution
    high: { response: 240, resolution: 1440 },      // 4h response, 24h resolution
    medium: { response: 480, resolution: 2880 },    // 8h response, 48h resolution
    low: { response: 1440, resolution: 4320 }       // 24h response, 72h resolution
  }
  
  return slaMatrix[priority as keyof typeof slaMatrix]?.[type] || slaMatrix.medium[type]
}

function calculateAverageResolutionTime(resolvedIncidents: any[]): number {
  if (resolvedIncidents.length === 0) return 0
  
  const totalTime = resolvedIncidents.reduce((sum, incident) => {
    const created = new Date(incident.created_at).getTime()
    const resolved = new Date(incident.resolved_at).getTime()
    return sum + (resolved - created)
  }, 0)
  
  return Math.round(totalTime / resolvedIncidents.length / (1000 * 60)) // Return in minutes
}

function calculateSLACompliance(incidents: any[]): number {
  if (incidents.length === 0) return 100
  
  const resolvedIncidents = incidents.filter(i => i.resolved_at)
  if (resolvedIncidents.length === 0) return 100
  
  const compliantIncidents = resolvedIncidents.filter(incident => {
    const deadline = new Date(incident.sla_deadline)
    const resolved = new Date(incident.resolved_at)
    return resolved <= deadline
  })
  
  return Math.round((compliantIncidents.length / resolvedIncidents.length) * 100)
}