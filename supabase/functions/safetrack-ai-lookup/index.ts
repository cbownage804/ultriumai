/**
 * SafeTrack AI Serial Number Lookup
 * Uses AI to identify device info from serial number patterns
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LookupResult {
  manufacturer: string;
  model: string;
  category: string;
  estimated_purchase_year?: number;
  device_type?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { serialNumber } = await req.json();

    if (!serialNumber || serialNumber.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Serial number is required (min 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an IT asset identification expert. Given a serial number, identify the manufacturer and likely device details based on serial number patterns.

IMPORTANT: When identifying devices, be specific about sub-brands:
- Dell owns Alienware - Alienware uses the SAME 7-character service tag format as Dell
- HP owns HyperX gaming peripherals
- Lenovo owns Motorola for phones
- Microsoft Surface has its own format

Known serial number patterns:
- Dell/Alienware: 7-character alphanumeric service tags (e.g., "6J2NRY3", "DL7K9H2", "4RT6H93")
  * CRITICAL: You CANNOT distinguish Dell from Alienware by serial alone. If it's a 7-char Dell tag, say "Dell or Alienware" as manufacturer
- HP/HPE: 10-char starting with letters like "CND", "MXL", "5CG" (e.g., "CND1234567", "MXL1234567", "5CG234ABC")
- Lenovo ThinkPad: 8-char often starts with "PF", "R9", "PC" (e.g., "PF1A2B3C", "R90WXYZ1")
- Lenovo IdeaPad/Legion: May start with "MP", "LR" 
- Apple: 12-char alphanumeric (e.g., "C02XL0GTJGH5", "FVFXM2ABC123")
- Cisco: Starts with "FCW", "FTX", "JAD", "FOC" (e.g., "FCW2345X0AB")
- Microsoft Surface: 12-digit numeric (e.g., "012345678901")
- Samsung: 15-char, often starts with "R" or "S" (e.g., "RF8M91234567890")
- ASUS: Starts with letters like "G", "H", "J", "K", "M" followed by numbers
- Acer: "NX" or "SNID" prefix (e.g., "NXH1234567890")
- Razer: Often starts with "RZ" or has specific patterns

When the serial format is ambiguous between parent and subsidiary brands (e.g., Dell/Alienware), list BOTH possibilities.`;

    const userPrompt = `Identify this serial number: "${serialNumber}"

Respond ONLY with valid JSON in this exact format:
{
  "manufacturer": "Manufacturer name (if ambiguous like Dell/Alienware, say 'Dell or Alienware')",
  "model": "Best guess at model line (e.g., 'Latitude 5000 Series', 'ThinkPad T Series', 'Alienware m15/m17 or Dell Laptop')",
  "category": "One of: Laptop, Desktop, Server, Network Equipment, Peripheral, Monitor, Printer, Mobile Device, Gaming PC, Other",
  "device_type": "More specific type if determinable",
  "notes": "Any relevant notes - especially if manufacturer is ambiguous, explain why"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result: LookupResult;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a fallback
      result = {
        manufacturer: "Unknown",
        model: "Unknown Model",
        category: "Other",
        notes: "Could not identify from serial number pattern"
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          serial_number: serialNumber.trim(),
          manufacturer: result.manufacturer || "Unknown",
          model: result.model || "Unknown Model",
          category: result.category || "Other",
          device_type: result.device_type,
          notes: result.notes
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("SafeTrack AI lookup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
