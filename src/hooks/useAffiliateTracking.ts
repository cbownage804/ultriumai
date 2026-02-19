import { useState, useCallback } from 'react';

export interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commissionRate: number; // percentage
  totalReferrals: number;
  totalEarnings: number; // cents
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
}

export interface Referral {
  id: string;
  affiliateId: string;
  customerEmail: string;
  amount: number; // cents
  commission: number; // cents
  status: 'pending' | 'converted' | 'paid';
  createdAt: string;
}

export function useAffiliateTracking() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [activeAffiliateId, setActiveAffiliateId] = useState<string | null>(null);
  const [defaultCommission, setDefaultCommission] = useState(10);

  const createAffiliate = useCallback((name: string, email: string) => {
    const code = name.toLowerCase().replace(/\s+/g, '-').slice(0, 10) + '-' + Math.random().toString(36).slice(2, 6);
    const aff: Affiliate = {
      id: crypto.randomUUID(), name, email, code,
      commissionRate: defaultCommission, totalReferrals: 0, totalEarnings: 0,
      status: 'active', createdAt: new Date().toISOString(),
    };
    setAffiliates(prev => [...prev, aff]);
    return aff;
  }, [defaultCommission]);

  const updateAffiliate = useCallback((id: string, updates: Partial<Affiliate>) => {
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const removeAffiliate = useCallback((id: string) => {
    setAffiliates(prev => prev.filter(a => a.id !== id));
  }, []);

  const addReferral = useCallback((affiliateId: string, customerEmail: string, amount: number) => {
    const aff = affiliates.find(a => a.id === affiliateId);
    if (!aff) return;
    const commission = Math.round(amount * aff.commissionRate / 100);
    const ref: Referral = {
      id: crypto.randomUUID(), affiliateId, customerEmail,
      amount, commission, status: 'pending', createdAt: new Date().toISOString(),
    };
    setReferrals(prev => [...prev, ref]);
    setAffiliates(prev => prev.map(a => a.id === affiliateId ? {
      ...a, totalReferrals: a.totalReferrals + 1, totalEarnings: a.totalEarnings + commission,
    } : a));
  }, [affiliates]);

  const getActiveAffiliate = useCallback(() => affiliates.find(a => a.id === activeAffiliateId) || null, [affiliates, activeAffiliateId]);

  const getStats = useCallback(() => {
    const totalAffiliates = affiliates.length;
    const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
    const totalReferrals = referrals.length;
    const totalRevenue = referrals.reduce((s, r) => s + r.amount, 0);
    const totalCommissions = referrals.reduce((s, r) => s + r.commission, 0);
    const pendingPayouts = referrals.filter(r => r.status === 'converted').reduce((s, r) => s + r.commission, 0);
    return { totalAffiliates, activeAffiliates, totalReferrals, totalRevenue, totalCommissions, pendingPayouts };
  }, [affiliates, referrals]);

  const generateTrackingScript = useCallback(() => {
    return `// Affiliate Tracking Script
(function() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref') || params.get('via');
  if (ref) {
    document.cookie = 'affiliate_ref=' + ref + '; max-age=' + (30 * 86400) + '; path=/; SameSite=Lax';
    console.log('[Affiliate] Tracking referral:', ref);
  }
})();

export function getAffiliateRef(): string | null {
  const match = document.cookie.match(/affiliate_ref=([^;]+)/);
  return match ? match[1] : null;
}

export async function trackConversion(amount: number) {
  const ref = getAffiliateRef();
  if (!ref) return;
  await fetch('/api/affiliate/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: ref, amount }),
  });
}`;
  }, []);

  const generateAffiliateDashboard = useCallback(() => {
    return `import React from 'react';

export function AffiliateDashboard({ affiliate, referrals }: { affiliate: any; referrals: any[] }) {
  const fmt = (c: number) => '$' + (c / 100).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold mb-6">Affiliate Dashboard</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4"><p className="text-sm text-gray-500">Your Code</p><p className="text-xl font-mono font-bold">{affiliate.code}</p></div>
        <div className="border rounded-lg p-4"><p className="text-sm text-gray-500">Total Referrals</p><p className="text-xl font-bold">{affiliate.totalReferrals}</p></div>
        <div className="border rounded-lg p-4"><p className="text-sm text-gray-500">Total Earnings</p><p className="text-xl font-bold">{fmt(affiliate.totalEarnings)}</p></div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm">Share this link: <code className="bg-white px-2 py-1 rounded">{window.location.origin}?ref={affiliate.code}</code></p>
      </div>
      <h3 className="font-semibold mb-3">Recent Referrals</h3>
      <table className="w-full"><thead><tr className="border-b text-left"><th className="py-2">Customer</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
      <tbody>{referrals.map(r => (
        <tr key={r.id} className="border-b"><td className="py-2">{r.customerEmail}</td><td>{fmt(r.amount)}</td><td>{fmt(r.commission)}</td><td>{r.status}</td></tr>
      ))}</tbody></table>
    </div>
  );
}`;
  }, []);

  return {
    affiliates, referrals, activeAffiliateId, setActiveAffiliateId, getActiveAffiliate,
    defaultCommission, setDefaultCommission, getStats,
    createAffiliate, updateAffiliate, removeAffiliate, addReferral,
    generateTrackingScript, generateAffiliateDashboard,
  };
}
