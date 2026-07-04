// One-off admin utility: archive all active Stripe products except Wrayth's.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Keep only these Wrayth products active.
const KEEP_PRODUCT_IDS = new Set([
  "prod_TnSxL9TgGCz1jI", // Wrayth Pro
  "prod_TnSxu5PsRCLf38", // Wrayth Business
  "prod_TsQkzLTz3wBSa2", // Wrayth Enterprise
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const archivedProducts: string[] = [];
    const deactivatedPrices: string[] = [];
    const skipped: string[] = [];
    const errors: { id: string; error: string }[] = [];

    // Iterate all active products
    for await (const product of stripe.products.list({ active: true, limit: 100 })) {
      if (KEEP_PRODUCT_IDS.has(product.id)) {
        skipped.push(product.id);
        continue;
      }
      try {
        // Deactivate all active prices for this product first
        for await (const price of stripe.prices.list({ product: product.id, active: true, limit: 100 })) {
          try {
            await stripe.prices.update(price.id, { active: false });
            deactivatedPrices.push(price.id);
          } catch (e) {
            errors.push({ id: price.id, error: (e as Error).message });
          }
        }
        // Archive the product
        await stripe.products.update(product.id, { active: false });
        archivedProducts.push(product.id);
      } catch (e) {
        errors.push({ id: product.id, error: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        kept: [...KEEP_PRODUCT_IDS],
        skipped,
        archivedCount: archivedProducts.length,
        archivedProducts,
        deactivatedPricesCount: deactivatedPrices.length,
        errors,
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
