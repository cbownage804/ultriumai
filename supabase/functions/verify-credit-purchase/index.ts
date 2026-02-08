import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CREDIT-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Use service role key to update credits
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");
    logStep("Session ID provided", { sessionId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      metadata: session.metadata 
    });

    // Verify the session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to authenticated user");
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Get credits from metadata
    const creditsToAdd = parseInt(session.metadata?.credits || "0");
    if (creditsToAdd <= 0) {
      throw new Error("Invalid credits amount in session metadata");
    }

    logStep("Payment verified, adding bonus credits", { creditsToAdd });

    // Get current bonus credits
    const { data: currentCredits, error: fetchError } = await supabaseClient
      .from('user_credits')
      .select('bonus_credits')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      logStep("Error fetching current credits", { error: fetchError });
      throw new Error("Failed to fetch current credits");
    }

    // Add to bonus_credits (purchased credits that never expire)
    const newBonusCredits = (currentCredits.bonus_credits || 0) + creditsToAdd;
    
    const { error: updateError } = await supabaseClient
      .from('user_credits')
      .update({ 
        bonus_credits: newBonusCredits,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      logStep("Error updating credits", { error: updateError });
      throw new Error("Failed to update credits");
    }

    // Log the purchase in credit_history
    try {
      await supabaseClient
        .from('credit_history')
        .insert({
          user_id: user.id,
          credits_amount: creditsToAdd,
          action_type: 'purchase',
          description: `Purchased ${creditsToAdd} bonus credits`
        });
    } catch (historyError) {
      logStep("Warning: Failed to log credit history", { error: historyError });
    }

    logStep("Bonus credits successfully added", { 
      userId: user.id, 
      creditsAdded: creditsToAdd,
      newBonusCredits
    });

    return new Response(JSON.stringify({ 
      success: true, 
      creditsAdded: creditsToAdd,
      newBonusCredits
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-credit-purchase", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
