import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  businessType: string;
  serviceProviderType?: string;
  businessSize?: string;
  industry?: string;
  projectType?: string;
  productType: string;
  whiteLabeled: string;
  message?: string;
  productInterests: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const formData: ContactFormData = await req.json();
    
    console.log("Received contact form submission:", formData);

    // Format the business type details
    let businessTypeDetails = `Business Type: ${formData.businessType}`;
    if (formData.businessType === 'service-provider' && formData.serviceProviderType) {
      businessTypeDetails += ` (${formData.serviceProviderType === 'msp' ? 'MSP - Managed Service Provider' : 'MSSP - Managed Security Service Provider'})`;
    } else if (formData.businessType === 'business' && formData.businessSize) {
      const sizeMap = {
        'small': 'Small Business',
        'medium': 'Medium Business', 
        'enterprise': 'Enterprise'
      };
      businessTypeDetails += ` (${sizeMap[formData.businessSize as keyof typeof sizeMap] || formData.businessSize})`;
    }

    // Format product interests
    const productNames = [
      { id: 'ultriumgpt', name: 'UltriumGPT Platform' },
      { id: 'safeemail', name: 'SafeEmail™' },
      { id: 'safelink', name: 'SafeLink™' },
      { id: 'safedoc', name: 'SafeDoc™' },
      { id: 'safepass', name: 'SafePass™' },
      { id: 'safenet', name: 'SafeNet™' },
      { id: 'safecomp', name: 'SafeComp™' },
      { id: 'safeweb', name: 'SafeWeb™' }
    ];

    const selectedProducts = formData.productInterests.length > 0 
      ? productNames
          .filter(p => formData.productInterests.includes(p.id))
          .map(p => p.name)
          .join(', ')
      : 'No specific products selected';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          🚀 New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
          ${formData.phone ? `<p><strong>Phone:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>` : ''}
          ${formData.company ? `<p><strong>Company:</strong> ${formData.company}</p>` : ''}
        </div>

        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Business Details</h3>
          <p><strong>${businessTypeDetails}</strong></p>
          ${formData.industry ? `<p><strong>Industry:</strong> ${formData.industry}</p>` : ''}
          ${formData.projectType ? `<p><strong>Project Interest:</strong> ${formData.projectType}</p>` : ''}
        </div>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Solution Preferences</h3>
          <p><strong>Product Type:</strong> ${formData.productType === 'custom' ? 'Custom Solution' : 'Prebuilt Solution'}</p>
          <p><strong>White Labeling:</strong> ${formData.whiteLabeled === 'yes' ? 'Yes, wants white-labeled solution' : 'No, UltriumAI branding is fine'}</p>
          <p><strong>Product Interests:</strong></p>
          <ul style="margin-left: 20px;">
            ${formData.productInterests.length > 0 
              ? productNames
                  .filter(p => formData.productInterests.includes(p.id))
                  .map(p => `<li>${p.name}</li>`)
                  .join('')
              : '<li><em>No specific products selected</em></li>'
            }
          </ul>
        </div>

        ${formData.message ? `
        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${formData.message}</p>
        </div>
        ` : ''}

        <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            📅 Submitted on ${new Date().toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "UltriumAI Support <support@ultriumai.com>",
      to: ["support@ultriumai.com"],
      replyTo: formData.email,
      subject: `🚀 New Contact Form: ${formData.firstName} ${formData.lastName} - ${formData.businessType === 'service-provider' ? 'Service Provider' : 'Business'} Inquiry`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contact form submitted successfully",
        emailId: emailResponse.data?.id 
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
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send contact form" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);