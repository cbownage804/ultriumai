import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TreeItem {
  path: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, repoFullName } = await req.json();

    if (!token || !repoFullName) {
      return new Response(JSON.stringify({ error: "Missing token or repoFullName (owner/repo)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    // 1. Get default branch
    const repoResp = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
    if (!repoResp.ok) {
      const err = await repoResp.text();
      console.error("Repo fetch error:", err);
      return new Response(JSON.stringify({ error: "Repository not found or inaccessible" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const repo = await repoResp.json();
    const branch = repo.default_branch || "main";

    // 2. Get tree recursively
    const treeResp = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
      { headers }
    );
    if (!treeResp.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch repository tree" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const treeData = await treeResp.json();

    // 3. Filter to text files only (skip binary, large files, node_modules)
    const textExtensions = new Set([
      "html", "htm", "css", "scss", "less", "js", "jsx", "ts", "tsx",
      "json", "md", "txt", "svg", "xml", "yml", "yaml", "toml",
      "sh", "env", "gitignore", "prettierrc", "eslintrc",
    ]);

    const fileItems: TreeItem[] = (treeData.tree || []).filter((item: TreeItem) => {
      if (item.type !== "blob") return false;
      if ((item.size || 0) > 100000) return false; // skip files > 100KB
      if (item.path.startsWith("node_modules/")) return false;
      if (item.path.startsWith(".git/")) return false;
      if (item.path.includes("package-lock.json")) return false;
      if (item.path.includes("bun.lockb")) return false;
      const ext = item.path.split(".").pop()?.toLowerCase() || "";
      return textExtensions.has(ext) || !item.path.includes(".");
    });

    // 4. Fetch file contents (batch, max 50 files)
    const filesToFetch = fileItems.slice(0, 50);
    const files = [];

    for (const item of filesToFetch) {
      try {
        const blobResp = await fetch(
          `https://api.github.com/repos/${repoFullName}/git/blobs/${item.sha}`,
          { headers }
        );
        if (!blobResp.ok) continue;
        const blob = await blobResp.json();

        let content: string;
        if (blob.encoding === "base64") {
          content = atob(blob.content.replace(/\n/g, ""));
        } else {
          content = blob.content;
        }

        const ext = item.path.split(".").pop()?.toLowerCase() || "";
        const langMap: Record<string, string> = {
          html: "html", htm: "html", css: "css", scss: "scss",
          js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
          json: "json", md: "markdown", svg: "xml", yml: "yaml", yaml: "yaml",
        };

        files.push({
          path: item.path,
          content,
          language: langMap[ext] || "plaintext",
        });
      } catch {
        // skip individual file errors
      }
    }

    return new Response(JSON.stringify({
      success: true,
      files,
      totalFiles: fileItems.length,
      fetchedFiles: files.length,
      branch,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("github-pull error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
