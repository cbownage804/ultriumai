import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`Starting scan for asset: ${asset_id}`);

    // Get asset details
    const { data: asset, error: assetError } = await supabaseClient
      .from('safeweb_assets')
      .select('*')
      .eq('id', asset_id)
      .single();

    if (assetError || !asset) {
      console.error('Asset not found:', assetError);
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
        scan_sources: ['DarkWeb Intelligence API', 'Breach Database Monitor', 'Underground Forums']
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create scan job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Failed to create scan job' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform the actual scanning
    const scanResults = await performDarkWebScan(asset);
    
    // Save threats to database
    const threats = [];
    let threatsCount = 0;

    for (const result of scanResults) {
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
      }
    }

    // Update asset with scan results
    await supabaseClient
      .from('safeweb_assets')
      .update({
        last_scan_at: new Date().toISOString(),
        next_scan_at: getNextScanTime(asset.scan_frequency),
        threats_found: threatsCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id);

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

    console.log(`Scan completed for asset: ${asset_id}, found ${threatsCount} threats`);

    return new Response(
      JSON.stringify({
        success: true,
        scan_job_id: scanJob.id,
        threats_found: threatsCount,
        new_threats: threats,
        asset_updated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scanner error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function performDarkWebScan(asset: Asset): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  console.log(`Scanning ${asset.asset_type}: ${asset.asset_value}`);

  // Simulate different types of dark web scanning based on asset type
  switch (asset.asset_type) {
    case 'email':
      results.push(...await scanEmailCredentials(asset.asset_value));
      results.push(...await scanDataBreaches(asset.asset_value));
      break;
    
    case 'domain':
      results.push(...await scanDomainMentions(asset.asset_value));
      results.push(...await scanBrandImpersonation(asset.asset_value));
      break;
    
    case 'brand':
      results.push(...await scanBrandMentions(asset.asset_value));
      results.push(...await scanCounterfeitProducts(asset.asset_value));
      break;
    
    case 'executive':
      results.push(...await scanExecutiveMentions(asset.asset_value));
      results.push(...await scanPersonalInfoLeaks(asset.asset_value));
      break;
  }

  return results;
}

async function scanEmailCredentials(email: string): Promise<ScanResult[]> {
  // Simulate credential scanning
  const results: ScanResult[] = [];
  
  // Mock some realistic findings
  if (Math.random() > 0.3) {
    results.push({
      threat_type: 'credential',
      title: 'Email Credentials Found in Database Dump',
      description: `Email address ${email} found in recent database leak with associated password hash`,
      severity: Math.random() > 0.5 ? 'critical' : 'high',
      confidence_score: Math.floor(Math.random() * 30) + 70,
      source_name: 'Breach Database Monitor',
      source_url: 'https://darkweb-forum.onion/breach-db',
      raw_data: {
        email: email,
        password_hash: 'sha256:a8f5f167f44f4964e6c998dee827110c',
        breach_date: '2024-01-15',
        database_name: 'corporate_users_2024'
      },
      threat_indicators: {
        has_password: true,
        breach_size: Math.floor(Math.random() * 100000) + 10000,
        credential_type: 'email_password'
      }
    });
  }

  return results;
}

async function scanDataBreaches(email: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.4) {
    results.push({
      threat_type: 'data_breach',
      title: 'Personal Information in Data Breach',
      description: `Email ${email} associated with personal data in recent security incident`,
      severity: 'high',
      confidence_score: Math.floor(Math.random() * 25) + 75,
      source_name: 'DarkWeb Intelligence API',
      raw_data: {
        email: email,
        associated_data: ['phone', 'address', 'employment'],
        breach_source: 'third_party_vendor'
      },
      threat_indicators: {
        data_types: ['pii', 'contact_info'],
        exposure_level: 'high'
      }
    });
  }

  return results;
}

async function scanDomainMentions(domain: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.5) {
    results.push({
      threat_type: 'threat_actor',
      title: 'Domain Targeted by Threat Actors',
      description: `Domain ${domain} mentioned in threat actor discussions about potential targets`,
      severity: 'medium',
      confidence_score: Math.floor(Math.random() * 20) + 60,
      source_name: 'Underground Forums',
      raw_data: {
        domain: domain,
        discussion_topic: 'corporate_targets_q1_2024',
        threat_group: 'unknown'
      },
      threat_indicators: {
        targeting_stage: 'reconnaissance',
        threat_level: 'moderate'
      }
    });
  }

  return results;
}

async function scanBrandImpersonation(domain: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.6) {
    results.push({
      threat_type: 'brand_mention',
      title: 'Brand Impersonation Detected',
      description: `Fake website impersonating ${domain} used in phishing campaign`,
      severity: 'high',
      confidence_score: Math.floor(Math.random() * 15) + 85,
      source_name: 'Cybercrime Marketplaces',
      raw_data: {
        original_domain: domain,
        fake_domain: domain.replace('.com', '-secure.com'),
        campaign_type: 'phishing'
      },
      threat_indicators: {
        impersonation_type: 'domain_spoofing',
        active_campaign: true
      }
    });
  }

  return results;
}

async function scanBrandMentions(brand: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.4) {
    results.push({
      threat_type: 'brand_mention',
      title: 'Brand Mentioned in Criminal Forums',
      description: `Brand "${brand}" discussed in context of fraud or counterfeiting`,
      severity: 'medium',
      confidence_score: Math.floor(Math.random() * 30) + 50,
      source_name: 'Underground Forums',
      raw_data: {
        brand_name: brand,
        context: 'counterfeit_discussion',
        forum_reputation: 'high'
      },
      threat_indicators: {
        mention_context: 'criminal',
        brand_abuse_type: 'counterfeiting'
      }
    });
  }

  return results;
}

async function scanCounterfeitProducts(brand: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.7) {
    results.push({
      threat_type: 'marketplace',
      title: 'Counterfeit Products Being Sold',
      description: `Counterfeit ${brand} products listed on dark web marketplace`,
      severity: 'medium',
      confidence_score: Math.floor(Math.random() * 25) + 60,
      source_name: 'Cybercrime Marketplaces',
      raw_data: {
        brand_name: brand,
        product_count: Math.floor(Math.random() * 50) + 10,
        marketplace: 'darkmarket_alpha'
      },
      threat_indicators: {
        product_type: 'counterfeit',
        scale: 'medium'
      }
    });
  }

  return results;
}

async function scanExecutiveMentions(executive: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.8) {
    results.push({
      threat_type: 'executive_mention',
      title: 'Executive Mentioned in Threat Context',
      description: `Executive "${executive}" mentioned in context of social engineering or targeting`,
      severity: 'high',
      confidence_score: Math.floor(Math.random() * 20) + 70,
      source_name: 'Underground Forums',
      raw_data: {
        executive_name: executive,
        context: 'social_engineering_target',
        threat_type: 'spear_phishing'
      },
      threat_indicators: {
        targeting_type: 'executive',
        attack_vector: 'social_engineering'
      }
    });
  }

  return results;
}

async function scanPersonalInfoLeaks(executive: string): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  
  if (Math.random() > 0.9) {
    results.push({
      threat_type: 'data_breach',
      title: 'Executive Personal Information Leaked',
      description: `Personal information for "${executive}" found in data breach`,
      severity: 'critical',
      confidence_score: Math.floor(Math.random() * 10) + 90,
      source_name: 'Breach Database Monitor',
      raw_data: {
        executive_name: executive,
        leaked_data: ['email', 'phone', 'linkedin'],
        breach_date: '2024-01-20'
      },
      threat_indicators: {
        data_sensitivity: 'high',
        exposure_risk: 'critical'
      }
    });
  }

  return results;
}

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