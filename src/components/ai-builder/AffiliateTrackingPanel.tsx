import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Trash2, Code, Link } from 'lucide-react';
import type { Affiliate, Referral } from '@/hooks/useAffiliateTracking';

interface Props {
  open: boolean;
  onClose: () => void;
  affiliates: Affiliate[];
  referrals: Referral[];
  activeAffiliateId: string | null;
  setActiveAffiliateId: (id: string | null) => void;
  getActiveAffiliate: () => Affiliate | null;
  defaultCommission: number;
  setDefaultCommission: (v: number) => void;
  stats: { totalAffiliates: number; activeAffiliates: number; totalReferrals: number; totalRevenue: number; totalCommissions: number; pendingPayouts: number };
  createAffiliate: (name: string, email: string) => Affiliate;
  updateAffiliate: (id: string, updates: Partial<Affiliate>) => void;
  removeAffiliate: (id: string) => void;
  addReferral: (affiliateId: string, customerEmail: string, amount: number) => void;
  generateTrackingScript: () => string;
  generateAffiliateDashboard: () => string;
  onInsertCode: (code: string) => void;
}

export function AffiliateTrackingPanel({ open, onClose, affiliates, referrals, activeAffiliateId, setActiveAffiliateId, getActiveAffiliate, defaultCommission, setDefaultCommission, stats, createAffiliate, updateAffiliate, removeAffiliate, addReferral, generateTrackingScript, generateAffiliateDashboard, onInsertCode }: Props) {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const active = getActiveAffiliate();
  const activeReferrals = referrals.filter(r => r.affiliateId === activeAffiliateId);
  const fmt = (c: number) => '$' + (c / 100).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#0d0d0f] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-400" /> Affiliate Tracking</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Affiliates</p><p className="text-lg font-bold">{stats.totalAffiliates}</p></div>
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Revenue</p><p className="text-lg font-bold text-emerald-400">{fmt(stats.totalRevenue)}</p></div>
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Commissions</p><p className="text-lg font-bold text-amber-400">{fmt(stats.totalCommissions)}</p></div>
        </div>
        <div className="flex gap-2 mb-3 items-center">
          <Input placeholder="Affiliate name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <div className="flex items-center gap-1 shrink-0"><span className="text-[10px] text-white/40">Rate:</span><Input type="number" value={defaultCommission} onChange={e => setDefaultCommission(parseInt(e.target.value) || 0)} className="bg-white/5 border-white/10 text-white h-8 text-xs w-14" /><span className="text-[10px] text-white/40">%</span></div>
          <Button size="sm" variant="outline" className="border-white/10 text-white h-8 text-xs shrink-0" onClick={() => { if (newName) { createAffiliate(newName, newEmail); setNewName(''); setNewEmail(''); } }}><Plus className="h-3 w-3 mr-1" />Add</Button>
        </div>
        <div className="grid grid-cols-[220px_1fr] gap-3">
          <ScrollArea className="h-[250px]">
            <div className="space-y-1">
              {affiliates.map(aff => (
                <div key={aff.id} className={`p-2 rounded cursor-pointer text-xs ${aff.id === activeAffiliateId ? 'bg-violet-500/10 border border-violet-500/30' : 'hover:bg-white/5'}`} onClick={() => setActiveAffiliateId(aff.id)}>
                  <div className="flex justify-between"><span className="font-medium">{aff.name}</span><Badge variant="outline" className={`text-[9px] ${aff.status === 'active' ? 'text-emerald-400 border-emerald-400/30' : 'text-white/30 border-white/10'}`}>{aff.status}</Badge></div>
                  <p className="text-white/30 font-mono text-[10px] mt-0.5">{aff.code}</p>
                  <div className="flex justify-between mt-1 text-white/40"><span>{aff.totalReferrals} refs</span><span>{fmt(aff.totalEarnings)}</span></div>
                </div>
              ))}
            </div>
          </ScrollArea>
          {active ? (
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2"><Link className="h-3 w-3 text-white/40" /><span className="text-xs text-white/50">Referral Link</span></div>
                <code className="text-xs bg-black/30 px-2 py-1 rounded block font-mono">?ref={active.code}</code>
              </div>
              <div className="flex gap-2">
                <Input type="number" value={active.commissionRate} onChange={e => updateAffiliate(active.id, { commissionRate: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white h-7 text-xs w-20" />
                <span className="text-xs text-white/40 self-center">% commission</span>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 ml-auto" onClick={() => removeAffiliate(active.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="border border-white/10 rounded">
                <p className="text-[10px] text-white/40 p-2 border-b border-white/10">Recent Referrals</p>
                {activeReferrals.length === 0 ? (
                  <p className="text-[10px] text-white/20 p-3 text-center">No referrals yet</p>
                ) : (
                  <div className="max-h-[120px] overflow-auto">{activeReferrals.map(r => (
                    <div key={r.id} className="flex justify-between p-2 text-[10px] border-b border-white/5">
                      <span>{r.customerEmail}</span><span className="text-emerald-400">{fmt(r.commission)}</span><Badge variant="outline" className="text-[9px] h-4">{r.status}</Badge>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          ) : <div className="flex items-center justify-center text-white/20 text-xs">Select an affiliate</div>}
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateTrackingScript())}><Code className="h-3 w-3 mr-1" />Tracking Script</Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateAffiliateDashboard())}><Code className="h-3 w-3 mr-1" />Dashboard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
