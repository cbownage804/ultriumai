import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Trash2, Code } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/hooks/useInvoiceGenerator';

interface Props {
  open: boolean;
  onClose: () => void;
  invoices: Invoice[];
  activeInvoiceId: string | null;
  setActiveInvoiceId: (id: string | null) => void;
  getActiveInvoice: () => Invoice | null;
  createInvoice: (name: string, email: string) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  addItem: (invoiceId: string, item: InvoiceItem) => void;
  removeItem: (invoiceId: string, index: number) => void;
  calculateTotal: (invoice: Invoice) => { subtotal: number; tax: number; total: number };
  generateInvoiceComponent: () => string;
  generatePDFExport: () => string;
  onInsertCode: (code: string) => void;
}

export function InvoiceGeneratorPanel({ open, onClose, invoices, activeInvoiceId, setActiveInvoiceId, getActiveInvoice, createInvoice, updateInvoice, removeInvoice, addItem, removeItem, calculateTotal, generateInvoiceComponent, generatePDFExport, onInsertCode }: Props) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const active = getActiveInvoice();
  const totals = active ? calculateTotal(active) : null;

  const statusColor: Record<string, string> = { draft: 'text-white/40', sent: 'text-blue-400', paid: 'text-emerald-400', overdue: 'text-red-400', void: 'text-white/20' };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#0d0d0f] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-400" /> Invoice Generator</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Client name" value={clientName} onChange={e => setClientName(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <Input placeholder="Email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
          <Button size="sm" variant="outline" className="border-white/10 text-white h-8 text-xs shrink-0" onClick={() => { if (clientName) { createInvoice(clientName, clientEmail); setClientName(''); setClientEmail(''); } }}><Plus className="h-3 w-3 mr-1" />Create</Button>
        </div>
        <div className="grid grid-cols-[200px_1fr] gap-3">
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {invoices.map(inv => (
                <div key={inv.id} className={`p-2 rounded cursor-pointer text-xs ${inv.id === activeInvoiceId ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-white/5'}`} onClick={() => setActiveInvoiceId(inv.id)}>
                  <div className="flex justify-between items-center">
                    <span className="font-mono">{inv.number}</span>
                    <span className={statusColor[inv.status]}>{inv.status}</span>
                  </div>
                  <p className="text-white/40 truncate">{inv.clientName}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          {active ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select value={active.status} onChange={e => updateInvoice(active.id, { status: e.target.value as Invoice['status'] })} className="bg-white/5 border border-white/10 rounded px-2 h-8 text-xs text-white">
                  {['draft', 'sent', 'paid', 'overdue', 'void'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Input type="number" placeholder="Tax %" value={active.taxRate} onChange={e => updateInvoice(active.id, { taxRate: parseFloat(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white h-8 text-xs w-20" />
                <Button size="sm" variant="ghost" className="h-8 text-xs text-red-400 ml-auto" onClick={() => removeInvoice(active.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
              <div className="border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead><tr className="bg-white/5"><th className="text-left p-2">Item</th><th className="p-2 w-16">Qty</th><th className="p-2 w-20">Price</th><th className="p-2 w-20">Total</th><th className="p-2 w-8"></th></tr></thead>
                  <tbody>
                    {active.items.map((it, i) => (
                      <tr key={i} className="border-t border-white/5"><td className="p-2">{it.description}</td><td className="p-2 text-center">{it.quantity}</td><td className="p-2 text-right">${(it.unitPrice / 100).toFixed(2)}</td><td className="p-2 text-right">${((it.quantity * it.unitPrice) / 100).toFixed(2)}</td><td className="p-2"><button onClick={() => removeItem(active.id, i)} className="text-red-400 hover:text-red-300">×</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Description" value={itemDesc} onChange={e => setItemDesc(e.target.value)} className="bg-white/5 border-white/10 text-white h-7 text-xs" />
                <Input placeholder="Qty" value={itemQty} onChange={e => setItemQty(e.target.value)} className="bg-white/5 border-white/10 text-white h-7 text-xs w-16" />
                <Input placeholder="Price ¢" value={itemPrice} onChange={e => setItemPrice(e.target.value)} className="bg-white/5 border-white/10 text-white h-7 text-xs w-20" />
                <Button size="sm" variant="outline" className="border-white/10 text-white h-7 text-[10px]" onClick={() => { if (itemDesc && itemPrice) { addItem(active.id, { description: itemDesc, quantity: parseInt(itemQty) || 1, unitPrice: parseInt(itemPrice) }); setItemDesc(''); setItemPrice(''); } }}><Plus className="h-3 w-3" /></Button>
              </div>
              {totals && (
                <div className="text-right text-xs space-y-1 border-t border-white/10 pt-2">
                  <div className="flex justify-end gap-8"><span className="text-white/40">Subtotal</span><span>${(totals.subtotal / 100).toFixed(2)}</span></div>
                  {active.taxRate > 0 && <div className="flex justify-end gap-8"><span className="text-white/40">Tax ({active.taxRate}%)</span><span>${(totals.tax / 100).toFixed(2)}</span></div>}
                  <div className="flex justify-end gap-8 font-bold"><span>Total</span><span className="text-emerald-400">${(totals.total / 100).toFixed(2)}</span></div>
                </div>
              )}
            </div>
          ) : <div className="flex items-center justify-center text-white/20 text-xs">Select or create an invoice</div>}
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateInvoiceComponent())}><Code className="h-3 w-3 mr-1" />Invoice Component</Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generatePDFExport())}><Code className="h-3 w-3 mr-1" />PDF Export</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
