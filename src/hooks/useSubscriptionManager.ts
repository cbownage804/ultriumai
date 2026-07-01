import { useState, useCallback } from 'react';

import { devLog } from '@/lib/logger';
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // cents/mo
  interval: 'monthly' | 'yearly';
  features: string[];
  isPopular: boolean;
  trialDays: number;
  stripePriceId: string;
}

export interface Subscriber {
  id: string;
  email: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  startedAt: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function useSubscriptionManager() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const createPlan = useCallback((name: string, price: number, interval: 'monthly' | 'yearly') => {
    const plan: SubscriptionPlan = {
      id: crypto.randomUUID(),
      name,
      price,
      interval,
      features: [],
      isPopular: false,
      trialDays: 0,
      stripePriceId: '',
    };
    setPlans(prev => [...prev, plan]);
    return plan;
  }, []);

  const updatePlan = useCallback((id: string, updates: Partial<SubscriptionPlan>) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  const addFeature = useCallback((planId: string, feature: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: [...p.features, feature] } : p));
  }, []);

  const removeFeature = useCallback((planId: string, index: number) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, features: p.features.filter((_, i) => i !== index) } : p));
  }, []);

  const getActivePlan = useCallback(() => plans.find(p => p.id === activePlanId) || null, [plans, activePlanId]);

  const getStats = useCallback(() => {
    const active = subscribers.filter(s => s.status === 'active').length;
    const trialing = subscribers.filter(s => s.status === 'trialing').length;
    const churned = subscribers.filter(s => s.status === 'canceled').length;
    const mrr = subscribers.filter(s => s.status === 'active').reduce((sum, s) => {
      const plan = plans.find(p => p.id === s.planId);
      return sum + (plan ? plan.price : 0);
    }, 0);
    return { active, trialing, churned, mrr, total: subscribers.length };
  }, [subscribers, plans]);

  const generatePricingPage = useCallback(() => {
    return `import React, { useState } from 'react';

const plans = ${JSON.stringify(plans.map(p => ({ name: p.name, price: p.price, interval: p.interval, features: p.features, isPopular: p.isPopular, stripePriceId: p.stripePriceId })), null, 2)};

export function PricingPage() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const filtered = plans.filter(p => p.interval === interval);

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
      <div className="flex justify-center gap-2 mb-8">
        <button onClick={() => setInterval('monthly')} className={interval === 'monthly' ? 'font-bold' : ''}>Monthly</button>
        <button onClick={() => setInterval('yearly')} className={interval === 'yearly' ? 'font-bold' : ''}>Yearly</button>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {filtered.map(plan => (
          <div key={plan.name} className={\`border rounded-xl p-6 \${plan.isPopular ? 'border-blue-500 shadow-lg' : ''}\`}>
            {plan.isPopular && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Popular</span>}
            <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
            <p className="text-3xl font-bold my-4">\$\{(plan.price / 100).toFixed(2)}<span className="text-sm font-normal">/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span></p>
            <ul className="space-y-2 mb-6">{plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}</ul>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">Get Started</button>
          </div>
        ))}
      </div>
    </div>
  );
}`;
  }, [plans]);

  const generateWebhookHandler = useCallback(() => {
    return `// Stripe Webhook Handler for Subscription Events
import Stripe from 'stripe';

export async function handleSubscriptionWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      // Update subscriber status in database
      devLog.log('Subscription updated:', sub.id, sub.status);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      devLog.log('Subscription canceled:', sub.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      devLog.log('Payment failed for:', invoice.customer);
      break;
    }
  }
}`;
  }, []);

  return {
    plans, subscribers, activePlanId, setActivePlanId, getActivePlan, getStats,
    createPlan, updatePlan, removePlan, addFeature, removeFeature,
    generatePricingPage, generateWebhookHandler,
  };
}
