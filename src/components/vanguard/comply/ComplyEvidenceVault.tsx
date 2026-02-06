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
import {
  FileText, Plus, Upload, CheckCircle, Clock, XCircle,
  Eye, Trash2, AlertTriangle, Archive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FRAMEWORK_LABELS: Record<string, string> = {
  soc2: 'SOC 2', hipaa: 'HIPAA', pci_dss: 'PCI-DSS', iso_27001: 'ISO 27001',
  nist_800_53: 'NIST 800-53', gdpr: 'GDPR', ccpa: 'CCPA / CPRA', cmmc: 'CMMC 2.0',
  fedramp: 'FedRAMP', glba: 'GLBA', wisp: 'WISP', cis_linux: 'CIS Linux', cis_windows: 'CIS Windows',
};

const EVIDENCE_TYPES = [
  { value: 'document', label: 'Document' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'log', label: 'System Log' },
  { value: 'report', label: 'Report' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'policy', label: 'Policy Document' },
  { value: 'config', label: 'Configuration Export' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-400', icon: AlertTriangle },
};

interface EvidenceRecord {
  id: string;
  client_id: string;
  policy_id: string | null;
  framework_type: string;
  evidence_name: string;
  evidence_type: string;
  file_url: string | null;
  description: string | null;
  uploaded_by: string | null;
  status: string;
  review_notes: string | null;
  expires_at: string | null;
  created_at: string;
}

export function ComplyEvidenceVault() {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterFramework, setFilterFramework] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newEvidence, setNewEvidence] = useState({
    evidence_name: '', framework_type: '', evidence_type: 'document',
    description: '', uploaded_by: '', file_url: '', expires_at: '',
  });

  const loadEvidence = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('compliance_evidence_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setEvidence(data || []);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadEvidence(); }, [user]);

  const handleAdd = async () => {
    if (!user || !newEvidence.evidence_name || !newEvidence.framework_type) {
      toast.error('Name and framework are required');
      return;
    }
    try {
      await (supabase as any).from('compliance_evidence_vault').insert({
        user_id: user.id,
        client_id: user.id, // default to user's own org
        evidence_name: newEvidence.evidence_name,
        framework_type: newEvidence.framework_type,
        evidence_type: newEvidence.evidence_type,
        description: newEvidence.description || null,
        uploaded_by: newEvidence.uploaded_by || null,
        file_url: newEvidence.file_url || null,
        expires_at: newEvidence.expires_at || null,
        status: 'pending',
      });
      setShowAdd(false);
      setNewEvidence({ evidence_name: '', framework_type: '', evidence_type: 'document', description: '', uploaded_by: '', file_url: '', expires_at: '' });
      toast.success('Evidence added');
      loadEvidence();
    } catch (err) {
      console.error('Failed to add evidence:', err);
      toast.error('Failed to add evidence');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await (supabase as any).from('compliance_evidence_vault')
        .update({ status, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
      toast.success('Status updated');
      loadEvidence();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const deleteEvidence = async (id: string) => {
    try {
      await (supabase as any).from('compliance_evidence_vault').delete().eq('id', id);
      toast.success('Evidence deleted');
      loadEvidence();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filtered = evidence.filter(e => {
    if (filterFramework !== 'all' && e.framework_type !== filterFramework) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  const pendingCount = evidence.filter(e => e.status === 'pending').length;
  const approvedCount = evidence.filter(e => e.status === 'approved').length;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading evidence vault...</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Evidence</p>
            <p className="text-3xl font-bold text-white">{evidence.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-3xl font-bold text-green-400">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 flex items-center justify-center">
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="h-4 w-4 mr-2" /> Upload Evidence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Evidence</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div><Label>Evidence Name</Label><Input value={newEvidence.evidence_name} onChange={e => setNewEvidence(p => ({ ...p, evidence_name: e.target.value }))} placeholder="e.g. Firewall Config Export" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Framework</Label>
                      <Select value={newEvidence.framework_type} onValueChange={v => setNewEvidence(p => ({ ...p, framework_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{Object.entries(FRAMEWORK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Type</Label>
                      <Select value={newEvidence.evidence_type} onValueChange={v => setNewEvidence(p => ({ ...p, evidence_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{EVIDENCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Description</Label><Textarea value={newEvidence.description} onChange={e => setNewEvidence(p => ({ ...p, description: e.target.value }))} placeholder="Describe this evidence" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Uploaded By</Label><Input value={newEvidence.uploaded_by} onChange={e => setNewEvidence(p => ({ ...p, uploaded_by: e.target.value }))} placeholder="Name" /></div>
                    <div><Label>Expires</Label><Input type="date" value={newEvidence.expires_at} onChange={e => setNewEvidence(p => ({ ...p, expires_at: e.target.value }))} /></div>
                  </div>
                  <div><Label>File URL (optional)</Label><Input value={newEvidence.file_url} onChange={e => setNewEvidence(p => ({ ...p, file_url: e.target.value }))} placeholder="https://..." /></div>
                  <Button onClick={handleAdd} className="w-full bg-teal-600 hover:bg-teal-700">Add Evidence</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterFramework} onValueChange={setFilterFramework}>
          <SelectTrigger className="w-[180px] bg-black/40 border-white/10"><SelectValue placeholder="All Frameworks" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frameworks</SelectItem>
            {Object.entries(FRAMEWORK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-black/40 border-white/10"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Evidence List */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Archive className="h-5 w-5 text-teal-400" /> Evidence Vault ({filtered.length})
          </CardTitle>
          <CardDescription>Upload and manage compliance evidence documents</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No evidence uploaded yet.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {filtered.map(ev => {
                  const statusCfg = STATUS_CONFIG[ev.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div key={ev.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-white">{ev.evidence_name}</p>
                            {ev.description && <p className="text-sm text-muted-foreground mt-0.5">{ev.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs">{FRAMEWORK_LABELS[ev.framework_type] || ev.framework_type}</Badge>
                              <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                              <span>{EVIDENCE_TYPES.find(t => t.value === ev.evidence_type)?.label || ev.evidence_type}</span>
                              {ev.uploaded_by && <span>By: {ev.uploaded_by}</span>}
                              <span>{format(new Date(ev.created_at), 'MMM dd, yyyy')}</span>
                              {ev.expires_at && <span className="text-orange-400">Expires: {format(new Date(ev.expires_at), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {ev.file_url && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(ev.file_url!, '_blank')}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Select value={ev.status} onValueChange={v => updateStatus(ev.id, v)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteEvidence(ev.id)}>
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
