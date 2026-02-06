import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Building2, Plus, Shield, AlertTriangle, CheckCircle, Clock,
  ExternalLink, Trash2, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const COMPLIANCE_STATUS: Record<string, { label: string; color: string }> = {
  not_assessed: { label: 'Not Assessed', color: 'bg-white/10 text-white/60' },
  compliant: { label: 'Compliant', color: 'bg-green-500/20 text-green-400' },
  partially_compliant: { label: 'Partial', color: 'bg-yellow-500/20 text-yellow-400' },
  non_compliant: { label: 'Non-Compliant', color: 'bg-red-500/20 text-red-400' },
};

const VENDOR_CATEGORIES = [
  'Cloud Infrastructure', 'SaaS Application', 'Security Tools', 'Payment Processing',
  'HR / Payroll', 'Communication', 'Data Analytics', 'Development Tools',
  'Marketing', 'Legal / Compliance', 'Other',
];

const DATA_ACCESS_LEVELS = [
  { value: 'none', label: 'No Data Access' },
  { value: 'metadata', label: 'Metadata Only' },
  { value: 'limited', label: 'Limited PII' },
  { value: 'full', label: 'Full Data Access' },
  { value: 'sensitive', label: 'Sensitive / PHI / PCI' },
];

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_category: string | null;
  contact_email: string | null;
  contact_name: string | null;
  risk_level: string;
  compliance_status: string;
  data_access_level: string | null;
  frameworks: string[];
  last_assessment_date: string | null;
  next_review_date: string | null;
  contract_expiry: string | null;
  notes: string | null;
  created_at: string;
}

export function ComplyVendorRisk() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendor_name: '', vendor_category: '', contact_email: '', contact_name: '',
    risk_level: 'medium', data_access_level: 'none', notes: '',
    next_review_date: '', contract_expiry: '',
  });

  const loadVendors = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('compliance_vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('vendor_name');
      setVendors(data || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadVendors(); }, [user]);

  const handleAdd = async () => {
    if (!user || !newVendor.vendor_name) { toast.error('Vendor name is required'); return; }
    try {
      await (supabase as any).from('compliance_vendors').insert({
        user_id: user.id,
        vendor_name: newVendor.vendor_name,
        vendor_category: newVendor.vendor_category || null,
        contact_email: newVendor.contact_email || null,
        contact_name: newVendor.contact_name || null,
        risk_level: newVendor.risk_level,
        data_access_level: newVendor.data_access_level,
        notes: newVendor.notes || null,
        next_review_date: newVendor.next_review_date || null,
        contract_expiry: newVendor.contract_expiry || null,
        compliance_status: 'not_assessed',
        frameworks: [],
      });
      setShowAdd(false);
      setNewVendor({ vendor_name: '', vendor_category: '', contact_email: '', contact_name: '', risk_level: 'medium', data_access_level: 'none', notes: '', next_review_date: '', contract_expiry: '' });
      toast.success('Vendor added');
      loadVendors();
    } catch (err) {
      toast.error('Failed to add vendor');
    }
  };

  const updateVendorStatus = async (id: string, compliance_status: string) => {
    try {
      await (supabase as any).from('compliance_vendors')
        .update({ compliance_status, last_assessment_date: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      toast.success('Status updated');
      loadVendors();
    } catch (err) { toast.error('Update failed'); }
  };

  const deleteVendor = async (id: string) => {
    try {
      await (supabase as any).from('compliance_vendors').delete().eq('id', id);
      toast.success('Vendor removed');
      loadVendors();
    } catch (err) { toast.error('Delete failed'); }
  };

  const highRiskCount = vendors.filter(v => v.risk_level === 'high' || v.risk_level === 'critical').length;
  const compliantCount = vendors.filter(v => v.compliance_status === 'compliant').length;
  const reviewDueCount = vendors.filter(v => {
    if (!v.next_review_date) return false;
    return differenceInDays(new Date(v.next_review_date), new Date()) <= 30;
  }).length;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading vendors...</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Vendors</p>
            <p className="text-3xl font-bold text-white">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">High/Critical Risk</p>
            <p className="text-3xl font-bold text-red-400">{highRiskCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Compliant</p>
            <p className="text-3xl font-bold text-green-400">{compliantCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Reviews Due (30d)</p>
            <p className="text-3xl font-bold text-orange-400">{reviewDueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendor List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-400" /> Vendor Registry ({vendors.length})
              </CardTitle>
              <CardDescription>Track third-party vendor compliance and risk</CardDescription>
            </div>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div><Label>Vendor Name</Label><Input value={newVendor.vendor_name} onChange={e => setNewVendor(p => ({ ...p, vendor_name: e.target.value }))} placeholder="e.g. AWS, Okta, Slack" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Category</Label>
                      <Select value={newVendor.vendor_category} onValueChange={v => setNewVendor(p => ({ ...p, vendor_category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{VENDOR_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Risk Level</Label>
                      <Select value={newVendor.risk_level} onValueChange={v => setNewVendor(p => ({ ...p, risk_level: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(RISK_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Data Access Level</Label>
                    <Select value={newVendor.data_access_level} onValueChange={v => setNewVendor(p => ({ ...p, data_access_level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DATA_ACCESS_LEVELS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Contact Name</Label><Input value={newVendor.contact_name} onChange={e => setNewVendor(p => ({ ...p, contact_name: e.target.value }))} /></div>
                    <div><Label>Contact Email</Label><Input value={newVendor.contact_email} onChange={e => setNewVendor(p => ({ ...p, contact_email: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Next Review Date</Label><Input type="date" value={newVendor.next_review_date} onChange={e => setNewVendor(p => ({ ...p, next_review_date: e.target.value }))} /></div>
                    <div><Label>Contract Expiry</Label><Input type="date" value={newVendor.contract_expiry} onChange={e => setNewVendor(p => ({ ...p, contract_expiry: e.target.value }))} /></div>
                  </div>
                  <div><Label>Notes</Label><Textarea value={newVendor.notes} onChange={e => setNewVendor(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button onClick={handleAdd} className="w-full bg-teal-600 hover:bg-teal-700">Add Vendor</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vendors tracked yet. Add your first vendor to begin risk management.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {vendors.map(vendor => {
                  const risk = RISK_CONFIG[vendor.risk_level] || RISK_CONFIG.medium;
                  const status = COMPLIANCE_STATUS[vendor.compliance_status] || COMPLIANCE_STATUS.not_assessed;
                  const reviewDue = vendor.next_review_date ? differenceInDays(new Date(vendor.next_review_date), new Date()) : null;

                  return (
                    <div key={vendor.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white">{vendor.vendor_name}</p>
                            {vendor.vendor_category && <Badge className="bg-white/10 text-white/60 text-xs">{vendor.vendor_category}</Badge>}
                            <Badge className={`text-xs ${risk.color}`}>{risk.label} Risk</Badge>
                            <Badge className={`text-xs ${status.color}`}>{status.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                            {vendor.data_access_level && vendor.data_access_level !== 'none' && (
                              <span className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                {DATA_ACCESS_LEVELS.find(d => d.value === vendor.data_access_level)?.label}
                              </span>
                            )}
                            {vendor.contact_name && <span>{vendor.contact_name}</span>}
                            {vendor.last_assessment_date && <span>Assessed: {format(new Date(vendor.last_assessment_date), 'MMM dd, yyyy')}</span>}
                            {reviewDue !== null && (
                              <span className={reviewDue <= 30 ? 'text-orange-400' : ''}>
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Review {reviewDue > 0 ? `in ${reviewDue}d` : 'overdue'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Select value={vendor.compliance_status} onValueChange={v => updateVendorStatus(vendor.id, v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(COMPLIANCE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteVendor(vendor.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
