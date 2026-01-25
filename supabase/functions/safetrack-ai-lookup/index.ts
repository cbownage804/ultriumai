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

Known patterns:
- Dell/Alienware: 7-character alphanumeric (e.g., "DL7K9H2", "4RT6H93")
- HP/HPE: 10-char starting with letters (e.g., "CND1234567", "MXL1234567")
- Lenovo: 8-char alphanumeric, often starts with "PF" or "R9" (e.g., "PF1A2B3C")
- Apple: 12-char alphanumeric (e.g., "C02XL0GTJGH5")
- Cisco: Often starts with "FCW", "FTX", "JAD" (e.g., "FCW2345X0AB")
- Microsoft Surface: 12-digit numeric (e.g., "012345678901")
- Samsung: 15-char, starts with "R" (e.g., "RF8M91234567890")
- ASUS: starts with letters like "G", "H", "J" followed by numbers
- Acer: Often "NX" or "SNID" prefix

If you cannot identify the manufacturer from the pattern, make your best educated guess based on the format.`;

    const userPrompt = `Identify this serial number: "${serialNumber}"

Respond ONLY with valid JSON in this exact format:
{
  "manufacturer": "Manufacturer name",
  "model": "Best guess at model line (e.g., 'Latitude 5000 Series', 'ThinkPad T Series')",
  "category": "One of: Laptop, Desktop, Server, Network Equipment, Peripheral, Monitor, Printer, Mobile Device, Other",
  "device_type": "More specific type if known",
  "notes": "Any relevant notes about this serial pattern"
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
