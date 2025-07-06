import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, framework, controlId, evidenceType, data, title, description } = await req.json();

    if (action === 'collect_evidence') {
      console.log(`Collecting evidence for ${framework} control ${controlId}`);
      
      // Process different types of evidence
      let evidenceData;
      let filePath = null;
      let fileUrl = null;

      switch (evidenceType) {
        case 'screenshot':
          evidenceData = await processScreenshotEvidence(data);
          filePath = await saveEvidenceFile(supabaseClient, user.id, evidenceData, 'screenshot.png');
          break;
        
        case 'configuration':
          evidenceData = await processConfigurationEvidence(data);
          filePath = await saveEvidenceFile(supabaseClient, user.id, evidenceData, 'config.json');
          break;
        
        case 'log':
          evidenceData = await processLogEvidence(data);
          filePath = await saveEvidenceFile(supabaseClient, user.id, evidenceData, 'audit.log');
          break;
        
        case 'document':
          evidenceData = data;
          filePath = await saveEvidenceFile(supabaseClient, user.id, evidenceData, 'document.pdf');
          break;
        
        default:
          evidenceData = data;
      }

      // Store evidence record
      const { data: evidence, error: evidenceError } = await supabaseClient
        .from('compliance_evidence')
        .insert({
          user_id: user.id,
          framework: framework.toLowerCase(),
          control_id: controlId,
          evidence_type: evidenceType,
          title: title || `${framework} ${controlId} Evidence`,
          description: description || `Automatically collected evidence for ${framework} control ${controlId}`,
          file_path: filePath,
          file_url: fileUrl,
          metadata: {
            collectionMethod: 'automatic',
            sourceSystem: data.sourceSystem || 'unknown',
            timestamp: new Date().toISOString(),
            evidenceHash: await generateEvidenceHash(evidenceData)
          },
          collected_by: 'automatic'
        })
        .select()
        .single();

      if (evidenceError) {
        console.error('Error storing evidence:', evidenceError);
        return new Response(
          JSON.stringify({ error: 'Failed to store evidence', details: evidenceError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Evidence collected successfully: ${evidence.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          evidenceId: evidence.id,
          message: 'Evidence collected successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'auto_collect_framework_evidence') {
      console.log(`Auto-collecting evidence for framework: ${framework}`);
      
      const evidenceCollected = [];
      const frameworkControls = getFrameworkControls(framework);
      
      for (const control of frameworkControls) {
        try {
          // Automatically collect evidence based on available compliance data
          const { data: complianceData } = await supabaseClient
            .from('compliance_data')
            .select('*')
            .eq('user_id', user.id)
            .contains('framework_mappings', { [framework.toLowerCase()]: [control.id] })
            .limit(5);

          if (complianceData && complianceData.length > 0) {
            for (const dataPoint of complianceData) {
              const evidence = await createEvidenceFromComplianceData(supabaseClient, user.id, framework, control.id, dataPoint);
              if (evidence) {
                evidenceCollected.push(evidence);
              }
            }
          }
        } catch (error) {
          console.error(`Error collecting evidence for control ${control.id}:`, error);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          evidenceCollected: evidenceCollected.length,
          evidence: evidenceCollected,
          message: `Auto-collected ${evidenceCollected.length} pieces of evidence for ${framework}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_evidence_package') {
      console.log(`Generating evidence package for framework: ${framework}`);
      
      // Get all evidence for the framework
      const { data: evidence, error: evidenceError } = await supabaseClient
        .from('compliance_evidence')
        .select('*')
        .eq('user_id', user.id)
        .eq('framework', framework.toLowerCase())
        .order('created_at', { ascending: false });

      if (evidenceError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch evidence', details: evidenceError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate evidence package
      const evidencePackage = await generateEvidencePackage(framework, evidence || []);
      const packageFilePath = await saveEvidenceFile(
        supabaseClient, 
        user.id, 
        evidencePackage, 
        `${framework.toLowerCase()}_evidence_package_${Date.now()}.json`
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          packagePath: packageFilePath,
          evidenceCount: evidence?.length || 0,
          message: 'Evidence package generated successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Evidence collector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processScreenshotEvidence(data: any) {
  // Process base64 screenshot data
  return {
    type: 'screenshot',
    timestamp: new Date().toISOString(),
    metadata: data.metadata || {},
    imageData: data.imageData // Base64 encoded image
  };
}

async function processConfigurationEvidence(data: any) {
  // Process configuration data
  return {
    type: 'configuration',
    timestamp: new Date().toISOString(),
    source: data.source || 'unknown',
    configuration: data.configuration || data,
    metadata: data.metadata || {}
  };
}

async function processLogEvidence(data: any) {
  // Process log data
  return {
    type: 'log',
    timestamp: new Date().toISOString(),
    source: data.source || 'unknown',
    logEntries: data.logEntries || [data],
    metadata: data.metadata || {}
  };
}

async function saveEvidenceFile(supabaseClient: any, userId: string, evidenceData: any, fileName: string): Promise<string> {
  try {
    const filePath = `evidence/${userId}/${Date.now()}_${fileName}`;
    const fileContent = typeof evidenceData === 'string' ? evidenceData : JSON.stringify(evidenceData, null, 2);
    
    // Convert string to Uint8Array for file upload
    const encoder = new TextEncoder();
    const fileBuffer = encoder.encode(fileContent);

    const { data, error } = await supabaseClient.storage
      .from('compliance-evidence')
      .upload(filePath, fileBuffer, {
        contentType: fileName.endsWith('.json') ? 'application/json' : 
                    fileName.endsWith('.png') ? 'image/png' : 
                    fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain'
      });

    if (error) {
      console.error('Error uploading evidence file:', error);
      return '';
    }

    return data.path;
  } catch (error) {
    console.error('Error saving evidence file:', error);
    return '';
  }
}

async function generateEvidenceHash(evidenceData: any): Promise<string> {
  const dataString = JSON.stringify(evidenceData);
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getFrameworkControls(framework: string) {
  const frameworks: Record<string, any[]> = {
    'soc2': [
      { id: 'CC1.1', name: 'Control Environment' },
      { id: 'CC6.1', name: 'Logical and Physical Access Controls' },
      { id: 'CC6.2', name: 'Access Control Management' },
      { id: 'CC6.3', name: 'Access Revocation' },
      { id: 'CC7.1', name: 'System Operations' },
      { id: 'CC7.2', name: 'Monitoring Activities' }
    ],
    'hipaa': [
      { id: '164.308(a)(1)(i)', name: 'Assigned Security Responsibility' },
      { id: '164.308(a)(3)(i)', name: 'Authorized Access Procedures' },
      { id: '164.308(a)(5)(ii)(D)', name: 'Password Management' },
      { id: '164.312(a)(2)(i)', name: 'Access Control' },
      { id: '164.312(e)(1)', name: 'Transmission Security' }
    ],
    'pci_dss': [
      { id: '8.1', name: 'User Identification' },
      { id: '8.2', name: 'User Authentication' },
      { id: '8.3', name: 'Multi-Factor Authentication' },
      { id: '10.1', name: 'Audit Trail' },
      { id: '10.2', name: 'Automated Audit Trails' }
    ],
    'gdpr': [
      { id: 'Art 25', name: 'Data Protection by Design' },
      { id: 'Art 32', name: 'Security of Processing' },
      { id: 'Art 33', name: 'Breach Notification' },
      { id: 'Art 35', name: 'Data Protection Impact Assessment' }
    ]
  };

  return frameworks[framework.toLowerCase()] || [];
}

async function createEvidenceFromComplianceData(supabaseClient: any, userId: string, framework: string, controlId: string, dataPoint: any) {
  try {
    const { data: evidence, error } = await supabaseClient
      .from('compliance_evidence')
      .insert({
        user_id: userId,
        framework: framework.toLowerCase(),
        control_id: controlId,
        evidence_type: 'configuration',
        title: `${framework} ${controlId} - ${dataPoint.data_source}`,
        description: `Compliance evidence from ${dataPoint.data_type}`,
        metadata: {
          sourceDataId: dataPoint.id,
          complianceStatus: dataPoint.compliance_status,
          riskLevel: dataPoint.risk_level,
          dataType: dataPoint.data_type,
          autoCollected: true,
          collectionTimestamp: new Date().toISOString()
        },
        collected_by: 'automatic'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating evidence from compliance data:', error);
      return null;
    }

    return evidence;
  } catch (error) {
    console.error('Error in createEvidenceFromComplianceData:', error);
    return null;
  }
}

async function generateEvidencePackage(framework: string, evidence: any[]) {
  const packageData = {
    framework: framework,
    generatedAt: new Date().toISOString(),
    evidenceCount: evidence.length,
    summary: {
      totalEvidence: evidence.length,
      evidenceTypes: [...new Set(evidence.map(e => e.evidence_type))],
      controlsCovered: [...new Set(evidence.map(e => e.control_id))],
      verificationStatus: {
        verified: evidence.filter(e => e.verification_status === 'verified').length,
        pending: evidence.filter(e => e.verification_status === 'pending').length,
        rejected: evidence.filter(e => e.verification_status === 'rejected').length
      }
    },
    evidence: evidence.map(e => ({
      id: e.id,
      controlId: e.control_id,
      title: e.title,
      description: e.description,
      evidenceType: e.evidence_type,
      collectedAt: e.collected_at,
      collectedBy: e.collected_by,
      verificationStatus: e.verification_status,
      filePath: e.file_path,
      metadata: e.metadata
    }))
  };

  return packageData;
}