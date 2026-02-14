import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const MIN_FORM_FILL_TIME_MS = 3000;

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  contactType?: string;
  businessSize?: string;
  industry?: string;
  projectType?: string;
  message?: string;
  productInterests: string[];
  _honeypot?: string;
  _formLoadedAt?: number;
}

const getClientIP = (req: Request): string => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP;
  return "unknown";
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();
    const clientIP = getClientIP(req);
    console.log("Received contact form submission from IP:", clientIP);

    // Honeypot check
    if (formData._honeypot && formData._honeypot.length > 0) {
      console.log("Honeypot triggered");
      return new Response(
        JSON.stringify({ success: true, message: "Thank you for your submission" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Timing check
    if (formData._formLoadedAt) {
      const timeTaken = Date.now() - formData._formLoadedAt;
      if (timeTaken < MIN_FORM_FILL_TIME_MS) {
        console.log(`Form filled too fast (${timeTaken}ms)`);
        return new Response(
          JSON.stringify({ success: true, message: "Thank you for your submission" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Rate limiting
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("contact_form_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIP)
      .gte("submitted_at", windowStart);

    if (!countError && count !== null && count >= MAX_SUBMISSIONS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many submissions. Please try again in a few minutes." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabase.from("contact_form_rate_limits").insert({ ip_address: clientIP });

    // Validation
    if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Name and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize
    const sanitize = (str: string | undefined): string => {
      if (!str) return "";
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim()
        .substring(0, 1000);
    };

    const sanitizedData = {
      firstName: sanitize(formData.firstName),
      lastName: sanitize(formData.lastName),
      email: formData.email.trim().toLowerCase().substring(0, 255),
      phone: sanitize(formData.phone),
      company: sanitize(formData.company),
      contactType: sanitize(formData.contactType),
      businessSize: sanitize(formData.businessSize),
      industry: sanitize(formData.industry),
      projectType: sanitize(formData.projectType),
      message: sanitize(formData.message)?.substring(0, 5000),
      productInterests: Array.isArray(formData.productInterests)
        ? formData.productInterests.filter(id => typeof id === "string").slice(0, 20)
        : []
    };

    // Product name mapping
    const productNameMap: Record<string, string> = {
      "vanguard": "Vanguard",
      "safesuite": "SafeSuite",
      "ai-studio": "AI Studio",
      "custom-apps": "Custom App Development",
    };

    const contactTypeLabel = sanitizedData.contactType === "business" ? "Business" 
      : sanitizedData.contactType === "msp" ? "MSP / Service Provider"
      : "Individual";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          🚀 New Contact Form Submission
        </h2>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${sanitizedData.firstName} ${sanitizedData.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
          ${sanitizedData.phone ? `<p><strong>Phone:</strong> ${sanitizedData.phone}</p>` : ""}
          ${sanitizedData.company ? `<p><strong>Company:</strong> ${sanitizedData.company}</p>` : ""}
          <p><strong>Contact Type:</strong> ${contactTypeLabel}</p>
        </div>

        ${sanitizedData.businessSize || sanitizedData.industry || sanitizedData.projectType ? `
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Business Details</h3>
          ${sanitizedData.businessSize ? `<p><strong>Business Size:</strong> ${sanitizedData.businessSize}</p>` : ""}
          ${sanitizedData.industry ? `<p><strong>Industry:</strong> ${sanitizedData.industry}</p>` : ""}
          ${sanitizedData.projectType ? `<p><strong>Project Type:</strong> ${sanitizedData.projectType}</p>` : ""}
        </div>
        ` : ""}

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Product Interests</h3>
          <ul style="margin-left: 20px;">
            ${sanitizedData.productInterests.length > 0
              ? sanitizedData.productInterests
                  .map(id => `<li>${productNameMap[id] || id}</li>`)
                  .join("")
              : "<li><em>No specific products selected</em></li>"
            }
          </ul>
        </div>

        ${sanitizedData.message ? `
        <div style="background-color: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${sanitizedData.message}</p>
        </div>
        ` : ""}

        <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin-top: 30px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            📅 Submitted on ${new Date().toLocaleString("en-US", { 
              timeZone: "America/New_York",
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit", timeZoneName: "short"
            })}
          </p>
          <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">IP: ${clientIP}</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "UltriumAI Support <support@send.ultriumai.com>",
      to: ["support@ultriumai.com"],
      replyTo: sanitizedData.email,
      subject: `🚀 New Contact: ${sanitizedData.firstName} ${sanitizedData.lastName} - ${contactTypeLabel}`,
      html: emailHtml,
    });

    console.log("Email send response:", JSON.stringify(emailResponse, null, 2));

    // Save to leads table
    const { error: leadError } = await supabase
      .from("leads")
      .insert({
        first_name: sanitizedData.firstName,
        last_name: sanitizedData.lastName,
        email: sanitizedData.email,
        phone: sanitizedData.phone || null,
        company: sanitizedData.company || null,
        business_type: sanitizedData.contactType || null,
        business_size: sanitizedData.businessSize || null,
        industry: sanitizedData.industry || null,
        project_type: sanitizedData.projectType || null,
        message: sanitizedData.message || null,
        product_interests: sanitizedData.productInterests,
        source: "contact_form",
        status: "new"
      });

    if (leadError) {
      console.error("Failed to save lead:", leadError);
    }

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.error.message || "Failed to send email" }),
        { status: emailResponse.error.statusCode || 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Contact form submitted successfully", emailId: emailResponse.data?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to send contact form" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
