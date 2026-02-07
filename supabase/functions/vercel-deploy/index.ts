import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectName, files, vercelToken } = await req.json();

    if (!vercelToken) throw new Error("Vercel token is required");
    if (!files || files.length === 0) throw new Error("No files to deploy");

    console.log(`[VERCEL-DEPLOY] Deploying ${files.length} files as "${projectName}"`);

    // Build the file structure for Vercel's deployment API
    const vercelFiles = files.map((f: { path: string; content: string }) => ({
      file: f.path,
      data: f.content,
    }));

    // Create deployment via Vercel API v13
    const deployResponse = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files: vercelFiles,
        projectSettings: {
          framework: null, // Static HTML
        },
        target: "production",
      }),
    });

    if (!deployResponse.ok) {
      const errText = await deployResponse.text();
      console.error("[VERCEL-DEPLOY] API error:", deployResponse.status, errText);
      throw new Error(`Vercel API error (${deployResponse.status}): ${errText}`);
    }

    const deployData = await deployResponse.json();
    const url = deployData.url ? `https://${deployData.url}` : null;

    console.log("[VERCEL-DEPLOY] Success:", { url, id: deployData.id });

    return new Response(JSON.stringify({ url, id: deployData.id, readyState: deployData.readyState }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[VERCEL-DEPLOY] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
