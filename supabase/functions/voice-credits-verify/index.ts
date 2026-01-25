import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find recent successful checkout sessions for this user
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    let creditsAdded = 0;

    for (const session of sessions.data) {
      // Only process completed voice credit purchases
      if (
        session.payment_status !== 'paid' ||
        session.metadata?.product_type !== 'voice_credits' ||
        session.metadata?.user_id !== user.id
      ) {
        continue;
      }

      // Check if this session was already processed
      const { data: existing } = await supabaseClient
        .from('voice_credit_purchases')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existing) {
        continue; // Already processed
      }

      const minutes = parseInt(session.metadata.minutes || '0');
      const priceCents = parseInt(session.metadata.price_cents || '0');

      if (minutes > 0) {
        // Insert the credit purchase
        const { error: insertError } = await supabaseClient
          .from('voice_credit_purchases')
          .insert({
            user_id: user.id,
            minutes_purchased: minutes,
            minutes_remaining: minutes,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            price_paid_cents: priceCents,
          });

        if (insertError) {
          console.error('Error inserting credit purchase:', insertError);
        } else {
          creditsAdded += minutes;
        }
      }
    }

    // Get total remaining purchased credits
    const { data: purchases } = await supabaseClient
      .from('voice_credit_purchases')
      .select('minutes_remaining')
      .eq('user_id', user.id)
      .gt('minutes_remaining', 0);

    const totalPurchased = purchases?.reduce((sum, p) => sum + p.minutes_remaining, 0) || 0;

    return new Response(JSON.stringify({ 
      success: true, 
      creditsAdded,
      totalPurchasedRemaining: totalPurchased
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Voice credits verify error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
