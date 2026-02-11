// =============================================================================
// Vanguard MeshCentral Configuration
// Primary zero-touch remote access via browser-based MeshCentral
// =============================================================================

import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://nsyobmjpdpvesjwdphlh.supabase.co";

/**
 * Check if MeshCentral is configured (secrets are set server-side).
 * This is a lightweight check — the edge function will return 503 if not configured.
 */
export function isMeshCentralConfigured(): boolean {
  // MeshCentral config lives in edge function secrets.
  // We always return true here and let the edge function handle the check.
  return true;
}

/**
 * Request a one-time MeshCentral remote desktop URL from the edge function.
 * Opens the remote desktop in a new browser tab — no client software needed.
 */
export async function getMeshCentralDesktopUrl(
  nodeId: string
): Promise<{ url: string; error?: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { url: "", error: "Not authenticated" };
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/vanguard-meshcentral-auth`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ node_id: nodeId }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return { url: "", error: data.error || "Failed to get MeshCentral URL" };
  }

  return { url: data.url };
}

/**
 * Open a MeshCentral remote desktop session in a new tab.
 * Returns true if successful, false if there was an error.
 */
export async function openMeshCentralSession(
  nodeId: string
): Promise<boolean> {
  const { url, error } = await getMeshCentralDesktopUrl(nodeId);

  if (error || !url) {
    console.error("MeshCentral session error:", error);
    return false;
  }

  window.open(url, "_blank");
  return true;
}
