import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Shield, Plus, CheckCircle, XCircle, AlertTriangle,
  Clock, FileText, BarChart3, ClipboardCheck
} from 'lucide-react';
import { useClientCompliance } from '@/hooks/useClientCompliance';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FRAMEWORKS = [
  { id: 'soc2', name: 'SOC 2 Type II' },
  { id: 'hipaa', name: 'HIPAA' },
  { id: 'pci_dss', name: 'PCI-DSS' },
  { id: 'iso_27001', name: 'ISO 27001' },
  { id: 'nist_800_53', name: 'NIST 800-53' },
  { id: 'gdpr', name: 'GDPR' },
  { id: 'ccpa', name: 'CCPA / CPRA' },
  { id: 'cmmc', name: 'CMMC 2.0' },
  { id: 'fedramp', name: 'FedRAMP' },
  { id: 'glba', name: 'GLBA' },
  { id: 'wisp', name: 'WISP' },
  { id: 'cis_linux', name: 'CIS Linux' },
  { id: 'cis_windows', name: 'CIS Windows' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  not_started: { label: 'Not Started', color: 'bg-white/10 text-white/60', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  compliant: { label: 'Compliant', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  non_compliant: { label: 'Non-Compliant', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  waived: { label: 'Waived', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
};

interface Props {
  clientId: string;
  clientName: string;
  onBack: () => void;
}

export function ComplyClientDetail({ clientId, clientName, onBack }: Props) {
  const { profiles, policies, scanJobs, isLoading, enableFramework, addPolicy, updatePolicyStatus, refetch } = useClientCompliance(clientId);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showEnableFramework, setShowEnableFramework] = useState(false);
  const [newPolicy, setNewPolicy] = useState({ policy_name: '', framework_type: '', description: '', assigned_to: '', due_date: '' });
  const [selectedFramework, setSelectedFramework] = useState('');

  const enabledFrameworks = profiles.filter(p => p.is_enabled);
  const avgScore = enabledFrameworks.length > 0
    ? Math.round(enabledFrameworks.reduce((s, p) => s + Number(p.compliance_score), 0) / enabledFrameworks.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score > 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const handleEnableFramework = async () => {
    if (!selectedFramework) return;
    await enableFramework(clientId, selectedFramework);
    setShowEnableFramework(false);
    setSelectedFramework('');
    toast.success('Framework enabled');
  };

  const handleAddPolicy = async () => {
    if (!newPolicy.policy_name || !newPolicy.framework_type) {
      toast.error('Policy name and framework are required');
      return;
    }
    await addPolicy({
      client_id: clientId,
      policy_name: newPolicy.policy_name,
      framework_type: newPolicy.framework_type,
      description: newPolicy.description || null,
      assigned_to: newPolicy.assigned_to || null,
      due_date: newPolicy.due_date || null,
      status: 'not_started',
      evidence_url: null,
      evidence_notes: null,
    });
    setShowAddPolicy(false);
    setNewPolicy({ policy_name: '', framework_type: '', description: '', assigned_to: '', due_date: '' });
    toast.success('Policy added');
  };

  const handleStatusChange = async (policyId: string, status: string) => {
    await updatePolicyStatus(policyId, status);
    toast.success('Status updated');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white/60 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-white">{clientName}</h2>
            <p className="text-sm text-muted-foreground">Compliance Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={showEnableFramework} onOpenChange={setShowEnableFramework}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10">
                <Shield className="h-4 w-4 mr-2" />
                Enable Framework
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Enable Compliance Framework</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                  <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.filter(f => !profiles.some(p => p.framework_type === f.id)).map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleEnableFramework} className="w-full bg-teal-600 hover:bg-teal-700">Enable</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Compliance Policy</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Policy Name</Label>
                  <Input value={newPolicy.policy_name} onChange={e => setNewPolicy(p => ({ ...p, policy_name: e.target.value }))} placeholder="e.g. Access Control Policy" />
                </div>
                <div>
                  <Label>Framework</Label>
                  <Select value={newPolicy.framework_type} onValueChange={v => setNewPolicy(p => ({ ...p, framework_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                    <SelectContent>
                      {FRAMEWORKS.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={newPolicy.description} onChange={e => setNewPolicy(p => ({ ...p, description: e.target.value }))} placeholder="Policy description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assigned To</Label>
                    <Input value={newPolicy.assigned_to} onChange={e => setNewPolicy(p => ({ ...p, assigned_to: e.target.value }))} placeholder="Technician name" />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={newPolicy.due_date} onChange={e => setNewPolicy(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAddPolicy} className="w-full bg-teal-600 hover:bg-teal-700">Add Policy</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Framework Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>{avgScore > 0 ? `${avgScore}%` : '—'}</p>
            <Progress value={avgScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
        {enabledFrameworks.map(profile => {
          const fw = FRAMEWORKS.find(f => f.id === profile.framework_type);
          const score = Number(profile.compliance_score);
          return (
            <Card key={profile.id} className="bg-black/40 border-white/10">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{fw?.name || profile.framework_type}</p>
                <p className={`text-3xl font-bold ${getScoreColor(score)}`}>{score > 0 ? `${score}%` : '—'}</p>
                <Progress value={score} className="mt-2 h-2" />
                {profile.last_scan_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last scan: {format(new Date(profile.last_scan_at), 'MMM dd, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Policies Table */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-teal-400" />
            Compliance Policies ({policies.length})
          </CardTitle>
          <CardDescription>Track policy requirements and evidence for this client</CardDescription>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No policies yet. Click "Add Policy" to get started.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {policies.map(policy => {
                  const statusCfg = STATUS_CONFIG[policy.status] || STATUS_CONFIG.not_started;
                  const StatusIcon = statusCfg.icon;
                  const fw = FRAMEWORKS.find(f => f.id === policy.framework_type);

                  return (
                    <div key={policy.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: statusCfg.color.includes('green') ? '#4ade80' : statusCfg.color.includes('red') ? '#f87171' : statusCfg.color.includes('blue') ? '#60a5fa' : statusCfg.color.includes('yellow') ? '#facc15' : '#9ca3af' }} />
                          <div className="flex-1">
                            <p className="font-medium text-white">{policy.policy_name}</p>
                            {policy.description && <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs">{fw?.name || policy.framework_type}</Badge>
                              {policy.assigned_to && <span>Assigned: {policy.assigned_to}</span>}
                              {policy.due_date && <span>Due: {format(new Date(policy.due_date), 'MMM dd, yyyy')}</span>}
                            </div>
                          </div>
                        </div>
                        <Select value={policy.status} onValueChange={(v) => handleStatusChange(policy.id, v)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      {scanJobs.length > 0 && (
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-400" />
              Scan History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanJobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{job.framework_type}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(job.created_at), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={job.scan_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {job.scan_status}
                    </Badge>
                    {job.compliance_score != null && (
                      <span className={`font-bold ${getScoreColor(job.compliance_score)}`}>{job.compliance_score}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
