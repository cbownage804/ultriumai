import { useState, useCallback } from 'react';

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  priceAmount: number;
  currency: string;
  recurring: 'one_time' | 'monthly' | 'yearly';
  isActive: boolean;
}

export interface PaymentConfig {
  provider: 'stripe' | 'lemonsqueezy' | 'paddle';
  publishableKey: string;
  webhookEndpoint: string;
  enableSubscriptions: boolean;
  enableOneTime: boolean;
  successUrl: string;
  cancelUrl: string;
}

export function usePaymentIntegration() {
  const [products, setProducts] = useState<PaymentProduct[]>([]);
  const [config, setConfig] = useState<PaymentConfig>({
    provider: 'stripe', publishableKey: '', webhookEndpoint: '/api/webhooks/stripe',
    enableSubscriptions: true, enableOneTime: true, successUrl: '/success', cancelUrl: '/cancel',
  });

  const addProduct = useCallback((name: string, price: number, recurring: PaymentProduct['recurring']) => {
    const product: PaymentProduct = {
      id: crypto.randomUUID(), name, description: '', priceAmount: price,
      currency: 'usd', recurring, isActive: true,
    };
    setProducts(prev => [...prev, product]);
  }, []);

  const updateProduct = useCallback((id: string, update: Partial<PaymentProduct>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const generateCheckoutCode = useCallback((): string => {
    if (config.provider !== 'stripe') return '// Only Stripe checkout is currently supported';
    return `import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });

Deno.serve(async (req) => {
  const { priceId, mode } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: mode || 'payment',
    success_url: '${config.successUrl}?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: '${config.cancelUrl}',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});`;
  }, [config]);

  const generateWebhookCode = useCallback((): string => {
    return `import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful payment
      break;
    case 'customer.subscription.updated':
      // Handle subscription change
      break;
    case 'customer.subscription.deleted':
      // Handle cancellation
      break;
  }

  return new Response(JSON.stringify({ received: true }));
});`;
  }, []);

  const generatePricingComponent = useCallback((): string => {
    const activeProducts = products.filter(p => p.isActive);
    return `export function PricingTable() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', padding: '2rem' }}>
${activeProducts.map(p => `      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>${p.name}</h3>
        <p style={{ fontSize: '2rem', fontWeight: 700, margin: '1rem 0' }}>$${(p.priceAmount / 100).toFixed(2)}${p.recurring !== 'one_time' ? `/${p.recurring === 'monthly' ? 'mo' : 'yr'}` : ''}</p>
        <p style={{ color: '#6b7280' }}>${p.description || 'Get started today'}</p>
        <button style={{ marginTop: '1.5rem', padding: '0.75rem 2rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
          ${p.recurring === 'one_time' ? 'Buy Now' : 'Subscribe'}
        </button>
      </div>`).join('\n')}
    </div>
  );
}`;
  }, [products]);

  return {
    products, config, setConfig, addProduct, updateProduct, removeProduct,
    generateCheckoutCode, generateWebhookCode, generatePricingComponent,
  };
}
