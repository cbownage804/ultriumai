import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId, projectName, slug } = await req.json();
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a clean branded SVG thumbnail
    const displayName = (projectName || slug || "Project").slice(0, 30);
    const initials = displayName
      .split(/[\s-_]+/)
      .map((w: string) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 3);

    // Deterministic color from project ID
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
      hash |= 0;
    }
    const hue = Math.abs(hash) % 360;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 60%, 15%)"/>
      <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 50%, 8%)"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 55%)"/>
      <stop offset="100%" style="stop-color:hsl(${(hue + 30) % 360}, 65%, 50%)"/>
    </linearGradient>
  </defs>
  <rect width="640" height="400" fill="url(#bg)"/>
  <rect x="40" y="40" width="560" height="320" rx="16" fill="hsl(${hue}, 20%, 12%)" opacity="0.6"/>
  <circle cx="320" cy="170" r="50" fill="url(#accent)" opacity="0.9"/>
  <text x="320" y="185" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${escapeXml(initials)}</text>
  <text x="320" y="260" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="20" font-weight="500" opacity="0.9">${escapeXml(displayName)}</text>
  <rect x="200" y="290" width="240" height="4" rx="2" fill="url(#accent)" opacity="0.4"/>
</svg>`;

    // Convert SVG to a blob and upload
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const filePath = `${user.id}/${projectId}.svg`;

    const { error: uploadError } = await supabase.storage
      .from("project-thumbnails")
      .upload(filePath, svgBlob, {
        upsert: true,
        contentType: "image/svg+xml",
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabase.storage
      .from("project-thumbnails")
      .getPublicUrl(filePath);

    const thumbnailUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Update builder_projects
    await supabase
      .from("builder_projects")
      .update({ thumbnail_url: thumbnailUrl })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, thumbnailUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("capture-thumbnail error:", err);
    return new Response(
      JSON.stringify({ success: false, isFallback: true, error: String(err), data: null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
