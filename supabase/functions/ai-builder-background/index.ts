import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userToken = authHeader?.replace("Bearer ", "") || "";
  let userId: string | null = null;
  if (userToken && userToken !== anonKey) {
    const { data: { user } } = await supabase.auth.getUser(userToken);
    userId = user?.id || null;
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "start") {
      const { messages, mode, model, supabaseConfig, stripeConfig, activeServices, currentFiles, jobUserId } = body;
      const effectiveUserId = userId || jobUserId;
      if (!effectiveUserId) {
        return new Response(JSON.stringify({ error: "Authentication required" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ error: "Messages required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create the job row
      const { data: job, error: insertError } = await supabase
        .from("app_builder_jobs")
        .insert({
          user_id: effectiveUserId,
          status: "pending",
          input_messages: messages,
          input_mode: mode || "build",
          input_model: model || null,
          supabase_config: supabaseConfig || null,
          stripe_config: stripeConfig || null,
          active_services: activeServices || [],
          current_files: currentFiles || [],
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to create job:", insertError);
        return new Response(JSON.stringify({ error: "Failed to create job" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jobId = job.id;
      console.log(`[BG] Job ${jobId} created for user ${effectiveUserId}`);

      // Fire-and-forget background generation with continuation support
      const generatePromise = runGenerationWithContinuation(supabase, jobId, {
        messages, mode, model, supabaseConfig, stripeConfig, activeServices,
      });

      if (typeof (globalThis as any).EdgeRuntime?.waitUntil === "function") {
        (globalThis as any).EdgeRuntime.waitUntil(generatePromise);
      } else {
        generatePromise.catch(err => console.error(`[BG] Job ${jobId} failed:`, err));
      }

      return new Response(JSON.stringify({ jobId, status: "pending" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "status") {
      return await getJobStatus(supabase, body.jobId, userId);
    }

    if (action === "cancel") {
      const { jobId } = body;
      if (!jobId) {
        return new Response(JSON.stringify({ error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabase
        .from("app_builder_jobs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", jobId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[BG] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getJobStatus(supabase: any, jobId: string | null, _userId: string | null) {
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: job, error } = await supabase
    .from("app_builder_jobs")
    .select("id, status, output_content, output_files, output_deletions, output_edits, output_migrations, output_edge_functions, error_message, progress_percent, bytes_received, created_at, started_at, completed_at")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(job), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Constants ──
const MAX_CONTINUATION_ROUNDS = 4;
const TOTAL_BUILD_MAX_MS = 180_000; // 3 minutes total across all rounds
const STREAM_STALL_MS = 25_000; // 25s stall = stream dead

/**
 * Stream an SSE response from ai-app-builder and accumulate the text content.
 * Returns the accumulated content string.
 */
async function streamAndAccumulate(
  response: Response,
  supabase: any,
  jobId: string,
  existingContent: string,
): Promise<{ content: string; bytesReceived: number; wasStalled: boolean }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = existingContent;
  let textBuffer = "";
  let bytesReceived = 0;
  let lastChunkTime = Date.now();
  let lastProgressUpdate = 0;
  let wasStalled = false;
  let streamDone = false;

  // Stall detector
  const stallChecker = setInterval(async () => {
    if (Date.now() - lastChunkTime > STREAM_STALL_MS && !streamDone) {
      console.warn(`[BG] Job ${jobId}: Stream stalled after ${STREAM_STALL_MS}ms`);
      wasStalled = true;
      streamDone = true;
      reader.cancel().catch(() => {});
    }
  }, 5000);

  try {
    while (!streamDone) {
      // Check cancellation every ~50KB
      if (bytesReceived > 0 && bytesReceived % 50000 < 1000) {
        const { data: jobCheck } = await supabase
          .from("app_builder_jobs")
          .select("status")
          .eq("id", jobId)
          .single();
        if (jobCheck?.status === "cancelled") {
          console.log(`[BG] Job ${jobId} was cancelled during stream`);
          reader.cancel().catch(() => {});
          throw new Error("CANCELLED");
        }
      }

      const { done, value } = await reader.read();
      if (done) break;

      bytesReceived += value.length;
      lastChunkTime = Date.now();
      textBuffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {
          // Skip malformed chunks
        }
      }

      // Update progress every ~10KB
      if (bytesReceived - lastProgressUpdate > 10000) {
        lastProgressUpdate = bytesReceived;
        const progress = Math.min(90, Math.round((bytesReceived / 100000) * 100));
        await supabase
          .from("app_builder_jobs")
          .update({ 
            bytes_received: bytesReceived, 
            progress_percent: progress,
            output_content: fullContent, // Progressive content updates for real-time display
          })
          .eq("id", jobId);
      }
    }
  } finally {
    clearInterval(stallChecker);
  }

  return { content: fullContent, bytesReceived, wasStalled };
}

/**
 * Detect if a continuation is needed based on content markers and stream state.
 */
function shouldContinue(content: string, wasStalled: boolean, roundNum: number): boolean {
  if (roundNum >= MAX_CONTINUATION_ROUNDS) return false;
  
  const hasContinueMarker = content.includes("===CONTINUE===");
  const hasFiles = content.includes("===FILE:") || content.includes("===EDIT:");
  const wasInterrupted = wasStalled && hasFiles;
  
  return hasContinueMarker || wasInterrupted;
}

/**
 * Extract generated file paths from the accumulated content.
 */
function extractGeneratedPaths(content: string): string[] {
  const paths: string[] = [];
  const fileRegex = /^===FILE:\s*(.+?)===$/gm;
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    paths.push(match[1].trim());
  }
  const editRegex = /^===EDIT:\s*(.+?)===$/gm;
  while ((match = editRegex.exec(content)) !== null) {
    paths.push(match[1].trim());
  }
  return [...new Set(paths)];
}

/**
 * Detect truncated files in the content (unclosed braces/tags at the end).
 */
function detectTruncatedFiles(content: string): string[] {
  const truncated: string[] = [];
  const fileRegex = /===FILE:\s*(.+?)===\n([\s\S]*?)(?=\n===(?:FILE|EDIT|DELETE|CONTINUE):|$)/g;
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    const path = match[1].trim();
    const fileContent = match[2];
    const ext = path.split('.').pop()?.toLowerCase() || '';
    
    if (['js', 'jsx', 'ts', 'tsx', 'mjs'].includes(ext)) {
      const opens = (fileContent.match(/[{(]/g) || []).length;
      const closes = (fileContent.match(/[})]/g) || []).length;
      if (opens - closes > 3) truncated.push(path);
    } else if (['html', 'htm'].includes(ext)) {
      const openTags = (fileContent.match(/<(?!\/|!|br|hr|img|input|meta|link)[a-z][^>]*>/gi) || []).length;
      const closeTags = (fileContent.match(/<\/[a-z][^>]*>/gi) || []).length;
      if (openTags - closeTags > 3) truncated.push(path);
    } else if (['css', 'scss'].includes(ext)) {
      const ob = (fileContent.match(/{/g) || []).length;
      const cb = (fileContent.match(/}/g) || []).length;
      if (ob - cb > 2) truncated.push(path);
    }
  }
  return truncated;
}

/**
 * Main generation logic with server-side continuation loop.
 * Runs entirely in the background — survives client disconnection.
 */
async function runGenerationWithContinuation(
  supabase: any,
  jobId: string,
  params: {
    messages: any[];
    mode: string;
    model?: string;
    supabaseConfig?: any;
    stripeConfig?: any;
    activeServices?: string[];
  }
) {
  const { messages, mode, model, supabaseConfig, stripeConfig, activeServices = [] } = params;
  const totalBuildStart = Date.now();
  let fullContent = "";
  let totalBytesReceived = 0;

  try {
    await supabase
      .from("app_builder_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId);

    const BUILDER_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-app-builder`;
    const fetchHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    };

    const buildPayload = (msgs: any[]) => JSON.stringify({
      messages: msgs,
      stream: true,
      mode,
      model: model || undefined,
      supabaseConfig: supabaseConfig || undefined,
      stripeConfig: stripeConfig || undefined,
      activeServices,
    });

    // ── Round 1: Initial request ──
    await supabase
      .from("app_builder_jobs")
      .update({ status: "streaming" })
      .eq("id", jobId);

    const fetchWithRetry = async (payload: string, maxRetries = 2): Promise<Response> => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const resp = await fetch(BUILDER_URL, {
            method: "POST",
            headers: fetchHeaders,
            body: payload,
          });
          
          if (resp.ok) return resp;
          
          // Retry on 5xx or 408/504
          if (resp.status >= 500 || resp.status === 408 || resp.status === 504) {
            if (attempt < maxRetries) {
              const backoff = (attempt + 1) * 2000;
              console.warn(`[BG] Job ${jobId}: Retry ${attempt + 1}/${maxRetries} after ${resp.status} (backoff ${backoff}ms)`);
              await new Promise(r => setTimeout(r, backoff));
              continue;
            }
          }
          
          // Non-retryable error
          const errText = await resp.text().catch(() => "Unknown error");
          throw new Error(`AI builder returned ${resp.status}: ${errText.slice(0, 500)}`);
        } catch (err: any) {
          if (err.message?.startsWith("AI builder returned")) throw err;
          if (attempt < maxRetries) {
            const backoff = (attempt + 1) * 2000;
            console.warn(`[BG] Job ${jobId}: Network error retry ${attempt + 1}/${maxRetries}: ${err.message}`);
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw err;
        }
      }
      throw new Error("Max retries exceeded");
    };

    // Initial request
    let response = await fetchWithRetry(buildPayload(messages));
    let streamResult = await streamAndAccumulate(response, supabase, jobId, "");
    fullContent = streamResult.content;
    totalBytesReceived = streamResult.bytesReceived;

    // ── Continuation loop (server-side — survives tab close) ──
    let roundNum = 0;
    while (shouldContinue(fullContent, streamResult.wasStalled, roundNum)) {
      // Check total time cap
      if (Date.now() - totalBuildStart > TOTAL_BUILD_MAX_MS) {
        console.warn(`[BG] Job ${jobId}: Total build time exceeded ${TOTAL_BUILD_MAX_MS}ms — stopping`);
        break;
      }

      // Check cancellation
      const { data: jobCheck } = await supabase
        .from("app_builder_jobs")
        .select("status")
        .eq("id", jobId)
        .single();
      if (jobCheck?.status === "cancelled") {
        console.log(`[BG] Job ${jobId}: Cancelled between rounds`);
        return;
      }

      roundNum++;
      const generatedPaths = extractGeneratedPaths(fullContent);
      const truncatedPaths = detectTruncatedFiles(fullContent);
      
      console.log(`[BG] Job ${jobId}: Continuation round ${roundNum}/${MAX_CONTINUATION_ROUNDS}, ${generatedPaths.length} files so far`);

      // Update progress
      await supabase
        .from("app_builder_jobs")
        .update({ 
          progress_percent: Math.min(90, 50 + roundNum * 10),
          output_content: fullContent,
        })
        .eq("id", jobId);

      // Build continuation prompt
      const truncatedNote = truncatedPaths.length > 0
        ? `\n\nIMPORTANT: The following file(s) were cut off and need to be regenerated completely:\n${truncatedPaths.map(p => `- ${p}`).join('\n')}\nPlease output them in full first, then continue with remaining files.`
        : '';

      // Minimal system context for continuation (save tokens)
      const originalSystem = messages[0]?.content;
      const contMessages = [
        { role: "system", content: typeof originalSystem === "string" ? originalSystem.slice(0, 5000) : "" },
        { role: "assistant", content: `[Generated ${generatedPaths.length} files: ${generatedPaths.join(', ')}]` },
        { role: "user", content: `[CONTINUE] Continue generating the remaining files.${truncatedNote}\n\nFiles completed so far: ${generatedPaths.join(', ')}\n\nIMPORTANT: You MUST output more files using ===FILE: path=== format.\nDo NOT write explanations — ONLY output code files.\nIf all files are done, output a single small file like ===FILE: README.md=== with a project description.\nIf more files remain, end with ===CONTINUE===` },
      ];

      // Strip ===CONTINUE=== marker from accumulated content before appending more
      fullContent = fullContent.replace(/\n?===CONTINUE===\s*$/g, '');

      try {
        response = await fetchWithRetry(buildPayload(contMessages));
        streamResult = await streamAndAccumulate(response, supabase, jobId, fullContent);
        fullContent = streamResult.content;
        totalBytesReceived += streamResult.bytesReceived;
      } catch (err: any) {
        console.warn(`[BG] Job ${jobId}: Continuation round ${roundNum} failed: ${err.message}`);
        break; // Use what we have so far
      }
    }

    // ── Clean up final content ──
    fullContent = fullContent.replace(/\n?===CONTINUE===\s*$/g, '');

    console.log(`[BG] Job ${jobId} complete: ${fullContent.length} chars, ${totalBytesReceived} bytes, ${roundNum + 1} round(s)`);

    // Store final result
    await supabase
      .from("app_builder_jobs")
      .update({
        status: "completed",
        output_content: fullContent,
        bytes_received: totalBytesReceived,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

  } catch (err: any) {
    if (err.message === "CANCELLED") {
      console.log(`[BG] Job ${jobId}: Cancelled`);
      return;
    }
    console.error(`[BG] Job ${jobId} failed:`, err);
    await supabase
      .from("app_builder_jobs")
      .update({
        status: "failed",
        error_message: err.message || "Unknown error",
        output_content: fullContent || null, // Preserve partial content
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
