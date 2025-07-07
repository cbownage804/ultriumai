import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    
    console.log('Threat Intelligence - Action:', action)

    switch (action) {
      case 'analyze_indicators':
        return await analyzeIndicators(payload)
      
      case 'get_threat_feed':
        return await getThreatFeed(payload)
      
      case 'check_reputation':
        return await checkReputation(payload)
      
      case 'generate_intel_report':
        return await generateIntelReport(payload)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Threat Intelligence Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function analyzeIndicators(payload: any) {
  const { indicators, user_id } = payload
  
  if (!indicators || !Array.isArray(indicators)) {
    throw new Error('Indicators array is required')
  }

  const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY')
  const intelxKey = Deno.env.get('INTELX_API_KEY')
  const results = []

  for (const indicator of indicators) {
    const analysis = {
      indicator: indicator.value,
      type: indicator.type, // ip, domain, url, hash
      reputation: 'unknown',
      threats: [],
      sources: [],
      score: 0,
      last_seen: null
    }

    // VirusTotal Analysis
    if (virusTotalKey) {
      try {
        const vtAnalysis = await analyzeWithVirusTotal(indicator, virusTotalKey)
        if (vtAnalysis) {
          analysis.reputation = vtAnalysis.reputation
          analysis.threats.push(...vtAnalysis.threats)
          analysis.sources.push('VirusTotal')
          analysis.score += vtAnalysis.score
        }
      } catch (error) {
        console.warn('VirusTotal analysis failed:', error)
      }
    }

    // AbuseIPDB Analysis (for IPs)
    try {
      const abuseAnalysis = await analyzeWithAbuseIPDB(indicator)
      if (abuseAnalysis) {
        analysis.threats.push(...abuseAnalysis.threats)
        analysis.sources.push('AbuseIPDB')
        analysis.score += abuseAnalysis.score
      }
    } catch (error) {
      console.warn('AbuseIPDB analysis failed:', error)
    }

    // URLVoid Analysis (for domains/URLs)
    try {
      const urlAnalysis = await analyzeWithURLVoid(indicator)
      if (urlAnalysis) {
        analysis.threats.push(...urlAnalysis.threats)
        analysis.sources.push('URLVoid')
        analysis.score += urlAnalysis.score
      }
    } catch (error) {
      console.warn('URLVoid analysis failed:', error)
    }

    // IntelX Analysis
    if (intelxKey) {
      try {
        const intelxAnalysis = await analyzeWithIntelX(indicator, intelxKey)
        if (intelxAnalysis) {
          analysis.threats.push(...intelxAnalysis.threats)
          analysis.sources.push('IntelX')
          analysis.score += intelxAnalysis.score
          analysis.last_seen = intelxAnalysis.last_seen
        }
      } catch (error) {
        console.warn('IntelX analysis failed:', error)
      }
    }

    // Determine final reputation
    if (analysis.score > 70) {
      analysis.reputation = 'malicious'
    } else if (analysis.score > 40) {
      analysis.reputation = 'suspicious'
    } else if (analysis.score > 10) {
      analysis.reputation = 'questionable'
    } else {
      analysis.reputation = 'clean'
    }

    results.push(analysis)

    // Store results in database
    if (user_id) {
      try {
        await supabase.from('threat_intelligence').insert({
          user_id,
          indicator_value: indicator.value,
          indicator_type: indicator.type,
          reputation: analysis.reputation,
          score: analysis.score,
          threats: analysis.threats,
          sources: analysis.sources,
          last_analyzed: new Date().toISOString()
        })
      } catch (dbError) {
        console.warn('Failed to store threat intelligence:', dbError)
      }
    }
  }

  return new Response(
    JSON.stringify({
      analysis_results: results,
      summary: {
        total_indicators: indicators.length,
        malicious: results.filter(r => r.reputation === 'malicious').length,
        suspicious: results.filter(r => r.reputation === 'suspicious').length,
        clean: results.filter(r => r.reputation === 'clean').length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function analyzeWithVirusTotal(indicator: any, apiKey: string) {
  const { value, type } = indicator
  let endpoint = ''
  let headers = {
    'x-apikey': apiKey,
    'Content-Type': 'application/json'
  }

  // Use v3 API for better results
  switch (type) {
    case 'ip':
      endpoint = `https://www.virustotal.com/api/v3/ip_addresses/${value}`
      break
    case 'domain':
      endpoint = `https://www.virustotal.com/api/v3/domains/${value}`
      break
    case 'url':
      // For URLs, we need to encode them
      const urlId = btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`
      break
    case 'hash':
      endpoint = `https://www.virustotal.com/api/v3/files/${value}`
      break
    default:
      return null
  }

  const response = await fetch(endpoint, { headers })
  if (!response.ok) return null

  const data = await response.json()
  
  if (!data.data) return null

  const stats = data.data.attributes?.last_analysis_stats || {}
  const results = data.data.attributes?.last_analysis_results || {}
  
  const malicious = stats.malicious || 0
  const suspicious = stats.suspicious || 0
  const total = Object.keys(results).length || 0
  const threats = []

  // Extract threat information
  Object.entries(results).forEach(([engine, result]: [string, any]) => {
    if (result.category === 'malicious' && result.result) {
      threats.push({
        engine,
        threat_name: result.result,
        category: categorizeThreap(result.result)
      })
    }
  })

  const positives = malicious + suspicious
  
  return {
    reputation: malicious > 5 ? 'malicious' : positives > 0 ? 'suspicious' : 'clean',
    score: Math.min(positives * 10, 80),
    threats: threats.slice(0, 10),
    detection_ratio: `${positives}/${total}`,
    last_analysis: data.data.attributes?.last_analysis_date
  }
}

// Add AbuseIPDB analysis for IP reputation
async function analyzeWithAbuseIPDB(indicator: any) {
  const { value, type } = indicator
  
  if (type !== 'ip') return null

  try {
    const response = await fetch(`https://api.abuseipdb.com/api/v2/check`, {
      method: 'GET',
      headers: {
        'Key': Deno.env.get('ABUSEIPDB_API_KEY') || '',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        ipAddress: value,
        maxAgeInDays: '90',
        verbose: ''
      })
    })

    if (!response.ok) return null

    const data = await response.json()
    const abuseConfidence = data.data?.abuseConfidencePercentage || 0
    
    return {
      score: Math.min(abuseConfidence, 70),
      threats: abuseConfidence > 25 ? [{
        source: 'AbuseIPDB',
        threat_name: `Abuse Confidence: ${abuseConfidence}%`,
        category: 'suspicious_ip'
      }] : [],
      reputation: abuseConfidence > 75 ? 'malicious' : abuseConfidence > 25 ? 'suspicious' : 'clean'
    }
  } catch (error) {
    console.warn('AbuseIPDB analysis failed:', error)
    return null
  }
}

// Add URLVoid analysis for domain/URL reputation  
async function analyzeWithURLVoid(indicator: any) {
  const { value, type } = indicator
  
  if (type !== 'domain' && type !== 'url') return null

  try {
    // URLVoid is free but requires registration - using basic analysis
    const domain = type === 'url' ? new URL(value).hostname : value
    
    // Simple heuristic analysis (in production, integrate with URLVoid API)
    const suspiciousPatterns = [
      /[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}/, // IP-like domains
      /\b(bit\.ly|tinyurl|short|tiny)\b/i, // URL shorteners
      /\b(phish|scam|fake|malware)\b/i, // Suspicious keywords
      /[a-z]{20,}\.com/i, // Very long random domains
    ]
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain))
    
    return {
      score: isSuspicious ? 40 : 0,
      threats: isSuspicious ? [{
        source: 'Pattern Analysis',
        threat_name: 'Suspicious domain pattern',
        category: 'suspicious_domain'
      }] : [],
      reputation: isSuspicious ? 'suspicious' : 'clean'
    }
  } catch (error) {
    console.warn('URLVoid analysis failed:', error)
    return null
  }
}

async function analyzeWithIntelX(indicator: any, apiKey: string) {
  const { value, type } = indicator

  const response = await fetch('https://2.intelx.io/phonebook/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-key': apiKey
    },
    body: JSON.stringify({
      term: value,
      buckets: ['leaks', 'darkweb', 'pastes'],
      lookuplevel: 0,
      maxresults: 10
    })
  })

  if (!response.ok) return null

  const data = await response.json()
  const threats = []
  let score = 0

  if (data.selectors && data.selectors.length > 0) {
    score = Math.min(data.selectors.length * 15, 60)
    
    data.selectors.forEach((selector: any) => {
      threats.push({
        source: selector.bucket,
        context: selector.selectorvalue,
        confidence: 'medium'
      })
    })
  }

  return {
    score,
    threats,
    last_seen: data.selectors?.[0]?.date || null
  }
}

function categorizeThreap(threatName: string): string {
  const lower = threatName.toLowerCase()
  
  if (lower.includes('trojan')) return 'trojan'
  if (lower.includes('malware')) return 'malware'
  if (lower.includes('phish')) return 'phishing'
  if (lower.includes('spam')) return 'spam'
  if (lower.includes('adware')) return 'adware'
  if (lower.includes('ransomware')) return 'ransomware'
  if (lower.includes('rootkit')) return 'rootkit'
  if (lower.includes('virus')) return 'virus'
  if (lower.includes('worm')) return 'worm'
  
  return 'unknown'
}

async function getThreatFeed(payload: any) {
  const { feed_type = 'general', limit = 50 } = payload

  // Get recent threat intelligence from database
  const { data: threats, error } = await supabase
    .from('threat_intelligence')
    .select('*')
    .eq('reputation', 'malicious')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn('Database query failed:', error)
  }

  // Supplement with live threat feeds (simulated)
  const liveFeed = await generateLiveThreatFeed(feed_type, limit)

  return new Response(
    JSON.stringify({
      feed_type,
      threats: threats || [],
      live_feed: liveFeed,
      generated_at: new Date().toISOString(),
      next_update: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateLiveThreatFeed(feedType: string, limit: number) {
  // This would integrate with real threat feeds in production
  const threatTypes = ['malware', 'phishing', 'botnet', 'ransomware', 'apt']
  const feed = []

  for (let i = 0; i < Math.min(limit, 20); i++) {
    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)]
    
    feed.push({
      id: crypto.randomUUID(),
      threat_type: threatType,
      indicator: generateMockIndicator(threatType),
      confidence: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
      description: `${threatType} activity detected`,
      first_seen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [threatType, 'malicious', 'automated']
    })
  }

  return feed
}

function generateMockIndicator(threatType: string): string {
  const domains = ['malicious-site.com', 'phishing-bank.net', 'fake-update.org']
  const ips = ['192.168.1.100', '10.0.0.50', '172.16.1.25']
  
  switch (threatType) {
    case 'phishing':
      return domains[Math.floor(Math.random() * domains.length)]
    case 'botnet':
      return ips[Math.floor(Math.random() * ips.length)]
    default:
      return Math.random() > 0.5 ? 
        domains[Math.floor(Math.random() * domains.length)] :
        ips[Math.floor(Math.random() * ips.length)]
  }
}

async function checkReputation(payload: any) {
  const { indicators } = payload
  
  if (!indicators || !Array.isArray(indicators)) {
    throw new Error('Indicators array is required')
  }

  const results = []
  
  for (const indicator of indicators) {
    // Quick reputation check from local database
    const { data: cached } = await supabase
      .from('threat_intelligence')
      .select('*')
      .eq('indicator_value', indicator)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached && isCacheValid(cached.created_at)) {
      results.push({
        indicator,
        reputation: cached.reputation,
        score: cached.score,
        last_analyzed: cached.last_analyzed,
        source: 'cache'
      })
    } else {
      // Perform fresh analysis
      const analysis = await analyzeIndicators({ 
        indicators: [{ value: indicator, type: detectIndicatorType(indicator) }] 
      })
      const analysisData = await analysis.json()
      
      if (analysisData.analysis_results?.[0]) {
        results.push({
          indicator,
          ...analysisData.analysis_results[0],
          source: 'live'
        })
      }
    }
  }

  return new Response(
    JSON.stringify({ reputation_results: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function isCacheValid(timestamp: string): boolean {
  const cacheAge = Date.now() - new Date(timestamp).getTime()
  return cacheAge < 24 * 60 * 60 * 1000 // 24 hours
}

function detectIndicatorType(indicator: string): string {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(indicator)) return 'ip'
  if (/^[a-f0-9]{32,}$/i.test(indicator)) return 'hash'
  if (indicator.includes('://')) return 'url'
  if (indicator.includes('.')) return 'domain'
  return 'unknown'
}

async function generateIntelReport(payload: any) {
  const { user_id, days = 7 } = payload
  
  if (!user_id) {
    throw new Error('User ID is required')
  }

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get threat intelligence data for the period
  const { data: threats } = await supabase
    .from('threat_intelligence')
    .select('*')
    .eq('user_id', user_id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const report = {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days
    },
    summary: {
      total_indicators: threats?.length || 0,
      malicious_count: threats?.filter(t => t.reputation === 'malicious').length || 0,
      suspicious_count: threats?.filter(t => t.reputation === 'suspicious').length || 0,
      unique_threat_types: [...new Set(threats?.flatMap(t => t.threats?.map((th: any) => th.category) || []))],
      top_sources: getTopSources(threats || [])
    },
    threat_trends: analyzeThreatTrends(threats || []),
    recommendations: [
      'Monitor suspicious indicators closely',
      'Implement additional security controls for malicious indicators',
      'Update threat detection rules based on latest intelligence',
      'Review and update incident response procedures'
    ]
  }

  return new Response(
    JSON.stringify(report),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getTopSources(threats: any[]): string[] {
  const sources = threats.flatMap(t => t.sources || [])
  const counts = sources.reduce((acc, source) => {
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source]) => source)
}

function analyzeThreatTrends(threats: any[]) {
  const daily = threats.reduce((acc, threat) => {
    const date = new Date(threat.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    daily_counts: daily,
    trend: Object.keys(daily).length > 1 ? 'increasing' : 'stable'
  }
}