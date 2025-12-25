import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, CheckCircle, Clock, FileText, MessageSquare, 
  Plus, Search, Shield, Target, User, Activity, Zap, XCircle,
  ArrowUpRight, Timer, Calendar, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface MDRCase {
  id: string;
  case_number: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  priority: number;
  assigned_analyst: string | null;
  escalation_level: number;
  incident_ids: string[];
  affected_assets: any[];
  timeline: any[];
  notes: string;
  root_cause: string;
  remediation_steps: string[];
  time_to_detect_minutes: number | null;
  time_to_respond_minutes: number | null;
  time_to_contain_minutes: number | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  contained_at: string | null;
  closed_at: string | null;
}

interface CaseActivity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
  old_value: any;
  new_value: any;
}

export function MDRCaseManagement() {
  const [cases, setCases] = useState<MDRCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<MDRCase | null>(null);
  const [activities, setActivities] = useState<CaseActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [newComment, setNewComment] = useState("");

  // New case form
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
    severity: "medium",
    priority: 3,
  });

  useEffect(() => {
    loadCases();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('mdr-cases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mdr_cases' },
        () => loadCases()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadCases = async () => {
    try {
      const { data, error } = await supabase
        .from('mdr_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases((data || []) as MDRCase[]);
    } catch (err) {
      console.error('Failed to load cases:', err);
      toast.error("Failed to load MDR cases");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaseActivities = async (caseId: string) => {
    const { data } = await supabase
      .from('mdr_case_activities')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });
    
    setActivities(data || []);
  };

  const createCase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mdr_cases')
        .insert([{
          user_id: user.id,
          case_number: '', // Will be auto-generated
          title: newCase.title,
          description: newCase.description,
          severity: newCase.severity,
          priority: newCase.priority,
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Case created", { description: `Case ${data.case_number} created` });
      setShowNewCaseDialog(false);
      setNewCase({ title: "", description: "", severity: "medium", priority: 3 });
      loadCases();
    } catch (err) {
      console.error('Failed to create case:', err);
      toast.error("Failed to create case");
    }
  };

  const updateCaseStatus = async (caseId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      
      if (newStatus === 'investigating' && !selectedCase?.first_response_at) {
        updates.first_response_at = new Date().toISOString();
        if (selectedCase) {
          updates.time_to_respond_minutes = Math.round(
            (new Date().getTime() - new Date(selectedCase.created_at).getTime()) / 60000
          );
        }
      } else if (newStatus === 'contained') {
        updates.contained_at = new Date().toISOString();
        if (selectedCase) {
          updates.time_to_contain_minutes = Math.round(
            (new Date().getTime() - new Date(selectedCase.created_at).getTime()) / 60000
          );
        }
      } else if (newStatus === 'closed' || newStatus === 'false_positive') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('mdr_cases')
        .update(updates)
        .eq('id', caseId);

      if (error) throw error;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('mdr_case_activities').insert({
          case_id: caseId,
          user_id: user.id,
          activity_type: 'status_change',
          description: `Status changed to ${newStatus}`,
          old_value: { status: selectedCase?.status },
          new_value: { status: newStatus },
        });
      }

      toast.success("Case updated");
      loadCases();
      if (selectedCase) loadCaseActivities(caseId);
    } catch (err) {
      console.error('Failed to update case:', err);
      toast.error("Failed to update case");
    }
  };

  const addComment = async () => {
    if (!selectedCase || !newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('mdr_case_activities').insert({
        case_id: selectedCase.id,
        user_id: user.id,
        activity_type: 'comment',
        description: newComment,
      });

      toast.success("Comment added");
      setNewComment("");
      loadCaseActivities(selectedCase.id);
    } catch (err) {
      console.error('Failed to add comment:', err);
      toast.error("Failed to add comment");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'investigating': return <Search className="h-4 w-4 text-blue-500" />;
      case 'contained': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'remediated': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'false_positive': return <XCircle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !c.case_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const metrics = {
    open: cases.filter(c => c.status === 'open').length,
    investigating: cases.filter(c => c.status === 'investigating').length,
    critical: cases.filter(c => c.severity === 'critical' && c.status !== 'closed').length,
    avgResponseTime: cases.filter(c => c.time_to_respond_minutes).length > 0
      ? Math.round(cases.reduce((acc, c) => acc + (c.time_to_respond_minutes || 0), 0) / 
          cases.filter(c => c.time_to_respond_minutes).length)
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold text-yellow-500">{metrics.open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold text-blue-500">{metrics.investigating}</p>
              </div>
              <Search className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Active</p>
                <p className="text-2xl font-bold text-red-500">{metrics.critical}</p>
              </div>
              <Target className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-green-500">{metrics.avgResponseTime}m</p>
              </div>
              <Timer className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                MDR Cases
              </CardTitle>
              <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create MDR Case</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={newCase.title}
                        onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                        placeholder="Case title..."
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newCase.description}
                        onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                        placeholder="Describe the incident..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Severity</Label>
                        <Select value={newCase.severity} onValueChange={(v) => setNewCase({ ...newCase, severity: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={String(newCase.priority)} onValueChange={(v) => setNewCase({ ...newCase, priority: parseInt(v) })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">P1 - Critical</SelectItem>
                            <SelectItem value="2">P2 - High</SelectItem>
                            <SelectItem value="3">P3 - Medium</SelectItem>
                            <SelectItem value="4">P4 - Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={createCase} className="w-full">Create Case</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Filters */}
            <div className="space-y-2">
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="contained">Contained</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Case List */}
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {isLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading cases...</p>
                ) : filteredCases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No cases found</p>
                ) : (
                  filteredCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCase(c);
                        loadCaseActivities(c.id);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCase?.id === c.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(c.status)}
                            <span className="text-xs text-muted-foreground">{c.case_number}</span>
                          </div>
                          <p className="font-medium text-sm truncate mt-1">{c.title}</p>
                        </div>
                        <Badge className={getSeverityColor(c.severity)}>{c.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Case Details */}
        <Card className="lg:col-span-2">
          {selectedCase ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(selectedCase.severity)}>
                        {selectedCase.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{selectedCase.case_number}</span>
                    </div>
                    <CardTitle className="mt-2">{selectedCase.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedCase.status} onValueChange={(v) => updateCaseStatus(selectedCase.id, v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="contained">Contained</SelectItem>
                        <SelectItem value="remediated">Remediated</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="false_positive">False Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details">
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div>
                      <Label className="text-muted-foreground">Description</Label>
                      <p className="text-sm mt-1">{selectedCase.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">{format(new Date(selectedCase.created_at), 'MMM d, HH:mm')}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Time to Respond</p>
                        <p className="text-sm font-medium">
                          {selectedCase.time_to_respond_minutes 
                            ? `${selectedCase.time_to_respond_minutes}m` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Time to Contain</p>
                        <p className="text-sm font-medium">
                          {selectedCase.time_to_contain_minutes 
                            ? `${selectedCase.time_to_contain_minutes}m` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Escalation</p>
                        <p className="text-sm font-medium">Level {selectedCase.escalation_level}</p>
                      </div>
                    </div>

                    {/* Comment Box */}
                    <div className="pt-4 border-t">
                      <Label>Add Comment</Label>
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add investigation notes..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <Button onClick={addComment} className="mt-2" size="sm">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Add Comment
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="mt-4">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {activities.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No activity yet</p>
                        ) : (
                          activities.map((activity) => (
                            <div key={activity.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                {activity.activity_type === 'comment' ? (
                                  <MessageSquare className="h-4 w-4" />
                                ) : activity.activity_type === 'status_change' ? (
                                  <Activity className="h-4 w-4" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">{activity.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="actions" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start">
                        <Shield className="h-4 w-4 mr-2" />
                        Network Isolate
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <XCircle className="h-4 w-4 mr-2" />
                        Kill Process
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Quarantine File
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Escalate
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full min-h-[500px]">
              <div className="text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a case to view details</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
