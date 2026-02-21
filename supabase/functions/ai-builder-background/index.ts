import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Background generation edge function.
 * 
 * Two modes:
 * 1. POST /start — Creates a job row, kicks off generation in the background, returns job ID immediately
 * 2. GET /status?jobId=xxx — Returns current job status + output (for polling)
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Authenticate the user
  const authHeader = req.headers.get("Authorization");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userToken = authHeader?.replace("Bearer ", "") || "";
  
  // If token equals anon key, try to get user from the request
  let userId: string | null = null;
  
  if (userToken && userToken !== anonKey) {
    const { data: { user } } = await supabase.auth.getUser(userToken);
    userId = user?.id || null;
  }

  try {
    if (req.method === "POST" && (!path || path === "ai-builder-background")) {
      // ── START a new background job ──
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

        // Fire-and-forget: kick off the actual generation
        // We use EdgeRuntime.waitUntil to keep the function alive after responding
        const generatePromise = runGeneration(supabase, jobId, {
          messages, mode, model, supabaseConfig, stripeConfig, activeServices,
        });

        // Use waitUntil if available (Deno Deploy), otherwise just let it run
        if (typeof (globalThis as any).EdgeRuntime?.waitUntil === "function") {
          (globalThis as any).EdgeRuntime.waitUntil(generatePromise);
        } else {
          // Fallback: don't await, let it run in background
          generatePromise.catch(err => console.error(`[BG] Job ${jobId} failed:`, err));
        }

        return new Response(JSON.stringify({ jobId, status: "pending" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "status") {
        const { jobId } = body;
        return await getJobStatus(supabase, jobId, userId);
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
    }

    // GET for status polling
    if (req.method === "GET") {
      const jobId = url.searchParams.get("jobId");
      return await getJobStatus(supabase, jobId, userId);
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[BG] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getJobStatus(supabase: any, jobId: string | null, userId: string | null) {
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

/** The actual generation logic — runs in background after HTTP response is sent */
async function runGeneration(
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

  try {
    // Mark as processing
    await supabase
      .from("app_builder_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", jobId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call the existing ai-app-builder edge function logic directly
    // We reuse the same gateway call but collect the full response instead of streaming
    const BUILDER_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-app-builder`;
    const response = await fetch(BUILDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        messages,
        stream: true,
        mode,
        model,
        supabaseConfig,
        stripeConfig,
        activeServices,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI builder returned ${response.status}: ${errText.slice(0, 500)}`);
    }

    // Mark as streaming
    await supabase
      .from("app_builder_jobs")
      .update({ status: "streaming" })
      .eq("id", jobId);

    // Read the SSE stream and accumulate content
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let textBuffer = "";
    let bytesReceived = 0;
    let lastProgressUpdate = 0;

    while (true) {
      // Check if job was cancelled
      if (bytesReceived > 0 && bytesReceived % 50000 < 1000) {
        const { data: jobCheck } = await supabase
          .from("app_builder_jobs")
          .select("status")
          .eq("id", jobId)
          .single();
        if (jobCheck?.status === "cancelled") {
          console.log(`[BG] Job ${jobId} was cancelled`);
          reader.cancel();
          return;
        }
      }

      const { done, value } = await reader.read();
      if (done) break;

      bytesReceived += value.length;
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
        if (jsonStr === "[DONE]") break;
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
        const progress = Math.min(95, Math.round((bytesReceived / 100000) * 100));
        await supabase
          .from("app_builder_jobs")
          .update({ bytes_received: bytesReceived, progress_percent: progress })
          .eq("id", jobId);
      }
    }

    console.log(`[BG] Job ${jobId} stream complete: ${fullContent.length} chars, ${bytesReceived} bytes`);

    // Store the raw output — client will parse it
    await supabase
      .from("app_builder_jobs")
      .update({
        status: "completed",
        output_content: fullContent,
        bytes_received: bytesReceived,
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log(`[BG] Job ${jobId} completed successfully`);
  } catch (err: any) {
    console.error(`[BG] Job ${jobId} failed:`, err);
    await supabase
      .from("app_builder_jobs")
      .update({
        status: "failed",
        error_message: err.message || "Unknown error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}
