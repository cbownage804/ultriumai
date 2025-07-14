import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-ONE-TIME-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role for updates
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID provided", { sessionId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      sessionId, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email 
    });

    // Verify the session belongs to the authenticated user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to authenticated user");
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Update the payment record in the database
    const { data: paymentData, error: updateError } = await supabaseService
      .from("one_time_payments")
      .update({ 
        status: "completed",
        stripe_payment_intent_id: session.payment_intent,
        completed_at: new Date().toISOString(),
      })
      .eq("stripe_session_id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      logStep("Error updating payment record", { error: updateError });
      throw new Error("Failed to update payment record");
    }

    logStep("Payment record updated", { paymentId: paymentData.id });

    // Optionally trigger any post-payment actions based on metadata
    const metadata = paymentData.metadata as any;
    if (metadata?.plan_id) {
      logStep("Processing plan setup", { planId: metadata.plan_id });
      // Here you could trigger additional setup actions
      // For example, creating team workspaces, sending welcome emails, etc.
    }

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: paymentData.id,
        amount: paymentData.amount,
        productName: paymentData.product_name,
        status: paymentData.status,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-one-time-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});