import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(() => new Response(JSON.stringify({ success: true }), { 
  status: 200, 
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } 
}));