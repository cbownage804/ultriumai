import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface ThreatFeed {
  indicator_type: 'ip' | 'domain' | 'hash' | 'url' | 'email'
  indicator_value: string
  threat_types: string[]
  confidence: number
  source: string
  metadata?: Record<string, any>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Starting threat intelligence update...')

    let updatedCount = 0
    let newCount = 0

    // Update from multiple threat intelligence sources
    const sources = [
      { name: 'Internal Honeypots', updater: updateInternalThreatIntel },
      { name: 'Public Blocklists', updater: updatePublicBlocklists },
      { name: 'Malware Signatures', updater: updateMalwareSignatures }
    ]

    for (const source of sources) {
      try {
        console.log(`Updating threat intelligence from: ${source.name}`)
        const result = await source.updater(supabase)
        updatedCount += result.updated
        newCount += result.new
        console.log(`${source.name}: ${result.new} new, ${result.updated} updated`)
      } catch (error) {
        console.error(`Error updating ${source.name}:`, error)
      }
    }

    // Clean up old/inactive threat intelligence (older than 30 days with low confidence)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error: cleanupError } = await supabase
      .from('threat_intelligence')
      .update({ is_active: false })
      .lt('updated_at', thirtyDaysAgo)
      .lt('confidence', 50)

    if (cleanupError) {
      console.error('Error cleaning up old threat intelligence:', cleanupError)
    } else {
      console.log('Cleaned up old threat intelligence entries')
    }

    console.log(`Threat intelligence update complete: ${newCount} new, ${updatedCount} updated`)

    return new Response(
      JSON.stringify({ 
        message: 'Threat intelligence updated successfully',
        new_indicators: newCount,
        updated_indicators: updatedCount,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error updating threat intelligence:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function updateInternalThreatIntel(supabase: any): Promise<{new: number, updated: number}> {
  // Simulate internal threat intelligence from honeypots, failed login attempts, etc.
  const internalThreats: ThreatFeed[] = [
    {
      indicator_type: 'ip',
      indicator_value: '192.168.100.1',
      threat_types: ['botnet', 'scanning'],
      confidence: 95,
      source: 'Internal Honeypot',
      metadata: {
        description: 'Repeated scanning attempts detected',
        first_detected: new Date().toISOString(),
        honeypot_id: 'hp-001'
      }
    },
    {
      indicator_type: 'ip',
      indicator_value: '10.0.0.100',
      threat_types: ['brute_force'],
      confidence: 88,
      source: 'Failed Login Detector',
      metadata: {
        description: 'Multiple failed login attempts',
        attempt_count: 25,
        target_services: ['ssh', 'ftp']
      }
    }
  ]

  return await upsertThreats(supabase, internalThreats)
}

async function updatePublicBlocklists(supabase: any): Promise<{new: number, updated: number}> {
  // Simulate fetching from public threat intelligence feeds
  const publicThreats: ThreatFeed[] = [
    {
      indicator_type: 'domain',
      indicator_value: 'malicious-site.com',
      threat_types: ['phishing', 'malware'],
      confidence: 90,
      source: 'External Feed',
      metadata: {
        description: 'Known phishing domain',
        category: 'finance_phishing'
      }
    },
    {
      indicator_type: 'url',
      indicator_value: 'http://fake-bank.com/login',
      threat_types: ['phishing'],
      confidence: 85,
      source: 'PhishTank',
      metadata: {
        description: 'Banking phishing page',
        target_brand: 'Major Bank'
      }
    },
    {
      indicator_type: 'domain',
      indicator_value: 'c2-server.evil',
      threat_types: ['command_control', 'botnet'],
      confidence: 92,
      source: 'Threat Intel Feed',
      metadata: {
        description: 'Command and control server',
        malware_family: 'generic_botnet'
      }
    }
  ]

  return await upsertThreats(supabase, publicThreats)
}

async function updateMalwareSignatures(supabase: any): Promise<{new: number, updated: number}> {
  // Simulate malware hash signatures from analysis
  const malwareThreats: ThreatFeed[] = [
    {
      indicator_type: 'hash',
      indicator_value: 'abc123def456789',
      threat_types: ['trojan', 'backdoor'],
      confidence: 98,
      source: 'Internal Sandbox',
      metadata: {
        description: 'Trojan.Generic.BackdoorX',
        file_type: 'PE32',
        size_bytes: 2048000
      }
    },
    {
      indicator_type: 'hash',
      indicator_value: '789xyz456abc123',
      threat_types: ['ransomware'],
      confidence: 96,
      source: 'VirusTotal',
      metadata: {
        description: 'Ransomware.Generic.CryptoLocker',
        encryption_method: 'AES-256',
        ransom_note: 'your_files_are_encrypted.txt'
      }
    }
  ]

  return await upsertThreats(supabase, malwareThreats)
}

async function upsertThreats(supabase: any, threats: ThreatFeed[]): Promise<{new: number, updated: number}> {
  let newCount = 0
  let updatedCount = 0

  for (const threat of threats) {
    try {
      // Check if indicator already exists
      const { data: existing } = await supabase
        .from('threat_intelligence')
        .select('id, confidence, last_seen')
        .eq('indicator_type', threat.indicator_type)
        .eq('indicator_value', threat.indicator_value)
        .eq('source', threat.source)
        .maybeSingle()

      if (existing) {
        // Update existing record with new confidence and last_seen
        const newConfidence = Math.max(existing.confidence, threat.confidence)
        const { error: updateError } = await supabase
          .from('threat_intelligence')
          .update({
            confidence: newConfidence,
            last_seen: new Date().toISOString(),
            threat_types: threat.threat_types,
            metadata: threat.metadata || {},
            is_active: true
          })
          .eq('id', existing.id)

        if (!updateError) {
          updatedCount++
        } else {
          console.error('Error updating threat intelligence:', updateError)
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('threat_intelligence')
          .insert({
            indicator_type: threat.indicator_type,
            indicator_value: threat.indicator_value,
            threat_types: threat.threat_types,
            confidence: threat.confidence,
            source: threat.source,
            metadata: threat.metadata || {},
            is_active: true
          })

        if (!insertError) {
          newCount++
        } else {
          console.error('Error inserting threat intelligence:', insertError)
        }
      }
    } catch (error) {
      console.error('Error processing threat:', threat, error)
    }
  }

  return { new: newCount, updated: updatedCount }
}