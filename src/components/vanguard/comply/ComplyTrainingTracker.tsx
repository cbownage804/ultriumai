import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap, Plus, CheckCircle, Clock, XCircle, Trash2,
  Users, Award, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  not_started: { label: 'Not Started', color: 'bg-white/10 text-white/60', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-400', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-500/20 text-orange-400', icon: AlertTriangle },
};

const TRAINING_TYPES = [
  { value: 'security_awareness', label: 'Security Awareness' },
  { value: 'phishing_simulation', label: 'Phishing Simulation' },
  { value: 'hipaa_training', label: 'HIPAA Training' },
  { value: 'pci_training', label: 'PCI-DSS Training' },
  { value: 'gdpr_training', label: 'GDPR Training' },
  { value: 'incident_response', label: 'Incident Response' },
  { value: 'data_handling', label: 'Data Handling' },
  { value: 'password_security', label: 'Password Security' },
  { value: 'social_engineering', label: 'Social Engineering' },
  { value: 'custom', label: 'Custom Training' },
];

interface TrainingRecord {
  id: string;
  employee_name: string;
  employee_email: string | null;
  department: string | null;
  training_name: string;
  training_type: string;
  framework_type: string | null;
  status: string;
  assigned_date: string;
  due_date: string | null;
  completed_date: string | null;
  score: number | null;
  created_at: string;
}

export function ComplyTrainingTracker() {
  const { user } = useAuth();
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRecord, setNewRecord] = useState({
    employee_name: '', employee_email: '', department: '',
    training_name: '', training_type: 'security_awareness', due_date: '',
  });

  const loadRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('compliance_training')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Auto-mark overdue
      const now = new Date();
      const processed = (data || []).map((r: TrainingRecord) => {
        if (r.status !== 'completed' && r.due_date && new Date(r.due_date) < now) {
          return { ...r, status: 'overdue' };
        }
        return r;
      });
      setRecords(processed);
    } catch (err) {
      console.error('Failed to load training:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, [user]);

  const handleAdd = async () => {
    if (!user || !newRecord.employee_name || !newRecord.training_name) {
      toast.error('Employee name and training name are required');
      return;
    }
    try {
      await (supabase as any).from('compliance_training').insert({
        user_id: user.id,
        employee_name: newRecord.employee_name,
        employee_email: newRecord.employee_email || null,
        department: newRecord.department || null,
        training_name: newRecord.training_name,
        training_type: newRecord.training_type,
        due_date: newRecord.due_date || null,
        status: 'not_started',
      });
      setShowAdd(false);
      setNewRecord({ employee_name: '', employee_email: '', department: '', training_name: '', training_type: 'security_awareness', due_date: '' });
      toast.success('Training assigned');
      loadRecords();
    } catch (err) {
      toast.error('Failed to assign training');
    }
  };

  const markCompleted = async (id: string, score?: number) => {
    try {
      await (supabase as any).from('compliance_training')
        .update({ status: 'completed', completed_date: new Date().toISOString(), score: score || null, updated_at: new Date().toISOString() })
        .eq('id', id);
      toast.success('Marked as completed');
      loadRecords();
    } catch (err) { toast.error('Update failed'); }
  };

  const deleteRecord = async (id: string) => {
    try {
      await (supabase as any).from('compliance_training').delete().eq('id', id);
      toast.success('Training record removed');
      loadRecords();
    } catch (err) { toast.error('Delete failed'); }
  };

  const totalEmployees = new Set(records.map(r => r.employee_name)).size;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const overdueCount = records.filter(r => r.status === 'overdue').length;
  const completionRate = records.length > 0 ? Math.round((completedCount / records.length) * 100) : 0;

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading training data...</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Employees</p>
            <p className="text-3xl font-bold text-white">{totalEmployees}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Completion Rate</p>
            <p className="text-3xl font-bold text-teal-400">{completionRate}%</p>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-400">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-3xl font-bold text-red-400">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Records */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-teal-400" /> Training Records ({records.length})
              </CardTitle>
              <CardDescription>Track employee security awareness and compliance training</CardDescription>
            </div>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700"><Plus className="h-4 w-4 mr-2" /> Assign Training</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign Training</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Employee Name</Label><Input value={newRecord.employee_name} onChange={e => setNewRecord(p => ({ ...p, employee_name: e.target.value }))} /></div>
                    <div><Label>Email</Label><Input value={newRecord.employee_email} onChange={e => setNewRecord(p => ({ ...p, employee_email: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Department</Label><Input value={newRecord.department} onChange={e => setNewRecord(p => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>Training Type</Label>
                      <Select value={newRecord.training_type} onValueChange={v => setNewRecord(p => ({ ...p, training_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TRAINING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Training Name</Label><Input value={newRecord.training_name} onChange={e => setNewRecord(p => ({ ...p, training_name: e.target.value }))} placeholder="e.g. Q1 2026 Security Awareness" /></div>
                  <div><Label>Due Date</Label><Input type="date" value={newRecord.due_date} onChange={e => setNewRecord(p => ({ ...p, due_date: e.target.value }))} /></div>
                  <Button onClick={handleAdd} className="w-full bg-teal-600 hover:bg-teal-700">Assign Training</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No training assigned yet. Assign your first training to get started.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {records.map(rec => {
                  const statusCfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.not_started;
                  const StatusIcon = statusCfg.icon;
                  const trainingLabel = TRAINING_TYPES.find(t => t.value === rec.training_type)?.label || rec.training_type;

                  return (
                    <div key={rec.id} className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <StatusIcon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-white">{rec.employee_name}</p>
                              {rec.department && <Badge className="bg-white/10 text-white/60 text-xs">{rec.department}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{rec.training_name}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs">{trainingLabel}</Badge>
                              <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                              {rec.due_date && <span>Due: {format(new Date(rec.due_date), 'MMM dd, yyyy')}</span>}
                              {rec.completed_date && <span className="text-green-400">Completed: {format(new Date(rec.completed_date), 'MMM dd, yyyy')}</span>}
                              {rec.score != null && <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Score: {rec.score}%</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {rec.status !== 'completed' && (
                            <Button variant="outline" size="sm" className="h-8 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10" onClick={() => markCompleted(rec.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Complete
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteRecord(rec.id)}>
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
