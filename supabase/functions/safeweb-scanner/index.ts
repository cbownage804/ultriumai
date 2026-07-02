import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFEWEB-SCANNER] ${step}${detailsStr}`);
};

interface ScanResult {
  threat_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  source_name: string;
  source_url?: string;
  raw_data: any;
  threat_indicators: any;
}

interface Asset {
  id: string;
  asset_type: string;
  asset_value: string;
  user_id: string;
  msp_client_id?: string;
}

// Helper to safely extract values from Dehashed entries (handles arrays)
function pickDehashedValue(entry: any, key: string): string | null {
  const v = entry?.[key];
  if (Array.isArray(v)) return v[0] ?? null;
  if (v == null) return null;
  return typeof v === 'string' ? v : String(v);
}

// Real threat intelligence scanning functions
async function scanWithVirusTotal(domain: string, apiKey: string): Promise<ScanResult[]> {
  try {
    logStep('Scanning with VirusTotal', { domain });
    const response = await fetch(`https://www.virustotal.com/vtapi/v2/domain/report?apikey=${apiKey}&domain=${domain}`);
    const data = await response.json();
    
    const threats: ScanResult[] = [];
    
    if (data.detected_urls && data.detected_urls.length > 0) {
      threats.push({
        threat_type: 'malicious_urls',
        title: `Malicious URLs detected for ${domain}`,
        description: `${data.detected_urls.length} malicious URLs associated with this domain found by VirusTotal`,
        severity: data.detected_urls.length > 10 ? 'critical' : 'high',
        confidence_score: 95,
        source_name: 'VirusTotal',
        source_url: `https://www.virustotal.com/gui/domain/${domain}`,
        raw_data: { detected_urls: data.detected_urls.slice(0, 5) },
        threat_indicators: { 
          malicious_url_count: data.detected_urls.length,
          last_analysis_date: data.last_analysis_date
        }
      });
    }
    
    if (data.detected_downloaded_samples && data.detected_downloaded_samples.length > 0) {
      threats.push({
        threat_type: 'malware_samples',
        title: `Malware samples linked to ${domain}`,
        description: `${data.detected_downloaded_samples.length} malware samples associated with this domain`,
        severity: 'critical',
        confidence_score: 90,
        source_name: 'VirusTotal',
        source_url: `https://www.virustotal.com/gui/domain/${domain}`,
        raw_data: { samples: data.detected_downloaded_samples.slice(0, 3) },
        threat_indicators: { 
          malware_sample_count: data.detected_downloaded_samples.length,
          analysis_date: data.last_analysis_date
        }
      });
    }
    
    if (data.whois && data.whois_timestamp) {
      const whoisAge = Date.now() - (data.whois_timestamp * 1000);
      const daysSinceRegistration = whoisAge / (1000 * 60 * 60 * 24);
      
      if (daysSinceRegistration < 30) {
        threats.push({
          threat_type: 'suspicious_domain',
          title: `Recently registered domain: ${domain}`,
          description: `Domain was registered only ${Math.floor(daysSinceRegistration)} days ago, which may indicate suspicious activity`,
          severity: 'medium',
          confidence_score: 70,
          source_name: 'VirusTotal WHOIS',
          raw_data: { whois: data.whois, registration_age_days: Math.floor(daysSinceRegistration) },
          threat_indicators: { 
            recently_registered: true,
            age_days: Math.floor(daysSinceRegistration)
          }
        });
      }
    }
    
    logStep('VirusTotal scan completed', { threats_found: threats.length });
    return threats;
  } catch (error) {
    logStep('VirusTotal scan error', error.message);
    return [];
  }
}

async function scanWithHaveIBeenPwned(email: string, apiKey: string): Promise<ScanResult[]> {
  try {
    logStep('Scanning with Have I Been Pwned', { email });
    
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      headers: {
        'User-Agent': 'Watch-Scanner-v1.0',
        'hibp-api-key': apiKey
      }
    });
    
    logStep('HIBP response status', { status: response.status });
    
    if (response.status === 404) {
      logStep('No breaches found in HIBP');
      return []; // No breaches found
    }
    
    if (response.status === 401) {
      logStep('HIBP API key invalid or unauthorized');
      return [];
    }
    
    if (response.status === 200) {
      const breaches = await response.json();
      logStep('HIBP breaches found', { count: breaches.length });
      
      const threats = breaches.map((breach: any) => ({
        threat_type: 'data_breach',
        title: `Email found in ${breach.Name} breach`,
        description: `Email address compromised in ${breach.Name} data breach on ${breach.BreachDate}. ${breach.Description || ''}`.trim(),
        severity: breach.IsSensitive ? 'critical' : (breach.IsVerified ? 'high' : 'medium'),
        confidence_score: breach.IsVerified ? 100 : 85,
        source_name: 'Have I Been Pwned',
        source_url: `https://haveibeenpwned.com/account/${encodeURIComponent(email)}`,
        raw_data: breach,
        threat_indicators: { 
          breach_date: breach.BreachDate,
          compromised_accounts: breach.PwnCount,
          data_classes: breach.DataClasses,
          is_sensitive: breach.IsSensitive,
          is_verified: breach.IsVerified
        }
      }));
      
      logStep('HIBP scan completed', { breaches_found: threats.length });
      return threats;
    }
    
    if (response.status === 429) {
      logStep('HIBP rate limit hit');
      return [];
    }
    
    logStep('HIBP unexpected status', { status: response.status });
    return [];
  } catch (error) {
    logStep('HaveIBeenPwned scan error', error.message);
    return [];
  }
}

async function scanWithIntelligenceX(email: string, apiKey: string): Promise<ScanResult[]> {
  try {
    logStep('Scanning with Intelligence X', { email });
    
    // Step 1: Submit search query
    const searchResponse = await fetch('https://2.intelx.io/phonebook/search', {
      method: 'POST',
      headers: {
        'x-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        term: email,
        buckets: ['databreach', 'leaks', 'pastes'],
        lookuplevel: 0,
        maxresults: 100,
        timeout: 30,
        datefrom: '',
        dateto: '',
        sort: 4,
        media: 0,
        terminate: []
      })
    });

    if (!searchResponse.ok) {
      logStep('Intelligence X search failed', { status: searchResponse.status });
      return [];
    }

    const searchData = await searchResponse.json();
    const searchId = searchData.id;

    if (!searchId) {
      logStep('No search ID returned from Intelligence X');
      return [];
    }

    // Step 2: Wait and retrieve results
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const resultsResponse = await fetch(`https://2.intelx.io/phonebook/search/result?id=${searchId}`, {
      headers: {
        'x-key': apiKey
      }
    });

    if (!resultsResponse.ok) {
      logStep('Intelligence X results failed', { status: resultsResponse.status });
      return [];
    }

    const resultsData = await resultsResponse.json();
    const records = resultsData.records || [];

    const threats: ScanResult[] = records.map((record: any) => {
      const bucketName = record.bucket || 'Unknown';
      const source = record.name || bucketName;
      const date = record.date || 'Unknown';
      
      // Determine severity based on bucket type and data
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (bucketName.toLowerCase().includes('breach') || bucketName.toLowerCase().includes('leak')) {
        severity = 'high';
      }
      if (record.systemid === 'databreach' || bucketName.toLowerCase().includes('password')) {
        severity = 'critical';
      }

      return {
        threat_type: bucketName === 'databreach' ? 'data_breach' : 'credential',
        title: `Email found in ${source} data exposure`,
        description: `Email address discovered in ${source} data exposure from ${date}. This indicates potential credential compromise.`,
        severity,
        confidence_score: 95,
        source_name: 'Intelligence X',
        source_url: `https://intelx.io/`,
        raw_data: record,
        threat_indicators: {
          exposure_date: date,
          source_type: bucketName,
          systemid: record.systemid,
          bucket: record.bucket,
          media_type: record.media
        }
      };
    });

    logStep('Intelligence X scan completed', { threats_found: threats.length });
    return threats;

  } catch (error) {
    logStep('Intelligence X scan error', error.message);
    return [];
  }
}

async function scanWithDehashed(email: string, apiKey: string): Promise<ScanResult[]> {
  try {
    logStep('Scanning with Dehashed v2 API', { email });
    
    // Use Dehashed v2 API with POST request
    const response = await fetch('https://api.dehashed.com/v2/search', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Dehashed-Api-Key': apiKey,
      },
      body: JSON.stringify({
        query: `email:"${email}"`,
        size: 100,
        page: 1,
        de_dupe: true,
        wildcard: false,
        regex: false,
      }),
    });

    logStep('Dehashed v2 response status', { status: response.status });

    if (!response.ok) {
      const errorText = await response.text();
      logStep('Dehashed v2 API error', { status: response.status, error: errorText.substring(0, 200) });
      return [];
    }

    const data = await response.json();
    const entries = data.entries || [];
    
    logStep('Dehashed v2 results', { total: data.total || 0, entries_returned: entries.length, balance: data.balance });

    if (entries.length === 0) {
      logStep('No breaches found in Dehashed');
      return [];
    }

    // Group entries by database/breach source
    const breachGroups = entries.reduce((groups: any, entry: any) => {
      const database = pickDehashedValue(entry, 'database_name') || 'Unknown Database';
      if (!groups[database]) {
        groups[database] = [];
      }
      groups[database].push(entry);
      return groups;
    }, {});

    const threats: ScanResult[] = Object.entries(breachGroups).map(([database, entries]: [string, any]) => {
      const entryList = entries as any[];
      const firstEntry = entryList[0];
      
      // Determine severity based on data available
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      const hasPassword = entryList.some(e => pickDehashedValue(e, 'password'));
      const hasHashedPassword = entryList.some(e => pickDehashedValue(e, 'hashed_password'));
      const hasSensitiveData = entryList.some(e => pickDehashedValue(e, 'phone') || pickDehashedValue(e, 'address') || pickDehashedValue(e, 'ip_address'));
      
      if (hasPassword) {
        severity = 'critical';
      } else if (hasHashedPassword) {
        severity = 'high';
      } else if (hasSensitiveData) {
        severity = 'high';
      }

      // Extract available data fields
      const dataFields = new Set<string>();
      entryList.forEach(entry => {
        Object.keys(entry).forEach(key => {
          const val = pickDehashedValue(entry, key);
          if (val && key !== 'id' && key !== 'email' && key !== 'database_name') {
            dataFields.add(key);
          }
        });
      });

      return {
        threat_type: 'data_breach',
        title: `Email compromised in ${database} breach`,
        description: `Email found in ${database} data breach with ${entryList.length} record(s). Exposed data includes: ${Array.from(dataFields).join(', ')}. ${hasPassword ? 'CRITICAL: Plain text passwords exposed!' : hasHashedPassword ? 'Hashed passwords exposed.' : ''}`,
        severity,
        confidence_score: 98,
        source_name: 'Dehashed',
        source_url: `https://dehashed.com/`,
        raw_data: {
          database,
          total_records: entryList.length,
          sample_record: firstEntry,
          exposed_fields: Array.from(dataFields)
        },
        threat_indicators: {
          database_name: database,
          records_count: entryList.length,
          has_password: hasPassword,
          has_hashed_password: hasHashedPassword,
          exposed_data_types: Array.from(dataFields),
          breach_scope: entryList.length > 1 ? 'multiple_records' : 'single_record'
        }
      };
    });

    logStep('Dehashed scan completed', { threats_found: threats.length, total_records: entries.length });
    return threats;

  } catch (error) {
    logStep('Dehashed scan error', error.message);
    return [];
  }
}

// Generic Dehashed lookup for non-email identifiers (phone, domain, username, ip).
async function scanDehashedByField(
  field: 'phone' | 'domain' | 'username' | 'ip_address',
  value: string,
  apiKey: string,
): Promise<ScanResult[]> {
  try {
    logStep(`Scanning Dehashed by ${field}`, { value });
    const response = await fetch('https://api.dehashed.com/v2/search', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Dehashed-Api-Key': apiKey,
      },
      body: JSON.stringify({
        query: `${field}:"${value}"`,
        size: 100,
        page: 1,
        de_dupe: true,
        wildcard: false,
        regex: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep(`Dehashed ${field} error`, { status: response.status, error: errorText.substring(0, 200) });
      return [];
    }

    const data = await response.json();
    const entries = data.entries || [];
    if (entries.length === 0) return [];

    const groups = entries.reduce((acc: any, entry: any) => {
      const db = pickDehashedValue(entry, 'database_name') || 'Unknown Database';
      (acc[db] ||= []).push(entry);
      return acc;
    }, {});

    return Object.entries(groups).map(([database, list]: [string, any]) => {
      const items = list as any[];
      const hasPassword = items.some((e) => pickDehashedValue(e, 'password'));
      const hasHashedPassword = items.some((e) => pickDehashedValue(e, 'hashed_password'));
      const fields = new Set<string>();
      items.forEach((entry) => {
        Object.keys(entry).forEach((key) => {
          const v = pickDehashedValue(entry, key);
          if (v && key !== 'id' && key !== 'database_name') fields.add(key);
        });
      });
      const severity: 'critical' | 'high' | 'medium' =
        hasPassword ? 'critical' : hasHashedPassword ? 'high' : 'medium';
      return {
        threat_type: 'data_breach',
        title: `${field === 'phone' ? 'Phone number' : field} exposed in ${database}`,
        description: `${value} appears in ${database} with ${items.length} record(s). Exposed data: ${Array.from(fields).join(', ')}.${hasPassword ? ' CRITICAL: plaintext passwords exposed.' : ''}`,
        severity,
        confidence_score: 96,
        source_name: 'Dehashed',
        source_url: 'https://dehashed.com/',
        raw_data: { database, total_records: items.length, sample_record: items[0], exposed_fields: Array.from(fields) },
        threat_indicators: {
          database_name: database,
          records_count: items.length,
          has_password: hasPassword,
          has_hashed_password: hasHashedPassword,
          exposed_data_types: Array.from(fields),
          lookup_field: field,
        },
      };
    });
  } catch (error) {
    logStep(`Dehashed ${field} scan error`, (error as Error).message);
    return [];
  }
}

async function scanDomainReputation(domain: string): Promise<ScanResult[]> {
  try {
    logStep('Scanning domain reputation', { domain });
    // Free URLVoid alternative using Google Safe Browsing (requires API key)
    // For now, we'll use a basic domain age check and suspicious patterns
    
    const threats: ScanResult[] = [];
    
    // Check for suspicious domain patterns
    const suspiciousPatterns = [
      /secure.*\.com$/,
      /.*-login\.com$/,
      /.*-verification\.com$/,
      /.*-update\.com$/,
      /.*bank.*\.com$/,
      /.*paypal.*\.com$/
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain));
    
    if (isSuspicious && !isKnownLegitimate(domain)) {
      threats.push({
        threat_type: 'suspicious_domain',
        title: `Suspicious domain pattern detected`,
        description: `Domain ${domain} matches patterns commonly used in phishing attacks`,
        severity: 'medium',
        confidence_score: 60,
        source_name: 'Pattern Analysis',
        raw_data: { domain, pattern_match: true },
        threat_indicators: { 
          suspicious_pattern: true,
          pattern_type: 'phishing_like'
        }
      });
    }
    
    logStep('Domain reputation scan completed', { threats_found: threats.length });
    return threats;
  } catch (error) {
    logStep('Domain reputation scan error', error.message);
    return [];
  }
}

function isKnownLegitimate(domain: string): boolean {
  const legitimateDomains = [
    'paypal-secure.com', // Example legitimate variations
    'bank-secure.com'
  ];
  return legitimateDomains.includes(domain);
}

async function performRealScan(asset: Asset): Promise<ScanResult[]> {
  const threats: ScanResult[] = [];
  const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY');
  
  logStep('Starting real scan', { asset_type: asset.asset_type, asset_value: asset.asset_value });
  
  try {
    switch (asset.asset_type) {
      case 'domain':
        if (virusTotalKey) {
          const vtThreats = await scanWithVirusTotal(asset.asset_value, virusTotalKey);
          threats.push(...vtThreats);
        } else {
          logStep('VirusTotal API key not configured');
        }
        
        const reputationThreats = await scanDomainReputation(asset.asset_value);
        threats.push(...reputationThreats);
        break;
        
      case 'email':
        // Use Dehashed as PRIMARY source (most reliable)
        const dehashedKey = Deno.env.get('DEHASHED_API_KEY');
        if (dehashedKey) {
          logStep('Using Dehashed API (primary source)');
          const dehashedThreats = await scanWithDehashed(asset.asset_value, dehashedKey);
          threats.push(...dehashedThreats);
        } else {
          logStep('Dehashed API key not configured');
        }
        
        // Add HaveIBeenPwned as secondary source
        const hibpKey = Deno.env.get('HAVEIBEENPWNED_API_KEY');
        if (hibpKey) {
          const hibpThreats = await scanWithHaveIBeenPwned(asset.asset_value, hibpKey);
          threats.push(...hibpThreats);
        } else {
          logStep('HaveIBeenPwned API key not configured');
        }
        
        // Add Intelligence X scanning if API key is available
        const intelXKey = Deno.env.get('INTELX_API_KEY');
        if (intelXKey) {
          const intelXThreats = await scanWithIntelligenceX(asset.asset_value, intelXKey);
          threats.push(...intelXThreats);
        } else {
          logStep('Intelligence X API key not configured');
        }
        break;
        
      case 'phone': {
        const dehashedKey = Deno.env.get('DEHASHED_API_KEY');
        if (dehashedKey) {
          // Normalize: strip everything except digits and leading +
          const normalized = asset.asset_value.replace(/[^\d+]/g, '');
          const phoneThreats = await scanDehashedByField('phone', normalized, dehashedKey);
          threats.push(...phoneThreats);
        } else {
          logStep('Dehashed API key not configured for phone lookup');
        }
        break;
      }

      case 'brand':
        logStep('Brand monitoring requires specialized brand monitoring APIs - contact sales for enterprise integration');
        break;
        
      case 'executive':
        logStep('Executive monitoring requires specialized dark web access - contact sales for enterprise integration');
        // In production, integrate with:
        // - Recorded Future API
        // - DarkOwl API
        // - Sixgill Darkfeed API
        break;
        
      case 'ip_range':
        logStep('IP range scanning requires Shodan or similar - implement with real IP intelligence APIs');
        // In production, integrate with:
        // - Shodan API
        // - Censys API
        // - ZoomEye API
        break;
    }
    
    logStep('Real scan completed', { threats_found: threats.length });
    return threats;
    
  } catch (error) {
    logStep('Scan error', error.message);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { asset_id, scan_type = 'manual' } = await req.json();
    
    if (!asset_id) {
      return new Response(
        JSON.stringify({ error: 'Asset ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Starting scan', { asset_id, scan_type });

    // Get asset details
    const { data: asset, error: assetError } = await supabaseClient
      .from('safeweb_assets')
      .select('*')
      .eq('id', asset_id)
      .single();

    if (assetError || !asset) {
      logStep('Asset not found', assetError);
      return new Response(
        JSON.stringify({ error: 'Asset not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create scan job
    const { data: scanJob, error: jobError } = await supabaseClient
      .from('safeweb_scan_jobs')
      .insert({
        user_id: asset.user_id,
        asset_id: asset.id,
        job_type: scan_type,
        status: 'running',
        started_at: new Date().toISOString(),
        scan_sources: ['VirusTotal', 'Have I Been Pwned', 'Intelligence X', 'Dehashed', 'Domain Analysis']
      })
      .select()
      .single();

    if (jobError) {
      logStep('Failed to create scan job', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create scan job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform the actual scanning with real APIs
    const scanResults = await performRealScan(asset);
    
    // Save threats to database - with deduplication
    const threats = [];
    let threatsCount = 0;
    let skippedDuplicates = 0;

    for (const result of scanResults) {
      // Check if this threat already exists for this asset (deduplicate by title + source)
      const { data: existingThreat } = await supabaseClient
        .from('safeweb_threats')
        .select('id')
        .eq('asset_id', asset.id)
        .eq('title', result.title)
        .eq('source_name', result.source_name)
        .maybeSingle();

      if (existingThreat) {
        logStep('Skipping duplicate threat', { title: result.title, source: result.source_name });
        skippedDuplicates++;
        threatsCount++; // Still count it for the asset's threat count
        continue;
      }

      const { data: threat, error: threatError } = await supabaseClient
        .from('safeweb_threats')
        .insert({
          user_id: asset.user_id,
          msp_client_id: asset.msp_client_id,
          asset_id: asset.id,
          threat_type: result.threat_type,
          title: result.title,
          description: result.description,
          severity: result.severity,
          confidence_score: result.confidence_score,
          source_name: result.source_name,
          source_url: result.source_url,
          raw_data: result.raw_data,
          affected_assets: [asset.asset_value],
          threat_indicators: result.threat_indicators,
          tags: [result.threat_type, result.severity]
        })
        .select()
        .single();

      if (!threatError && threat) {
        threats.push(threat);
        threatsCount++;
      } else if (threatError) {
        logStep('Error saving threat', threatError);
      }
    }
    
    logStep('Threat processing complete', { new: threats.length, duplicates_skipped: skippedDuplicates, total: threatsCount });

    // Get actual threat count from database (not just this scan)
    const { count: actualThreatCount } = await supabaseClient
      .from('safeweb_threats')
      .select('*', { count: 'exact', head: true })
      .eq('asset_id', asset.id)
      .neq('status', 'resolved');
    
    const finalThreatCount = actualThreatCount || 0;
    
    // Update asset with scan results (status column is for asset lifecycle, not scan results)
    logStep('Updating asset', { asset_id: asset.id, finalThreatCount });
    
    const { error: updateError, data: updateData } = await supabaseClient
      .from('safeweb_assets')
      .update({
        last_scan_at: new Date().toISOString(),
        next_scan_at: getNextScanTime(asset.scan_frequency),
        threats_found: finalThreatCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id)
      .select();
    
    if (updateError) {
      logStep('ERROR: Failed to update asset', { error: updateError.message, code: updateError.code });
    } else {
      logStep('Asset updated successfully', { updated: updateData });
    }

    // Complete the scan job
    await supabaseClient
      .from('safeweb_scan_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        threats_found: threatsCount,
        scan_results: { threats: scanResults.length, new_threats: threatsCount }
      })
      .eq('id', scanJob.id);

    logStep('Scan completed', { asset_id, threats_found: threatsCount });

    return new Response(
      JSON.stringify({
        success: true,
        scan_job_id: scanJob.id,
        threats_found: threatsCount,
        new_threats: threats,
        asset_updated: true,
        message: threatsCount > 0 ? `Found ${threatsCount} real threats` : 'No threats detected - your asset appears clean'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Scanner error', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getNextScanTime(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
}