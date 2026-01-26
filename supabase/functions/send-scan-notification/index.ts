import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ScanNotificationRequest {
  userEmail: string;
  userName?: string;
  scanType: 'email' | 'document' | 'url' | 'bulk';
  threatCount: number;
  safe: boolean;
  riskLevel: string;
  fileName?: string;
  scanDetails: any;
  isMSP?: boolean;
  clientName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      userName = 'User',
      scanType,
      threatCount,
      safe,
      riskLevel,
      fileName,
      scanDetails,
      isMSP = false,
      clientName
    }: ScanNotificationRequest = await req.json();

    // Generate email content based on scan results
    const getEmailContent = () => {
      const subject = safe 
        ? `✅ SafeScan: Clean ${scanType} scan${isMSP ? ` for ${clientName}` : ''}`
        : `🚨 SafeScan: ${threatCount} threat${threatCount !== 1 ? 's' : ''} detected in ${scanType}${isMSP ? ` for ${clientName}` : ''}`;

      const riskColor = getRiskColor(riskLevel);
      const riskIcon = safe ? '✅' : '⚠️';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SafeScan Security Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 2rem; text-align: center; }
            .content { padding: 2rem; }
            .risk-badge { display: inline-block; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: bold; margin: 1rem 0; }
            .safe { background: #dcfce7; color: #166534; }
            .danger { background: #fecaca; color: #991b1b; }
            .warning { background: #fef3c7; color: #92400e; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
            .info-item { padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
            .footer { background: #f9fafb; padding: 1.5rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; margin: 1rem 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ SafeScan Security Report</h1>
              <p>Comprehensive security analysis complete</p>
            </div>
            
            <div class="content">
              <h2>Hello ${userName},</h2>
              
              <p>Your ${scanType} scan${isMSP ? ` for client <strong>${clientName}</strong>` : ''} has been completed.</p>
              
              <div class="risk-badge ${safe ? 'safe' : (riskLevel === 'critical' || riskLevel === 'high' ? 'danger' : 'warning')}">
                ${riskIcon} Risk Level: ${riskLevel.toUpperCase()}
              </div>

              ${fileName ? `<p><strong>File:</strong> ${fileName}</p>` : ''}
              
              <div class="info-grid">
                <div class="info-item">
                  <h3>Security Status</h3>
                  <p style="color: ${riskColor}; font-weight: bold; font-size: 1.125rem;">
                    ${safe ? 'CLEAN' : 'THREATS DETECTED'}
                  </p>
                </div>
                <div class="info-item">
                  <h3>Threats Found</h3>
                  <p style="font-size: 1.125rem; font-weight: bold;">
                    ${threatCount}
                  </p>
                </div>
              </div>

              ${!safe ? `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
                  <h3 style="color: #991b1b; margin-top: 0;">⚠️ Security Recommendations</h3>
                  <ul style="color: #7f1d1d;">
                    <li>Do not open, download, or execute the scanned content</li>
                    <li>Report this to your IT security team immediately</li>
                    <li>Run additional scans on your system if you've already interacted with this content</li>
                    <li>Consider updating your security policies and training</li>
                  </ul>
                </div>
              ` : `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
                  <h3 style="color: #166534; margin-top: 0;">✅ All Clear</h3>
                  <p style="color: #15803d;">No security threats were detected in this ${scanType}. You can proceed safely.</p>
                </div>
              `}

              <a href="${isMSP ? 'https://your-domain.com/msp/safescan' : 'https://your-domain.com/dashboard/safescan'}" class="button">
                View Full Report
              </a>

              <p style="margin-top: 2rem; color: #6b7280; font-size: 0.875rem;">
                Scan completed at ${new Date().toLocaleString()}
              </p>
            </div>
            
            <div class="footer">
              <p>
                <strong>Powered by Ultrium SafeScan™</strong><br>
                Advanced AI-powered security scanning for emails, documents, and URLs
              </p>
              <p>
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      return { subject, html };
    };

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'critical': return '#dc2626';
        case 'high': return '#ea580c';
        case 'medium': return '#d97706';
        case 'low': return '#2563eb';
        case 'safe': return '#16a34a';
        default: return '#6b7280';
      }
    };

    const { subject, html } = getEmailContent();

    const emailResponse = await resend.emails.send({
      from: "SafeScan Security <security@send.ultriumai.com>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("Security notification sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        scanType,
        threatCount,
        safe
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in send-scan-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);