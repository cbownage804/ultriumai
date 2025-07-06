import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

interface EmailThreat {
  subject: string
  sender: string
  content?: string
  attachments?: string[]
  timestamp: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    
    console.log('SafeMail Scanner - Action:', action, 'Payload:', payload)

    switch (action) {
      case 'scan_email':
        return await scanEmail(payload)
      
      case 'analyze_sender':
        return await analyzeSender(payload)
      
      case 'check_links':
        return await checkLinks(payload)
      
      case 'scan_attachments':
        return await scanAttachments(payload)
      
      case 'generate_threat_report':
        return await generateThreatReport(payload)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('SafeMail Scanner Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function scanEmail(payload: any) {
  const { email } = payload as { email: EmailThreat }
  
  if (!email) {
    throw new Error('Email data is required')
  }

  const threats = []
  let riskScore = 0

  // Check for phishing indicators
  const phishingIndicators = [
    'urgent', 'verify', 'suspend', 'click here', 'act now', 'limited time',
    'confirm your account', 'update payment', 'security alert'
  ]
  
  const content = `${email.subject} ${email.content || ''}`.toLowerCase()
  const phishingMatches = phishingIndicators.filter(indicator => 
    content.includes(indicator)
  )

  if (phishingMatches.length > 0) {
    threats.push({
      type: 'phishing',
      severity: phishingMatches.length > 2 ? 'high' : 'medium',
      description: `Potential phishing email detected. Found indicators: ${phishingMatches.join(', ')}`,
      indicators: phishingMatches
    })
    riskScore += phishingMatches.length * 10
  }

  // Check sender reputation
  const senderRisk = analyzeSenderReputation(email.sender)
  if (senderRisk.isRisky) {
    threats.push({
      type: 'sender_reputation',
      severity: senderRisk.severity,
      description: senderRisk.description,
      details: senderRisk
    })
    riskScore += senderRisk.score
  }

  // Check for suspicious links
  if (email.content) {
    const linkRisk = await checkSuspiciousLinks(email.content)
    if (linkRisk.suspiciousLinks.length > 0) {
      threats.push({
        type: 'malicious_links',
        severity: linkRisk.maxSeverity,
        description: `Found ${linkRisk.suspiciousLinks.length} suspicious links`,
        links: linkRisk.suspiciousLinks
      })
      riskScore += linkRisk.totalScore
    }
  }

  // Check attachments
  if (email.attachments && email.attachments.length > 0) {
    const attachmentRisk = await scanEmailAttachments(email.attachments)
    if (attachmentRisk.threats.length > 0) {
      threats.push(...attachmentRisk.threats)
      riskScore += attachmentRisk.totalScore
    }
  }

  const finalScore = Math.min(riskScore, 100)
  const action = finalScore > 80 ? 'block' : finalScore > 50 ? 'quarantine' : finalScore > 20 ? 'flag' : 'allow'

  return new Response(
    JSON.stringify({
      riskScore: finalScore,
      action,
      threats,
      summary: {
        threatCount: threats.length,
        highestSeverity: threats.length > 0 ? 
          threats.reduce((max, t) => t.severity === 'critical' ? 'critical' : 
            t.severity === 'high' && max !== 'critical' ? 'high' : 
            t.severity === 'medium' && !['critical', 'high'].includes(max) ? 'medium' : 
            max, 'low') : 'none'
      },
      scanTimestamp: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function analyzeSender(payload: any) {
  const { sender } = payload
  
  if (!sender) {
    throw new Error('Sender email is required')
  }

  const analysis = analyzeSenderReputation(sender)
  
  return new Response(
    JSON.stringify(analysis),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function analyzeSenderReputation(sender: string) {
  // Simulate sender reputation analysis
  const suspiciousDomains = [
    'tempmail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'example.com', 'test.com', 'fake-bank.com', 'phishing-site.net'
  ]
  
  const domain = sender.split('@')[1]?.toLowerCase()
  const isSuspiciousDomain = suspiciousDomains.includes(domain)
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /no-?reply/i,
    /support\d+/i,
    /admin\d+/i,
    /security\d+/i,
    /[0-9]{4,}/,
    /[a-z]{20,}/i
  ]
  
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => pattern.test(sender))
  
  let score = 0
  let severity = 'low'
  let description = 'Sender appears legitimate'
  
  if (isSuspiciousDomain) {
    score += 40
    severity = 'high'
    description = 'Sender uses suspicious domain'
  }
  
  if (hasSuspiciousPattern) {
    score += 20
    severity = score > 40 ? 'high' : 'medium'
    description += score > 40 ? ' and suspicious email pattern' : 'Sender has suspicious email pattern'
  }
  
  // Check for typosquatting (simplified)
  const commonDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'microsoft.com', 'google.com']
  const isTyposquatting = commonDomains.some(legit => {
    const distance = levenshteinDistance(domain, legit)
    return distance > 0 && distance <= 2 && domain !== legit
  })
  
  if (isTyposquatting) {
    score += 60
    severity = 'critical'
    description = 'Potential domain spoofing detected'
  }

  return {
    sender,
    domain,
    isRisky: score > 30,
    score,
    severity,
    description,
    flags: {
      suspiciousDomain: isSuspiciousDomain,
      suspiciousPattern: hasSuspiciousPattern,
      typosquatting: isTyposquatting
    }
  }
}

async function checkLinks(payload: any) {
  const { content } = payload
  
  if (!content) {
    throw new Error('Content is required')
  }

  const linkRisk = await checkSuspiciousLinks(content)
  
  return new Response(
    JSON.stringify(linkRisk),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkSuspiciousLinks(content: string) {
  // Extract URLs from content
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
  const urls = content.match(urlRegex) || []
  
  const suspiciousLinks = []
  let totalScore = 0
  let maxSeverity = 'low'
  
  for (const url of urls) {
    try {
      const urlObj = new URL(url)
      let linkScore = 0
      let severity = 'low'
      const flags = []
      
      // Check for suspicious domains
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.bit']
      if (suspiciousTlds.some(tld => urlObj.hostname.endsWith(tld))) {
        linkScore += 30
        flags.push('suspicious_tld')
      }
      
      // Check for URL shorteners
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly']
      if (shorteners.some(shortener => urlObj.hostname.includes(shortener))) {
        linkScore += 20
        flags.push('url_shortener')
      }
      
      // Check for suspicious patterns
      if (urlObj.hostname.includes('secure') || urlObj.hostname.includes('login')) {
        linkScore += 15
        flags.push('suspicious_keywords')
      }
      
      // Check for IP addresses instead of domains
      if (/^\d+\.\d+\.\d+\.\d+/.test(urlObj.hostname)) {
        linkScore += 40
        flags.push('ip_address')
      }
      
      if (linkScore > 50) {
        severity = 'high'
        maxSeverity = 'high'
      } else if (linkScore > 25) {
        severity = 'medium'
        if (maxSeverity === 'low') maxSeverity = 'medium'
      }
      
      if (linkScore > 20) {
        suspiciousLinks.push({
          url,
          score: linkScore,
          severity,
          flags,
          reason: `Suspicious link with ${flags.join(', ')}`
        })
        totalScore += linkScore
      }
    } catch (error) {
      console.warn('Invalid URL:', url)
    }
  }
  
  return {
    totalLinks: urls.length,
    suspiciousLinks,
    totalScore,
    maxSeverity
  }
}

async function scanAttachments(payload: any) {
  const { attachments } = payload
  
  if (!attachments || !Array.isArray(attachments)) {
    throw new Error('Attachments array is required')
  }

  const results = await scanEmailAttachments(attachments)
  
  return new Response(
    JSON.stringify(results),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function scanEmailAttachments(attachments: string[]) {
  const threats = []
  let totalScore = 0
  
  const dangerousExtensions = [
    '.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.msi', '.dll', '.sys'
  ]
  
  const suspiciousExtensions = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.doc', '.docx', '.xls', '.xlsx',
    '.ppt', '.pptx', '.pdf'
  ]

  for (const attachment of attachments) {
    const ext = '.' + attachment.split('.').pop()?.toLowerCase()
    let score = 0
    let severity = 'low'
    
    if (dangerousExtensions.includes(ext)) {
      score = 80
      severity = 'critical'
      threats.push({
        type: 'malicious_attachment',
        severity,
        description: `Potentially dangerous executable attachment: ${attachment}`,
        filename: attachment,
        extension: ext,
        score
      })
    } else if (suspiciousExtensions.includes(ext)) {
      score = 30
      severity = 'medium'
      
      // Additional checks for suspicious names
      if (attachment.toLowerCase().includes('invoice') || 
          attachment.toLowerCase().includes('receipt') ||
          attachment.toLowerCase().includes('urgent')) {
        score += 20
        severity = 'high'
        threats.push({
          type: 'suspicious_attachment',
          severity,
          description: `Suspicious attachment with common phishing filename: ${attachment}`,
          filename: attachment,
          extension: ext,
          score
        })
      }
    }
    
    totalScore += score
  }
  
  return {
    totalAttachments: attachments.length,
    threats,
    totalScore
  }
}

async function generateThreatReport(payload: any) {
  const { userId, days = 7 } = payload
  
  if (!userId) {
    throw new Error('User ID is required')
  }

  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // This would query the threats table in production
  // For now, generate a demo report
  const report = {
    period: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days
    },
    summary: {
      totalEmails: Math.floor(Math.random() * 1000) + 500,
      threatsDetected: Math.floor(Math.random() * 50) + 10,
      threatsBlocked: Math.floor(Math.random() * 30) + 5,
      phishingAttempts: Math.floor(Math.random() * 20) + 3,
      malwareDetected: Math.floor(Math.random() * 10) + 1,
      spamFiltered: Math.floor(Math.random() * 100) + 50
    },
    threats: [
      {
        type: 'phishing',
        count: Math.floor(Math.random() * 15) + 5,
        severity: 'high',
        trend: 'increasing'
      },
      {
        type: 'malware',
        count: Math.floor(Math.random() * 8) + 2,
        severity: 'critical',
        trend: 'stable'
      },
      {
        type: 'spam',
        count: Math.floor(Math.random() * 50) + 20,
        severity: 'low',
        trend: 'decreasing'
      }
    ],
    topSenders: [
      'suspicious-sender@fake-bank.com',
      'noreply@phishing-site.net',
      'admin@malicious-domain.org'
    ],
    recommendations: [
      'Enable advanced phishing protection',
      'Review and update email filtering rules',
      'Conduct security awareness training for employees',
      'Implement additional attachment scanning'
    ]
  }

  return new Response(
    JSON.stringify(report),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Utility function for string distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}