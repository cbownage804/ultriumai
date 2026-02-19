import { useState, useCallback } from 'react';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // cents
}

export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  issuedAt: string;
  dueAt: string;
  notes: string;
  taxRate: number; // percentage
  currency: string;
}

export function useInvoiceGenerator() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [nextNumber, setNextNumber] = useState(1001);

  const createInvoice = useCallback((clientName: string, clientEmail: string) => {
    const inv: Invoice = {
      id: crypto.randomUUID(),
      number: `INV-${nextNumber}`,
      clientName,
      clientEmail,
      items: [],
      status: 'draft',
      issuedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: '',
      taxRate: 0,
      currency: 'USD',
    };
    setInvoices(prev => [...prev, inv]);
    setNextNumber(prev => prev + 1);
    setActiveInvoiceId(inv.id);
    return inv;
  }, [nextNumber]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const removeInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  }, []);

  const addItem = useCallback((invoiceId: string, item: InvoiceItem) => {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, items: [...i.items, item] } : i));
  }, []);

  const removeItem = useCallback((invoiceId: string, index: number) => {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, items: i.items.filter((_, idx) => idx !== index) } : i));
  }, []);

  const getActiveInvoice = useCallback(() => invoices.find(i => i.id === activeInvoiceId) || null, [invoices, activeInvoiceId]);

  const calculateTotal = useCallback((invoice: Invoice) => {
    const subtotal = invoice.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = Math.round(subtotal * invoice.taxRate / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, []);

  const generateInvoiceComponent = useCallback(() => {
    return `import React from 'react';

interface InvoiceProps {
  invoice: {
    number: string;
    clientName: string;
    clientEmail: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    issuedAt: string;
    dueAt: string;
    notes: string;
    taxRate: number;
    currency: string;
  };
}

export function InvoiceView({ invoice }: InvoiceProps) {
  const subtotal = invoice.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const tax = Math.round(subtotal * invoice.taxRate / 100);
  const total = subtotal + tax;
  const fmt = (c: number) => \`\$\${(c / 100).toFixed(2)}\`;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white text-black">
      <div className="flex justify-between mb-8">
        <div><h1 className="text-2xl font-bold">Invoice</h1><p className="text-gray-500">{invoice.number}</p></div>
        <div className="text-right"><p className="font-semibold">{invoice.clientName}</p><p className="text-sm text-gray-500">{invoice.clientEmail}</p></div>
      </div>
      <table className="w-full mb-6">
        <thead><tr className="border-b"><th className="text-left py-2">Description</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
        <tbody>{invoice.items.map((it, i) => (
          <tr key={i} className="border-b"><td className="py-2">{it.description}</td><td className="text-right">{it.quantity}</td><td className="text-right">{fmt(it.unitPrice)}</td><td className="text-right">{fmt(it.quantity * it.unitPrice)}</td></tr>
        ))}</tbody>
      </table>
      <div className="flex justify-end"><div className="w-48 space-y-1">
        <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        {invoice.taxRate > 0 && <div className="flex justify-between"><span>Tax ({invoice.taxRate}%)</span><span>{fmt(tax)}</span></div>}
        <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{fmt(total)}</span></div>
      </div></div>
      {invoice.notes && <p className="mt-6 text-sm text-gray-500">{invoice.notes}</p>}
    </div>
  );
}`;
  }, []);

  const generatePDFExport = useCallback(() => {
    return `// Invoice PDF Export using jsPDF
import jsPDF from 'jspdf';

export function exportInvoicePDF(invoice: any) {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Invoice ' + invoice.number, 20, 30);
  doc.setFontSize(12);
  doc.text('Bill To: ' + invoice.clientName, 20, 45);
  doc.text(invoice.clientEmail, 20, 52);

  let y = 70;
  doc.setFontSize(10);
  doc.text('Description', 20, y);
  doc.text('Qty', 120, y);
  doc.text('Price', 145, y);
  doc.text('Total', 175, y);
  y += 8;

  invoice.items.forEach((item: any) => {
    doc.text(item.description, 20, y);
    doc.text(String(item.quantity), 120, y);
    doc.text('$' + (item.unitPrice / 100).toFixed(2), 145, y);
    doc.text('$' + ((item.quantity * item.unitPrice) / 100).toFixed(2), 175, y);
    y += 7;
  });

  doc.save(invoice.number + '.pdf');
}`;
  }, []);

  return {
    invoices, activeInvoiceId, setActiveInvoiceId, getActiveInvoice,
    createInvoice, updateInvoice, removeInvoice, addItem, removeItem,
    calculateTotal, generateInvoiceComponent, generatePDFExport,
  };
}
