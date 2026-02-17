import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);

  // Extract the path after /api-gateway
  const fullPath = url.pathname.replace(/^\/api-gateway/, "") || "/";
  // Get the base resource path (first segment)
  const pathSegments = fullPath.split("/").filter(Boolean);
  const basePath = "/" + (pathSegments[0] || "");
  const resourceId = pathSegments[1] || null;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Find the endpoint config
    const { data: endpoint, error: epError } = await supabaseAdmin
      .from("api_endpoints")
      .select("*")
      .eq("base_path", basePath)
      .eq("is_active", true)
      .single();

    if (epError || !endpoint) {
      return jsonResponse(404, { error: "Endpoint not found", path: basePath });
    }

    // Check method allowed
    if (!endpoint.allowed_methods.includes(req.method)) {
      return jsonResponse(405, { error: `Method ${req.method} not allowed` });
    }

    // Auth check
    if (endpoint.requires_auth) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return jsonResponse(401, { error: "API key required" });
      }

      const apiKey = authHeader.replace("Bearer ", "");
      const keyHash = await hashKey(apiKey);

      const { data: keyRecord } = await supabaseAdmin
        .from("api_keys")
        .select("id, is_active, user_id, usage_count")
        .eq("key_hash", keyHash)
        .eq("is_active", true)
        .single();

      if (!keyRecord) {
        return jsonResponse(401, { error: "Invalid or inactive API key" });
      }

      // Verify the key belongs to the endpoint owner
      if (keyRecord.user_id !== endpoint.user_id) {
        return jsonResponse(403, { error: "API key does not have access to this endpoint" });
      }

      // Increment usage
      await supabaseAdmin
        .from("api_keys")
        .update({
          usage_count: (keyRecord.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", keyRecord.id);
    }

    // Execute the query based on method
    let result: any;
    let statusCode = 200;
    const table = endpoint.source_table;
    const hiddenFields = endpoint.hidden_fields || [];

    switch (req.method) {
      case "GET": {
        let query = supabaseAdmin.from(table).select("*");

        // Apply user scoping - only return data owned by the endpoint creator
        query = query.eq("user_id", endpoint.user_id);

        if (resourceId) {
          query = query.eq("id", resourceId).single();
        } else {
          // Pagination
          const page = parseInt(url.searchParams.get("page") || "1");
          const limit = Math.min(
            parseInt(url.searchParams.get("limit") || String(endpoint.pagination_config?.default_limit || 25)),
            endpoint.pagination_config?.max_limit || 100
          );
          const offset = (page - 1) * limit;
          query = query.range(offset, offset + limit - 1);

          // Ordering
          const orderBy = url.searchParams.get("order_by") || "created_at";
          const orderDir = url.searchParams.get("order_dir") === "asc" ? true : false;
          query = query.order(orderBy, { ascending: orderDir });
        }

        const { data, error } = await query;
        if (error) throw error;

        result = resourceId ? stripFields(data, hiddenFields) : (data || []).map((r: any) => stripFields(r, hiddenFields));
        break;
      }

      case "POST": {
        const body = await req.json();
        // Force user_id to endpoint owner
        body.user_id = endpoint.user_id;
        const { data, error } = await supabaseAdmin.from(table).insert(body).select().single();
        if (error) throw error;
        result = stripFields(data, hiddenFields);
        statusCode = 201;

        if (endpoint.webhook_url) {
          fireWebhook(endpoint.webhook_url, "create", result);
        }
        break;
      }

      case "PUT": {
        if (!resourceId) {
          return jsonResponse(400, { error: "Resource ID required for PUT" });
        }
        const body = await req.json();
        delete body.id;
        delete body.user_id;
        delete body.created_at;

        const { data, error } = await supabaseAdmin
          .from(table)
          .update(body)
          .eq("id", resourceId)
          .eq("user_id", endpoint.user_id)
          .select()
          .single();
        if (error) throw error;
        result = stripFields(data, hiddenFields);

        if (endpoint.webhook_url) {
          fireWebhook(endpoint.webhook_url, "update", result);
        }
        break;
      }

      case "DELETE": {
        if (!resourceId) {
          return jsonResponse(400, { error: "Resource ID required for DELETE" });
        }
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq("id", resourceId)
          .eq("user_id", endpoint.user_id);
        if (error) throw error;
        result = { deleted: true, id: resourceId };

        if (endpoint.webhook_url) {
          fireWebhook(endpoint.webhook_url, "delete", { id: resourceId });
        }
        break;
      }
    }

    const responseTime = Date.now() - startTime;

    // Log the request (fire and forget)
    supabaseAdmin.from("api_endpoint_logs").insert({
      endpoint_id: endpoint.id,
      method: req.method,
      path: fullPath,
      status_code: statusCode,
      response_time_ms: responseTime,
    }).then(() => {});

    return jsonResponse(statusCode, {
      data: result,
      meta: {
        endpoint: endpoint.name,
        response_time_ms: responseTime,
      },
    });
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    console.error("API Gateway error:", err);
    return jsonResponse(500, {
      error: err.message || "Internal server error",
      meta: { response_time_ms: responseTime },
    });
  }
});

function jsonResponse(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stripFields(record: any, fields: string[]) {
  if (!record || !fields.length) return record;
  const copy = { ...record };
  for (const f of fields) delete copy[f];
  return copy;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fireWebhook(url: string, event: string, payload: any) {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
  }).catch((err) => console.warn("Webhook failed:", err.message));
}
