import { X, Plus, Trash2, CreditCard, Code, Webhook } from 'lucide-react';
import type { PaymentProduct, PaymentConfig } from '@/hooks/usePaymentIntegration';
import { cn } from '@/lib/utils';

interface PaymentPanelProps {
  open: boolean;
  onClose: () => void;
  products: PaymentProduct[];
  config: PaymentConfig;
  onSetConfig: (update: PaymentConfig) => void;
  onAddProduct: (name: string, price: number, recurring: PaymentProduct['recurring']) => void;
  onUpdateProduct: (id: string, update: Partial<PaymentProduct>) => void;
  onRemoveProduct: (id: string) => void;
  onGenerateCheckout: () => string;
  onGenerateWebhook: () => string;
  onGeneratePricing: () => string;
  onInsertCode: (code: string) => void;
}

export function PaymentPanel({ open, onClose, products, config, onSetConfig, onAddProduct, onUpdateProduct, onRemoveProduct, onGenerateCheckout, onGenerateWebhook, onGeneratePricing, onInsertCode }: PaymentPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[750px] max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-white">Payment Integration</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Config */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Provider</label>
              <select value={config.provider} onChange={e => onSetConfig({ ...config, provider: e.target.value as any })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70">
                <option value="stripe">Stripe</option>
                <option value="lemonsqueezy">LemonSqueezy</option>
                <option value="paddle">Paddle</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Publishable Key</label>
              <input value={config.publishableKey} onChange={e => onSetConfig({ ...config, publishableKey: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70 font-mono" placeholder="pk_..." />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Success URL</label>
              <input value={config.successUrl} onChange={e => onSetConfig({ ...config, successUrl: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Cancel URL</label>
              <input value={config.cancelUrl} onChange={e => onSetConfig({ ...config, cancelUrl: e.target.value })} className="w-full h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
            </div>
          </div>

          {/* Products */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-white/60">Products</h3>
              <button onClick={() => onAddProduct('New Product', 999, 'one_time')} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"><Plus className="h-3 w-3" />Add</button>
            </div>
            {products.map(p => (
              <div key={p.id} className="bg-black/30 rounded-lg border border-white/[0.06] p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={p.name} onChange={e => onUpdateProduct(p.id, { name: e.target.value })} className="flex-1 h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70" />
                  <input type="number" value={p.priceAmount} onChange={e => onUpdateProduct(p.id, { priceAmount: Number(e.target.value) })} className="w-24 h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-xs text-white/70 font-mono" />
                  <select value={p.recurring} onChange={e => onUpdateProduct(p.id, { recurring: e.target.value as any })} className="h-7 px-2 bg-black/30 border border-white/[0.06] rounded text-[10px] text-white/60">
                    <option value="one_time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <button onClick={() => onRemoveProduct(p.id)} className="text-white/20 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">${(p.priceAmount / 100).toFixed(2)} {p.currency.toUpperCase()}</span>
                  <label className="flex items-center gap-1 text-[10px] text-white/30">
                    <input type="checkbox" checked={p.isActive} onChange={e => onUpdateProduct(p.id, { isActive: e.target.checked })} className="h-3 w-3" /> Active
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Generate */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
            <button onClick={() => onInsertCode(onGenerateCheckout())} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded text-[11px] hover:bg-amber-500/30">
              <Code className="h-3 w-3" /> Checkout API
            </button>
            <button onClick={() => onInsertCode(onGenerateWebhook())} className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded text-[11px] hover:bg-violet-500/30">
              <Webhook className="h-3 w-3" /> Webhook Handler
            </button>
            <button onClick={() => onInsertCode(onGeneratePricing())} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded text-[11px] hover:bg-emerald-500/30">
              <CreditCard className="h-3 w-3" /> Pricing Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
