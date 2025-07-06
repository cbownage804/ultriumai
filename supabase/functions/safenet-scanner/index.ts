import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

interface NetworkAsset {
  id?: string
  ip_address: string
  hostname?: string
  asset_type: string
  os_type?: string
  ports?: number[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()
    
    console.log('SafeNet Scanner - Action:', action, 'Payload:', payload)

    switch (action) {
      case 'scan_network':
        return await scanNetwork(payload)
      
      case 'scan_asset':
        return await scanAsset(payload)
      
      case 'check_vulnerabilities':
        return await checkVulnerabilities(payload)
      
      case 'port_scan':
        return await portScan(payload)
      
      case 'generate_security_report':
        return await generateSecurityReport(payload)
      
      case 'check_compliance':
        return await checkCompliance(payload)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('SafeNet Scanner Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function scanNetwork(payload: any) {
  const { network_range, user_id } = payload
  
  if (!network_range || !user_id) {
    throw new Error('Network range and user ID are required')
  }

  console.log(`Starting network scan for range: ${network_range}`)

  // Simulate network discovery
  const discoveredAssets = await discoverNetworkAssets(network_range)
  
  // Store discovered assets
  const assets = []
  for (const asset of discoveredAssets) {
    const { data, error } = await supabase
      .from('safenet_assets')
      .upsert({
        user_id,
        asset_name: asset.hostname || `Device-${asset.ip_address}`,
        asset_type: asset.asset_type,
        ip_address: asset.ip_address,
        hostname: asset.hostname,
        os_type: asset.os_type,
        status: 'online',
        last_scan_at: new Date().toISOString(),
        vulnerability_count: 0,
        critical_vulns: 0,
        high_vulns: 0,
        medium_vulns: 0,
        low_vulns: 0
      }, {
        onConflict: 'ip_address,user_id'
      })
      .select()
      .single()

    if (!error && data) {
      assets.push(data)
    }
  }

  return new Response(
    JSON.stringify({
      scan_id: crypto.randomUUID(),
      network_range,
      assets_discovered: assets.length,
      assets,
      scan_timestamp: new Date().toISOString(),
      next_steps: [
        'Run vulnerability scans on discovered assets',
        'Verify asset inventory',
        'Check for unauthorized devices'
      ]
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function discoverNetworkAssets(networkRange: string): Promise<NetworkAsset[]> {
  // Simulate network discovery
  const assets: NetworkAsset[] = []
  
  // Generate some realistic demo assets
  const assetTypes = ['server', 'workstation', 'printer', 'router', 'switch', 'firewall']
  const osTypes = ['Windows', 'Linux', 'macOS', 'pfSense', 'VMware ESXi']
  
  const baseIp = networkRange.split('/')[0].split('.').slice(0, 3).join('.')
  
  for (let i = 1; i <= 20; i++) {
    if (Math.random() > 0.3) { // 70% chance device is online
      const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)]
      const osType = osTypes[Math.floor(Math.random() * osTypes.length)]
      
      assets.push({
        ip_address: `${baseIp}.${i}`,
        hostname: `${assetType}-${String(i).padStart(2, '0')}`,
        asset_type: assetType,
        os_type: osType,
        ports: generateOpenPorts(assetType)
      })
    }
  }
  
  return assets
}

function generateOpenPorts(assetType: string): number[] {
  const commonPorts = {
    server: [22, 80, 443, 3389, 5432, 3306],
    workstation: [135, 139, 445, 3389],
    printer: [631, 9100, 80, 443],
    router: [22, 23, 80, 443, 161],
    switch: [22, 23, 80, 443, 161],
    firewall: [22, 80, 443, 4443]
  }
  
  const basePorts = commonPorts[assetType as keyof typeof commonPorts] || [80, 443]
  const openPorts = basePorts.filter(() => Math.random() > 0.2) // Some ports might be closed
  
  return openPorts
}

async function scanAsset(payload: any) {
  const { asset_id, user_id } = payload
  
  if (!asset_id || !user_id) {
    throw new Error('Asset ID and user ID are required')
  }

  // Get asset details
  const { data: asset, error } = await supabase
    .from('safenet_assets')
    .select('*')
    .eq('id', asset_id)
    .eq('user_id', user_id)
    .single()

  if (error || !asset) {
    throw new Error('Asset not found')
  }

  console.log(`Scanning asset: ${asset.hostname} (${asset.ip_address})`)

  // Simulate vulnerability scanning
  const vulnerabilities = await performVulnerabilityScan(asset)
  
  // Store vulnerabilities
  for (const vuln of vulnerabilities) {
    await supabase
      .from('safenet_vulnerabilities')
      .insert({
        user_id,
        asset_id,
        cve_id: vuln.cve_id,
        title: vuln.title,
        description: vuln.description,
        severity: vuln.severity,
        cvss_score: vuln.cvss_score,
        status: 'open',
        detected_at: new Date().toISOString(),
        patch_available: vuln.patch_available,
        patch_complexity: vuln.patch_complexity
      })
  }

  // Update asset vulnerability counts
  const vulnCounts = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length
  }

  await supabase
    .from('safenet_assets')
    .update({
      vulnerability_count: vulnerabilities.length,
      critical_vulns: vulnCounts.critical,
      high_vulns: vulnCounts.high,
      medium_vulns: vulnCounts.medium,
      low_vulns: vulnCounts.low,
      last_scan_at: new Date().toISOString()
    })
    .eq('id', asset_id)

  return new Response(
    JSON.stringify({
      asset_id,
      asset_name: asset.asset_name,
      vulnerabilities_found: vulnerabilities.length,
      vulnerability_breakdown: vulnCounts,
      vulnerabilities,
      scan_timestamp: new Date().toISOString(),
      recommendations: generateSecurityRecommendations(vulnerabilities)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function performVulnerabilityScan(asset: any) {
  const vulnerabilities = []
  
  // Simulate realistic vulnerabilities based on OS and asset type
  const vulnDatabase = [
    {
      cve_id: 'CVE-2023-4911',
      title: 'Buffer Overflow in glibc',
      description: 'Local privilege escalation via buffer overflow',
      severity: 'high',
      cvss_score: 7.8,
      patch_available: true,
      patch_complexity: 'medium',
      affects: ['Linux']
    },
    {
      cve_id: 'CVE-2023-36884',
      title: 'Windows Search Remote Code Execution',
      description: 'Remote code execution in Windows Search service',
      severity: 'critical',
      cvss_score: 9.8,
      patch_available: true,
      patch_complexity: 'low',
      affects: ['Windows']
    },
    {
      cve_id: 'CVE-2023-32409',
      title: 'WebKit Code Execution',
      description: 'Remote code execution via malicious web content',
      severity: 'high',
      cvss_score: 8.8,
      patch_available: true,
      patch_complexity: 'low',
      affects: ['macOS']
    },
    {
      cve_id: 'CVE-2023-20198',
      title: 'Cisco IOS XE Privilege Escalation',
      description: 'Local privilege escalation in Cisco IOS XE',
      severity: 'critical',
      cvss_score: 10.0,
      patch_available: true,
      patch_complexity: 'high',
      affects: ['router', 'switch']
    }
  ]

  // Add some generic vulnerabilities that could affect any system
  const genericVulns = [
    {
      cve_id: 'CVE-2023-0001',
      title: 'Weak SSL Configuration',
      description: 'SSL/TLS configuration allows weak ciphers',
      severity: 'medium',
      cvss_score: 5.3,
      patch_available: true,
      patch_complexity: 'low',
      affects: ['all']
    },
    {
      cve_id: 'CVE-2023-0002',
      title: 'Default Credentials',
      description: 'System using default username/password',
      severity: 'high',
      cvss_score: 9.8,
      patch_available: true,
      patch_complexity: 'low',
      affects: ['all']
    }
  ]

  // Select vulnerabilities based on asset characteristics
  vulnDatabase.forEach(vuln => {
    if (vuln.affects.includes(asset.os_type) || 
        vuln.affects.includes(asset.asset_type) ||
        Math.random() > 0.7) {
      vulnerabilities.push(vuln)
    }
  })

  // Add some generic vulnerabilities
  genericVulns.forEach(vuln => {
    if (Math.random() > 0.5) {
      vulnerabilities.push(vuln)
    }
  })

  return vulnerabilities
}

async function checkVulnerabilities(payload: any) {
  const { user_id, severity_filter } = payload
  
  if (!user_id) {
    throw new Error('User ID is required')
  }

  let query = supabase
    .from('safenet_vulnerabilities')
    .select(`
      *,
      safenet_assets (
        asset_name,
        hostname,
        ip_address,
        asset_type
      )
    `)
    .eq('user_id', user_id)

  if (severity_filter) {
    query = query.eq('severity', severity_filter)
  }

  const { data: vulnerabilities, error } = await query
    .order('cvss_score', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch vulnerabilities: ${error.message}`)
  }

  const summary = {
    total: vulnerabilities?.length || 0,
    critical: vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
    high: vulnerabilities?.filter(v => v.severity === 'high').length || 0,
    medium: vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
    low: vulnerabilities?.filter(v => v.severity === 'low').length || 0,
    open: vulnerabilities?.filter(v => v.status === 'open').length || 0,
    patching_scheduled: vulnerabilities?.filter(v => v.status === 'patching_scheduled').length || 0,
    patched: vulnerabilities?.filter(v => v.status === 'patched').length || 0
  }

  return new Response(
    JSON.stringify({
      summary,
      vulnerabilities: vulnerabilities || [],
      recommendations: generateVulnerabilityRecommendations(summary)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function portScan(payload: any) {
  const { target, user_id } = payload
  
  if (!target || !user_id) {
    throw new Error('Target and user ID are required')
  }

  console.log(`Performing port scan on: ${target}`)

  // Simulate port scanning
  const commonPorts = [
    { port: 21, service: 'FTP', risk: 'medium' },
    { port: 22, service: 'SSH', risk: 'low' },
    { port: 23, service: 'Telnet', risk: 'high' },
    { port: 25, service: 'SMTP', risk: 'medium' },
    { port: 53, service: 'DNS', risk: 'low' },
    { port: 80, service: 'HTTP', risk: 'low' },
    { port: 135, service: 'RPC', risk: 'medium' },
    { port: 139, service: 'NetBIOS', risk: 'medium' },
    { port: 443, service: 'HTTPS', risk: 'low' },
    { port: 445, service: 'SMB', risk: 'high' },
    { port: 993, service: 'IMAPS', risk: 'low' },
    { port: 995, service: 'POP3S', risk: 'low' },
    { port: 3389, service: 'RDP', risk: 'medium' },
    { port: 5432, service: 'PostgreSQL', risk: 'high' },
    { port: 3306, service: 'MySQL', risk: 'high' }
  ]

  const openPorts = commonPorts.filter(() => Math.random() > 0.6) // Simulate some ports being open

  const results = {
    target,
    scan_timestamp: new Date().toISOString(),
    ports_scanned: commonPorts.length,
    open_ports: openPorts.length,
    ports: openPorts.map(port => ({
      ...port,
      status: 'open',
      banner: generateServiceBanner(port.service)
    })),
    security_concerns: openPorts.filter(p => p.risk === 'high').length,
    recommendations: generatePortScanRecommendations(openPorts)
  }

  return new Response(
    JSON.stringify(results),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function generateServiceBanner(service: string): string {
  const banners = {
    'SSH': 'OpenSSH 8.0',
    'HTTP': 'Apache/2.4.41',
    'HTTPS': 'nginx/1.18.0',
    'FTP': 'vsftpd 3.0.3',
    'SMTP': 'Postfix smtpd',
    'MySQL': 'MySQL 8.0.25',
    'PostgreSQL': 'PostgreSQL 13.3',
    'RDP': 'Microsoft Terminal Services',
    'SMB': 'Samba 4.11.6',
    'Telnet': 'Linux telnetd'
  }
  
  return banners[service as keyof typeof banners] || `${service} service`
}

async function generateSecurityReport(payload: any) {
  const { user_id, days = 30 } = payload
  
  if (!user_id) {
    throw new Error('User ID is required')
  }

  // Get asset and vulnerability data
  const { data: assets } = await supabase
    .from('safenet_assets')
    .select('*')
    .eq('user_id', user_id)

  const { data: vulnerabilities } = await supabase
    .from('safenet_vulnerabilities')
    .select('*')
    .eq('user_id', user_id)

  const report = {
    period: `Last ${days} days`,
    generated_at: new Date().toISOString(),
    summary: {
      total_assets: assets?.length || 0,
      online_assets: assets?.filter(a => a.status === 'online').length || 0,
      total_vulnerabilities: vulnerabilities?.length || 0,
      critical_vulnerabilities: vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
      high_vulnerabilities: vulnerabilities?.filter(v => v.severity === 'high').length || 0,
      unpatched_vulnerabilities: vulnerabilities?.filter(v => v.status === 'open').length || 0
    },
    asset_breakdown: {
      servers: assets?.filter(a => a.asset_type === 'server').length || 0,
      workstations: assets?.filter(a => a.asset_type === 'workstation').length || 0,
      network_devices: assets?.filter(a => ['router', 'switch', 'firewall'].includes(a.asset_type)).length || 0,
      other: assets?.filter(a => !['server', 'workstation', 'router', 'switch', 'firewall'].includes(a.asset_type)).length || 0
    },
    top_vulnerabilities: vulnerabilities?.slice(0, 10).map(v => ({
      cve_id: v.cve_id,
      title: v.title,
      severity: v.severity,
      cvss_score: v.cvss_score,
      status: v.status
    })) || [],
    recommendations: [
      'Patch critical vulnerabilities immediately',
      'Update asset inventory regularly',
      'Implement network segmentation',
      'Enable endpoint detection and response',
      'Conduct regular security assessments'
    ],
    compliance_status: {
      pci_dss: Math.random() > 0.5 ? 'compliant' : 'non-compliant',
      hipaa: Math.random() > 0.5 ? 'compliant' : 'non-compliant',
      sox: Math.random() > 0.5 ? 'compliant' : 'non-compliant'
    }
  }

  return new Response(
    JSON.stringify(report),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkCompliance(payload: any) {
  const { user_id, framework } = payload
  
  if (!user_id) {
    throw new Error('User ID is required')
  }

  // Simulate compliance checking
  const complianceChecks = {
    'PCI-DSS': [
      { control: 'Network Segmentation', status: 'compliant', description: 'Payment systems properly segmented' },
      { control: 'Access Controls', status: 'non-compliant', description: 'Some accounts lack proper access controls' },
      { control: 'Vulnerability Management', status: 'compliant', description: 'Regular vulnerability scans performed' },
      { control: 'Logging and Monitoring', status: 'partial', description: 'Logging enabled but monitoring gaps exist' }
    ],
    'HIPAA': [
      { control: 'Access Control', status: 'compliant', description: 'User access properly managed' },
      { control: 'Audit Controls', status: 'compliant', description: 'Audit logging implemented' },
      { control: 'Integrity', status: 'non-compliant', description: 'Data integrity controls need improvement' },
      { control: 'Transmission Security', status: 'compliant', description: 'Data transmission properly encrypted' }
    ],
    'SOX': [
      { control: 'IT General Controls', status: 'compliant', description: 'IT controls properly implemented' },
      { control: 'Change Management', status: 'partial', description: 'Change management process exists but needs improvement' },
      { control: 'Access Management', status: 'compliant', description: 'User access properly controlled' },
      { control: 'Data Backup', status: 'compliant', description: 'Regular backups performed' }
    ]
  }

  const selectedFramework = framework || 'PCI-DSS'
  const checks = complianceChecks[selectedFramework as keyof typeof complianceChecks] || complianceChecks['PCI-DSS']
  
  const compliantCount = checks.filter(c => c.status === 'compliant').length
  const overallScore = Math.round((compliantCount / checks.length) * 100)

  return new Response(
    JSON.stringify({
      framework: selectedFramework,
      overall_score: overallScore,
      status: overallScore >= 80 ? 'compliant' : overallScore >= 60 ? 'partial' : 'non-compliant',
      checks,
      recommendations: checks
        .filter(c => c.status !== 'compliant')
        .map(c => `Address ${c.control}: ${c.description}`),
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function generateSecurityRecommendations(vulnerabilities: any[]): string[] {
  const recommendations = []
  
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length
  
  if (criticalCount > 0) {
    recommendations.push(`Immediately patch ${criticalCount} critical vulnerabilities`)
  }
  
  if (highCount > 0) {
    recommendations.push(`Schedule patching for ${highCount} high-severity vulnerabilities`)
  }
  
  if (vulnerabilities.some(v => v.cve_id.includes('CVE-2023'))) {
    recommendations.push('Focus on recent CVEs from 2023')
  }
  
  recommendations.push('Implement automated vulnerability scanning')
  recommendations.push('Set up vulnerability management process')
  
  return recommendations
}

function generateVulnerabilityRecommendations(summary: any): string[] {
  const recommendations = []
  
  if (summary.critical > 0) {
    recommendations.push(`Address ${summary.critical} critical vulnerabilities immediately`)
  }
  
  if (summary.high > 5) {
    recommendations.push('High number of high-severity vulnerabilities detected')
  }
  
  if (summary.open > summary.patched) {
    recommendations.push('More vulnerabilities are open than patched - prioritize remediation')
  }
  
  recommendations.push('Implement regular vulnerability scanning schedule')
  recommendations.push('Set up automated patch management where possible')
  
  return recommendations
}

function generatePortScanRecommendations(openPorts: any[]): string[] {
  const recommendations = []
  const highRiskPorts = openPorts.filter(p => p.risk === 'high')
  
  if (highRiskPorts.length > 0) {
    recommendations.push(`Close or secure ${highRiskPorts.length} high-risk ports`)
  }
  
  if (openPorts.some(p => p.port === 23)) {
    recommendations.push('Disable Telnet and use SSH instead')
  }
  
  if (openPorts.some(p => p.port === 445)) {
    recommendations.push('Ensure SMB is properly secured and updated')
  }
  
  if (openPorts.some(p => [3306, 5432].includes(p.port))) {
    recommendations.push('Database ports should not be directly accessible from internet')
  }
  
  recommendations.push('Implement network segmentation')
  recommendations.push('Use firewall rules to restrict access')
  
  return recommendations
}