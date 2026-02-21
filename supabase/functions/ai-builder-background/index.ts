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

    // ── START: Submit a new build job ──
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

      // Fire-and-forget background generation
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

    // ── STREAM: SSE endpoint for live streaming ──
    if (action === "stream") {
      const { jobId } = body;
      if (!jobId) {
        return new Response(JSON.stringify({ error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Return an SSE stream that follows the job's output_content via polling
      const encoder = new TextEncoder();
      let lastLength = 0;
      let done = false;

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (data: string) => {
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          };

          // Poll every 500ms for new content
          while (!done) {
            try {
              const { data: job } = await supabase
                .from("app_builder_jobs")
                .select("status, output_content, progress_percent, error_message")
                .eq("id", jobId)
                .single();

              if (!job) { done = true; break; }

              // Send incremental content delta
              const content = job.output_content || "";
              if (content.length > lastLength) {
                const delta = content.slice(lastLength);
                lastLength = content.length;
                sendEvent(JSON.stringify({ type: "delta", content: delta, progress: job.progress_percent }));
              }

              // Send progress updates
              if (job.progress_percent) {
                sendEvent(JSON.stringify({ type: "progress", progress: job.progress_percent }));
              }

              // Job finished
              if (job.status === "completed") {
                // Send any remaining content
                if (content.length > lastLength) {
                  sendEvent(JSON.stringify({ type: "delta", content: content.slice(lastLength) }));
                }
                sendEvent(JSON.stringify({ type: "complete", status: "completed" }));
                done = true;
                break;
              }
              if (job.status === "failed") {
                sendEvent(JSON.stringify({ type: "error", error: job.error_message || "Build failed" }));
                done = true;
                break;
              }
              if (job.status === "cancelled") {
                sendEvent(JSON.stringify({ type: "cancelled" }));
                done = true;
                break;
              }

              await new Promise(r => setTimeout(r, 500));
            } catch (err) {
              console.error("[BG Stream] Error:", err);
              await new Promise(r => setTimeout(r, 1000));
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // ── STATUS: Get job status ──
    if (action === "status") {
      return await getJobStatus(supabase, body.jobId, userId);
    }

    // ── CANCEL: Cancel active job ──
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

    // ── QUEUE: Check queue position or enqueue ──
    if (action === "queue_status") {
      const effectiveUserId = userId || body.userId;
      if (!effectiveUserId) {
        return new Response(JSON.stringify({ queue: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Get all active/pending jobs for this user
      const { data: jobs } = await supabase
        .from("app_builder_jobs")
        .select("id, status, progress_percent, created_at")
        .eq("user_id", effectiveUserId)
        .in("status", ["pending", "processing", "streaming"])
        .order("created_at", { ascending: true });
      
      return new Response(JSON.stringify({ queue: jobs || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── HISTORY: Get recent build history ──
    if (action === "history") {
      const effectiveUserId = userId || body.userId;
      const limit = body.limit || 20;
      if (!effectiveUserId) {
        return new Response(JSON.stringify({ builds: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: builds } = await supabase
        .from("app_builder_jobs")
        .select("id, status, input_mode, progress_percent, bytes_received, created_at, started_at, completed_at, error_message")
        .eq("user_id", effectiveUserId)
        .in("status", ["completed", "failed", "cancelled"])
        .order("created_at", { ascending: false })
        .limit(limit);

      return new Response(JSON.stringify({ builds: builds || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── RESTORE: Get full output from a historical build ──
    if (action === "restore") {
      const { jobId } = body;
      if (!jobId) {
        return new Response(JSON.stringify({ error: "jobId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: job } = await supabase
        .from("app_builder_jobs")
        .select("id, status, output_content, completed_at, input_mode")
        .eq("id", jobId)
        .single();

      if (!job) {
        return new Response(JSON.stringify({ error: "Build not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(job), {
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
const TOTAL_BUILD_MAX_MS = 180_000;
const STREAM_STALL_MS = 25_000;

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

      // Update progress every ~5KB (more frequent for live streaming)
      if (bytesReceived - lastProgressUpdate > 5000) {
        lastProgressUpdate = bytesReceived;
        const progress = Math.min(90, Math.round((bytesReceived / 100000) * 100));
        await supabase
          .from("app_builder_jobs")
          .update({ 
            bytes_received: bytesReceived, 
            progress_percent: progress,
            output_content: fullContent,
          })
          .eq("id", jobId);
      }
    }
  } finally {
    clearInterval(stallChecker);
  }

  return { content: fullContent, bytesReceived, wasStalled };
}

function shouldContinue(content: string, wasStalled: boolean, roundNum: number): boolean {
  if (roundNum >= MAX_CONTINUATION_ROUNDS) return false;
  const hasContinueMarker = content.includes("===CONTINUE===");
  const hasFiles = content.includes("===FILE:") || content.includes("===EDIT:");
  const wasInterrupted = wasStalled && hasFiles;
  return hasContinueMarker || wasInterrupted;
}

function extractGeneratedPaths(content: string): string[] {
  const paths: string[] = [];
  const fileRegex = /^===FILE:\s*(.+?)===$/gm;
  let match;
  while ((match = fileRegex.exec(content)) !== null) paths.push(match[1].trim());
  const editRegex = /^===EDIT:\s*(.+?)===$/gm;
  while ((match = editRegex.exec(content)) !== null) paths.push(match[1].trim());
  return [...new Set(paths)];
}

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
          if (resp.status >= 500 || resp.status === 408 || resp.status === 504) {
            if (attempt < maxRetries) {
              const backoff = (attempt + 1) * 2000;
              console.warn(`[BG] Job ${jobId}: Retry ${attempt + 1}/${maxRetries} after ${resp.status}`);
              await new Promise(r => setTimeout(r, backoff));
              continue;
            }
          }
          const errText = await resp.text().catch(() => "Unknown error");
          throw new Error(`AI builder returned ${resp.status}: ${errText.slice(0, 500)}`);
        } catch (err: any) {
          if (err.message?.startsWith("AI builder returned")) throw err;
          if (attempt < maxRetries) {
            const backoff = (attempt + 1) * 2000;
            await new Promise(r => setTimeout(r, backoff));
            continue;
          }
          throw err;
        }
      }
      throw new Error("Max retries exceeded");
    };

    let response = await fetchWithRetry(buildPayload(messages));
    let streamResult = await streamAndAccumulate(response, supabase, jobId, "");
    fullContent = streamResult.content;
    totalBytesReceived = streamResult.bytesReceived;

    // Continuation loop
    let roundNum = 0;
    while (shouldContinue(fullContent, streamResult.wasStalled, roundNum)) {
      if (Date.now() - totalBuildStart > TOTAL_BUILD_MAX_MS) {
        console.warn(`[BG] Job ${jobId}: Total build time exceeded — stopping`);
        break;
      }

      const { data: jobCheck } = await supabase
        .from("app_builder_jobs")
        .select("status")
        .eq("id", jobId)
        .single();
      if (jobCheck?.status === "cancelled") return;

      roundNum++;
      const generatedPaths = extractGeneratedPaths(fullContent);
      const truncatedPaths = detectTruncatedFiles(fullContent);
      console.log(`[BG] Job ${jobId}: Continuation round ${roundNum}/${MAX_CONTINUATION_ROUNDS}`);

      await supabase
        .from("app_builder_jobs")
        .update({ 
          progress_percent: Math.min(90, 50 + roundNum * 10),
          output_content: fullContent,
        })
        .eq("id", jobId);

      const truncatedNote = truncatedPaths.length > 0
        ? `\n\nIMPORTANT: These files were cut off: ${truncatedPaths.join(', ')}. Regenerate them completely first.`
        : '';

      const originalSystem = messages[0]?.content;
      const contMessages = [
        { role: "system", content: typeof originalSystem === "string" ? originalSystem.slice(0, 5000) : "" },
        { role: "assistant", content: `[Generated ${generatedPaths.length} files: ${generatedPaths.join(', ')}]` },
        { role: "user", content: `[CONTINUE] Continue generating remaining files.${truncatedNote}\n\nCompleted: ${generatedPaths.join(', ')}\n\nOutput more files using ===FILE: path=== format. No explanations — ONLY code files.\nIf done, output ===FILE: README.md=== with a project description.\nIf more remain, end with ===CONTINUE===` },
      ];

      fullContent = fullContent.replace(/\n?===CONTINUE===\s*$/g, '');

      try {
        response = await fetchWithRetry(buildPayload(contMessages));
        streamResult = await streamAndAccumulate(response, supabase, jobId, fullContent);
        fullContent = streamResult.content;
        totalBytesReceived += streamResult.bytesReceived;
      } catch (err: any) {
        console.warn(`[BG] Job ${jobId}: Continuation round ${roundNum} failed: ${err.message}`);
        break;
      }
    }

    fullContent = fullContent.replace(/\n?===CONTINUE===\s*$/g, '');
    console.log(`[BG] Job ${jobId} complete: ${fullContent.length} chars, ${roundNum + 1} round(s)`);

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
        output_content: fullContent || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
