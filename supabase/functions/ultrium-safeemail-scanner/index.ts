import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailScanResult {
  email: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  reputation_score: number;
  scan_details: {
    spf_valid: boolean;
    dkim_valid: boolean;
    dmarc_valid: boolean;
    sender_reputation: number;
    content_analysis: {
      spam_score: number;
      phishing_indicators: string[];
      suspicious_attachments: number;
    };
    scan_date: string;
  };
  recommendations: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email_content, sender_email, headers, user_id, gpt_id } = await req.json();
    
    if (!email_content && !sender_email) {
      throw new Error('Email content or sender email is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check user subscription
    if (user_id) {
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', user_id)
        .single();

      const { data: appSubscription } = await supabase
        .from('security_app_subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .eq('app_id', 'safeemail')
        .eq('status', 'active')
        .single();

      if (!subscription || 
          (subscription.subscription_tier !== 'enterprise' && 
           subscription.subscription_tier !== 'premium' && 
           !appSubscription)) {
        throw new Error('SafeEmail scanning requires Premium, Enterprise subscription or SafeEmail app subscription');
      }
    }

    let spamScore = 0;
    let phishingIndicators: string[] = [];
    let suspiciousAttachments = 0;
    let threats: string[] = [];
    let riskLevel: EmailScanResult['risk_level'] = 'safe';
    const recommendations: string[] = [];

    // Analyze email content for spam/phishing indicators
    if (email_content) {
      const content = email_content.toLowerCase();
      
      // Spam indicators
      const spamKeywords = [
        'urgent', 'act now', 'limited time', 'free money', 'click here',
        'verify account', 'suspend', 'unusual activity', 'confirm identity',
        'prize', 'lottery', 'winner', 'congratulations', 'inheritance'
      ];
      
      const spamCount = spamKeywords.filter(keyword => content.includes(keyword)).length;
      spamScore = Math.min(100, spamCount * 10);

      // Phishing indicators
      if (content.includes('verify') && content.includes('account')) {
        phishingIndicators.push('Account verification request');
      }
      if (content.includes('click') && content.includes('link')) {
        phishingIndicators.push('Suspicious link request');
      }
      if (content.includes('urgent') && content.includes('action')) {
        phishingIndicators.push('Urgency tactics');
      }
      if (content.includes('suspend') || content.includes('disabled')) {
        phishingIndicators.push('Account suspension threat');
      }

      // Check for suspicious URLs
      const urlRegex = /https?:\/\/[^\s]+/g;
      const urls = content.match(urlRegex) || [];
      const suspiciousUrls = urls.filter(url => {
        const domain = new URL(url).hostname;
        return domain.includes('bit.ly') || 
               domain.includes('tinyurl') || 
               domain.includes('secure-') ||
               domain.includes('-secure') ||
               domain.includes('verification-') ||
               domain.includes('account-');
      });
      
      if (suspiciousUrls.length > 0) {
        phishingIndicators.push('Suspicious shortened/fake URLs detected');
      }
    }

    // Analyze sender email
    let senderReputation = 50; // Default neutral
    if (sender_email) {
      const domain = sender_email.split('@')[1];
      
      // Known good domains
      const trustedDomains = [
        'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
        'microsoft.com', 'google.com', 'apple.com', 'amazon.com'
      ];
      
      // Known bad patterns
      const suspiciousDomains = [
        'secure-', '-secure', 'verification-', 'account-',
        'paypal-', 'amazon-', 'microsoft-', 'google-'
      ];
      
      if (trustedDomains.includes(domain)) {
        senderReputation = 80;
      } else if (suspiciousDomains.some(pattern => domain.includes(pattern))) {
        senderReputation = 20;
        threats.push('Suspicious sender domain');
      }
    }

    // Analyze headers for SPF/DKIM/DMARC (simplified)
    let spfValid = true;
    let dkimValid = true;
    let dmarcValid = true;

    if (headers) {
      // Simplified header analysis
      if (headers['received-spf'] && headers['received-spf'].includes('fail')) {
        spfValid = false;
        threats.push('SPF validation failed');
      }
      if (headers['dkim-signature'] === undefined) {
        dkimValid = false;
        threats.push('Missing DKIM signature');
      }
      if (headers['authentication-results'] && 
          headers['authentication-results'].includes('dmarc=fail')) {
        dmarcValid = false;
        threats.push('DMARC validation failed');
      }
    }

    // Calculate overall risk
    let riskScore = 0;
    riskScore += spamScore * 0.3;
    riskScore += phishingIndicators.length * 15;
    riskScore += (100 - senderReputation) * 0.4;
    riskScore += (!spfValid ? 20 : 0);
    riskScore += (!dkimValid ? 10 : 0);
    riskScore += (!dmarcValid ? 15 : 0);

    if (riskScore <= 20) {
      riskLevel = 'safe';
      recommendations.push('Email appears safe');
    } else if (riskScore <= 40) {
      riskLevel = 'low';
      recommendations.push('Exercise normal caution');
    } else if (riskScore <= 60) {
      riskLevel = 'medium';
      threats.push('Potential spam/phishing');
      recommendations.push('Be cautious with links and attachments');
    } else if (riskScore <= 80) {
      riskLevel = 'high';
      threats.push('Likely spam/phishing attempt');
      recommendations.push('Do not click links or download attachments');
    } else {
      riskLevel = 'critical';
      threats.push('Confirmed malicious email');
      recommendations.push('BLOCK - Delete this email immediately');
    }

    const reputationScore = Math.max(0, 100 - riskScore);

    const result: EmailScanResult = {
      email: sender_email || 'Content analysis',
      safe: riskLevel === 'safe',
      risk_level: riskLevel,
      threats_detected: threats,
      reputation_score: reputationScore,
      scan_details: {
        spf_valid: spfValid,
        dkim_valid: dkimValid,
        dmarc_valid: dmarcValid,
        sender_reputation: senderReputation,
        content_analysis: {
          spam_score: spamScore,
          phishing_indicators: phishingIndicators,
          suspicious_attachments: suspiciousAttachments
        },
        scan_date: new Date().toISOString()
      },
      recommendations: recommendations
    };

    // Log the scan activity
    if (user_id) {
      await supabase.from('gpt_analytics').insert({
        gpt_id: gpt_id || null,
        user_id: user_id,
        interaction_type: 'security_scan',
        metadata: {
          scan_type: 'email',
          sender_email: sender_email,
          risk_level: riskLevel,
          threats_count: threats.length
        }
      });

      // Update usage count
      if (appSubscription) {
        await supabase
          .from('security_app_subscriptions')
          .update({ usage_current: (appSubscription.usage_current || 0) + 1 })
          .eq('id', appSubscription.id);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SafeEmail scanner error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      safe: false,
      risk_level: 'critical',
      threats_detected: ['Scan failed'],
      recommendations: ['Unable to verify email safety - exercise extreme caution']
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});