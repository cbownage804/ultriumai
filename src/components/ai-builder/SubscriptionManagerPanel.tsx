import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard, Plus, Star, Trash2, Code, Copy } from 'lucide-react';
import type { SubscriptionPlan } from '@/hooks/useSubscriptionManager';

interface Props {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
  getActivePlan: () => SubscriptionPlan | null;
  stats: { active: number; trialing: number; churned: number; mrr: number; total: number };
  createPlan: (name: string, price: number, interval: 'monthly' | 'yearly') => SubscriptionPlan;
  updatePlan: (id: string, updates: Partial<SubscriptionPlan>) => void;
  removePlan: (id: string) => void;
  addFeature: (planId: string, feature: string) => void;
  removeFeature: (planId: string, index: number) => void;
  generatePricingPage: () => string;
  generateWebhookHandler: () => string;
  onInsertCode: (code: string) => void;
}

export function SubscriptionManagerPanel({ open, onClose, plans, activePlanId, setActivePlanId, getActivePlan, stats, createPlan, updatePlan, removePlan, addFeature, removeFeature, generatePricingPage, generateWebhookHandler, onInsertCode }: Props) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const active = getActivePlan();

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#0d0d0f] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-emerald-400" /> Subscription Manager</DialogTitle></DialogHeader>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Active</p><p className="text-lg font-bold text-emerald-400">{stats.active}</p></div>
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Trialing</p><p className="text-lg font-bold text-blue-400">{stats.trialing}</p></div>
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">Churned</p><p className="text-lg font-bold text-red-400">{stats.churned}</p></div>
          <div className="bg-white/5 rounded p-2 text-center"><p className="text-[10px] text-white/40">MRR</p><p className="text-lg font-bold text-amber-400">${(stats.mrr / 100).toFixed(0)}</p></div>
        </div>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Plan name" value={newName} onChange={e => setNewName(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <Input placeholder="Price (cents)" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs w-28" />
          <Button size="sm" variant="outline" className="border-white/10 text-white h-8 text-xs" onClick={() => { if (newName && newPrice) { createPlan(newName, parseInt(newPrice), 'monthly'); setNewName(''); setNewPrice(''); } }}><Plus className="h-3 w-3 mr-1" />Add</Button>
        </div>
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {plans.map(plan => (
              <div key={plan.id} className={`p-3 rounded-lg border cursor-pointer ${plan.id === activePlanId ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'}`} onClick={() => setActivePlanId(plan.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{plan.name}</span>
                    {plan.isPopular && <Badge variant="secondary" className="text-[9px] h-4 bg-blue-500/20 text-blue-400">Popular</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-emerald-400">${(plan.price / 100).toFixed(2)}/{plan.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); removePlan(plan.id); }}><Trash2 className="h-3 w-3 text-red-400" /></Button>
                  </div>
                </div>
                {plan.features.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">{plan.features.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-[9px] border-white/10 text-white/50 cursor-pointer" onClick={e => { e.stopPropagation(); removeFeature(plan.id, i); }}>✓ {f}</Badge>
                  ))}</div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        {active && (
          <div className="flex gap-2 mt-2">
            <Input placeholder="Add feature..." value={newFeature} onChange={e => setNewFeature(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" onKeyDown={e => { if (e.key === 'Enter' && newFeature) { addFeature(active.id, newFeature); setNewFeature(''); } }} />
            <Button size="sm" variant="ghost" className="h-8 text-xs text-white/50" onClick={() => updatePlan(active.id, { isPopular: !active.isPopular })}><Star className="h-3 w-3 mr-1" />{active.isPopular ? 'Unstar' : 'Popular'}</Button>
          </div>
        )}
        <div className="flex gap-2 mt-2 border-t border-white/10 pt-3">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generatePricingPage())}><Code className="h-3 w-3 mr-1" />Pricing Page</Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateWebhookHandler())}><Code className="h-3 w-3 mr-1" />Webhook Handler</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
