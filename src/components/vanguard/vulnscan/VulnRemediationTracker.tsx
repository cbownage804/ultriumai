import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, Clock, User, Calendar, MessageSquare, 
  AlertTriangle, XCircle, Wrench, Plus, Edit, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  port: number | null;
  solution: string | null;
  status: string | null;
  discovered_at: string;
  patched_at: string | null;
  device_id: string | null;
}

interface RemediationTask {
  id: string;
  vuln_id: string;
  assigned_to: string | null;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'testing' | 'completed' | 'deferred';
  notes: string[];
  created_at: string;
  updated_at: string;
}

interface VulnRemediationTrackerProps {
  vulnerabilities: Vulnerability[];
  onVulnUpdate: () => void;
}

const REMEDIATION_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-muted text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500/10 text-blue-500' },
  { value: 'testing', label: 'Testing', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/10 text-green-500' },
  { value: 'deferred', label: 'Deferred', color: 'bg-yellow-500/10 text-yellow-500' },
];

export function VulnRemediationTracker({ vulnerabilities, onVulnUpdate }: VulnRemediationTrackerProps) {
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<string>("pending");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Group vulnerabilities by status
  const openVulns = vulnerabilities.filter(v => !v.status || v.status === 'open');
  const inProgressVulns = vulnerabilities.filter(v => v.status === 'in_progress');
  const patchedVulns = vulnerabilities.filter(v => v.status === 'patched');
  
  const completionRate = vulnerabilities.length > 0 
    ? Math.round((patchedVulns.length / vulnerabilities.length) * 100)
    : 0;

  // Calculate MTTF (Mean Time to Fix) for patched vulns
  const mttf = patchedVulns.length > 0
    ? patchedVulns.reduce((acc, v) => {
        if (v.patched_at) {
          return acc + differenceInDays(new Date(v.patched_at), new Date(v.discovered_at));
        }
        return acc;
      }, 0) / patchedVulns.length
    : 0;

  const openRemediationDialog = (vuln: Vulnerability) => {
    setSelectedVuln(vuln);
    setStatus(vuln.status || 'pending');
    setIsDialogOpen(true);
  };

  const handleSaveRemediation = async () => {
    if (!selectedVuln) return;
    
    setIsSaving(true);
    
    const updates: any = {
      status: status === 'completed' ? 'patched' : status,
    };
    
    if (status === 'completed') {
      updates.patched_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('safenet_vulnerabilities')
      .update(updates)
      .eq('id', selectedVuln.id);
    
    if (error) {
      toast.error('Failed to update remediation status');
    } else {
      toast.success('Remediation status updated');
      setIsDialogOpen(false);
      onVulnUpdate();
    }
    
    setIsSaving(false);
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'patched':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'testing':
        return <Wrench className="h-4 w-4 text-purple-500" />;
      case 'deferred':
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openVulns.length}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressVulns.length}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{patchedVulns.length}</p>
                <p className="text-xs text-muted-foreground">Remediated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(mttf)}d</p>
                <p className="text-xs text-muted-foreground">Avg. MTTF</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Remediation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{patchedVulns.length} remediated</span>
            <span>{openVulns.length + inProgressVulns.length} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Remediation Queue
          </CardTitle>
          <CardDescription>
            Track and manage vulnerability fixes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {[...openVulns, ...inProgressVulns]
                .sort((a, b) => {
                  // Sort by severity first
                  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                  const sevA = severityOrder[a.severity.toLowerCase() as keyof typeof severityOrder] ?? 4;
                  const sevB = severityOrder[b.severity.toLowerCase() as keyof typeof severityOrder] ?? 4;
                  return sevA - sevB;
                })
                .map(vuln => (
                  <div 
                    key={vuln.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(vuln.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{vuln.title}</span>
                          <Badge className={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {vuln.cve_id && <span className="font-mono">{vuln.cve_id}</span>}
                          <span>Discovered {formatDistanceToNow(new Date(vuln.discovered_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openRemediationDialog(vuln)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                ))}
              
              {openVulns.length + inProgressVulns.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>All vulnerabilities remediated!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Remediation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Remediation</DialogTitle>
            <DialogDescription>
              {selectedVuln?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMEDIATION_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={s.color}>{s.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Assigned To (optional)</Label>
              <Input
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="security@company.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add remediation notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRemediation} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
