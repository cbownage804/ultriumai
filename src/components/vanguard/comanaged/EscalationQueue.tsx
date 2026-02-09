import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, Clock, CheckCircle2, XCircle, ArrowUpRight, User, Building2, Ticket, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EscalationRequest {
  id: string;
  organization_id: string;
  organization_name: string;
  ticket_id: string;
  ticket_title: string;
  requested_by_name: string;
  requested_by_email: string;
  escalation_reason: string;
  priority: 'urgent' | 'high' | 'normal';
  additional_notes: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  responded_by_msp_tech: string | null;
  response_notes: string | null;
  created_at: Date;
  responded_at: Date | null;
}

export function EscalationQueue() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<EscalationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationRequest | null>(null);
  const [responseNote, setResponseNote] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => { if (user) loadEscalations(); }, [user]);

  const loadEscalations = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_escalation_requests')
        .select('*, comanaged_organizations(organization_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEscalations((data || []).map((e: any) => ({
        id: e.id,
        organization_id: e.organization_id || '',
        organization_name: e.comanaged_organizations?.organization_name || 'Unknown',
        ticket_id: e.ticket_id || '',
        ticket_title: e.ticket_title || '',
        requested_by_name: e.requested_by_name || '',
        requested_by_email: e.requested_by_email || '',
        escalation_reason: e.escalation_reason || '',
        priority: e.priority || 'normal',
        additional_notes: e.additional_notes || '',
        status: e.status || 'pending',
        responded_by_msp_tech: e.responded_by_msp_tech,
        response_notes: e.response_notes,
        created_at: new Date(e.created_at),
        responded_at: e.responded_at ? new Date(e.responded_at) : null,
      })));
    } catch (err) {
      console.error('Failed to load escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (escalation: EscalationRequest, newStatus: 'accepted' | 'rejected' | 'completed') => {
    try {
      const { error } = await (supabase as any)
        .from('comanaged_escalation_requests')
        .update({ status: newStatus, response_notes: responseNote, responded_by_msp_tech: 'Current User', responded_at: new Date().toISOString() })
        .eq('id', escalation.id);
      if (error) throw error;
      setEscalations(prev => prev.map(e => e.id === escalation.id ? { ...e, status: newStatus, responded_by_msp_tech: 'Current User', response_notes: responseNote, responded_at: new Date() } : e));
      setSelectedEscalation(null);
      setResponseNote("");
      toast.success(`Escalation ${newStatus}!`);
    } catch { toast.error("Failed to update escalation"); }
  };

  const pendingCount = escalations.filter(e => e.status === 'pending').length;
  const acceptedCount = escalations.filter(e => e.status === 'accepted').length;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-500/20 text-red-400 animate-pulse">Urgent</Badge>;
      case 'high': return <Badge className="bg-amber-500/20 text-amber-400">High</Badge>;
      default: return <Badge className="bg-cyan-500/20 text-cyan-400">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>;
      case 'accepted': return <Badge className="bg-green-500/20 text-green-400">Accepted</Badge>;
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>;
      case 'completed': return <Badge className="bg-gray-500/20 text-gray-400">Completed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const filteredEscalations = escalations.filter(e => {
    if (activeTab === 'pending') return e.status === 'pending';
    if (activeTab === 'active') return e.status === 'accepted';
    if (activeTab === 'resolved') return e.status === 'completed' || e.status === 'rejected';
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowUpRight className="h-6 w-6 text-amber-400" />Escalation Queue</h2>
          <p className="text-white/60">Requests from internal IT teams needing MSP assistance</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span className="text-amber-400 font-medium">{pendingCount} pending escalations</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-black/40 border-amber-500/30"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/60">Pending</p><p className="text-3xl font-bold text-amber-400">{pendingCount}</p></div><Clock className="h-10 w-10 text-amber-400/30" /></div></CardContent></Card>
        <Card className="bg-black/40 border-green-500/30"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/60">In Progress</p><p className="text-3xl font-bold text-green-400">{acceptedCount}</p></div><CheckCircle2 className="h-10 w-10 text-green-400/30" /></div></CardContent></Card>
        <Card className="bg-black/40 border-cyan-500/30"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/60">Avg Response</p><p className="text-3xl font-bold text-white">—</p></div><Clock className="h-10 w-10 text-cyan-400/30" /></div></CardContent></Card>
        <Card className="bg-black/40 border-purple-500/30"><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-white/60">This Week</p><p className="text-3xl font-bold text-white">{escalations.length}</p></div><ArrowUpRight className="h-10 w-10 text-purple-400/30" /></div></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/30">
          <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500/20">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-green-500/20">In Progress ({acceptedCount})</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-gray-500/20">Resolved</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          <div className="space-y-3">
            {filteredEscalations.length === 0 ? (
              <Card className="bg-black/40 border-cyan-500/30"><CardContent className="py-12 text-center"><CheckCircle2 className="h-12 w-12 text-green-400/50 mx-auto mb-4" /><p className="text-white/60">No escalations in this category</p></CardContent></Card>
            ) : filteredEscalations.map((esc) => (
              <Card key={esc.id} className={`bg-black/40 border-cyan-500/30 hover:border-cyan-500/50 transition-colors cursor-pointer ${esc.priority === 'urgent' ? 'border-l-4 border-l-red-500' : ''}`} onClick={() => setSelectedEscalation(esc)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-amber-500/20 flex items-center justify-center"><ArrowUpRight className="h-6 w-6 text-amber-400" /></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 text-sm font-mono">{esc.ticket_id}</span>
                          {getPriorityBadge(esc.priority)}
                          {getStatusBadge(esc.status)}
                        </div>
                        <p className="text-white font-medium">{esc.ticket_title}</p>
                        <p className="text-sm text-white/60 mt-1 line-clamp-1">{esc.escalation_reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{esc.organization_name}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{esc.requested_by_name}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(esc.created_at, { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/40" />
                  </div>
                  {esc.status === 'accepted' && esc.responded_by_msp_tech && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="bg-green-500/20 text-green-400 text-xs">{esc.responded_by_msp_tech.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <span className="text-sm text-white/60">Being handled by <span className="text-green-400">{esc.responded_by_msp_tech}</span></span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedEscalation} onOpenChange={() => setSelectedEscalation(null)}>
        <DialogContent className="max-w-2xl bg-black/95 border-cyan-500/30 text-white">
          {selectedEscalation && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-amber-400" />Escalation Request</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-cyan-500/20 flex items-center justify-center"><Ticket className="h-5 w-5 text-cyan-400" /></div>
                    <div><p className="text-cyan-400 font-mono">{selectedEscalation.ticket_id}</p><p className="text-white font-medium">{selectedEscalation.ticket_title}</p></div>
                  </div>
                  <div className="flex items-center gap-2">{getPriorityBadge(selectedEscalation.priority)}{getStatusBadge(selectedEscalation.status)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-white/40">Organization</p><p className="text-white">{selectedEscalation.organization_name}</p></div>
                  <div><p className="text-xs text-white/40">Requested By</p><p className="text-white">{selectedEscalation.requested_by_name}</p></div>
                </div>
                <div><p className="text-xs text-white/40">Escalation Reason</p><p className="text-white bg-black/20 p-3 rounded-lg border border-cyan-500/20">{selectedEscalation.escalation_reason}</p></div>
                {selectedEscalation.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t border-cyan-500/20">
                    <Textarea value={responseNote} onChange={(e) => setResponseNote(e.target.value)} placeholder="Add a note..." className="bg-black/40 border-cyan-500/30 text-white" rows={3} />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => updateStatus(selectedEscalation, 'rejected')} className="border-red-500/30 text-red-400 hover:bg-red-500/10"><XCircle className="h-4 w-4 mr-2" />Reject</Button>
                      <Button onClick={() => updateStatus(selectedEscalation, 'accepted')} className="bg-gradient-to-r from-green-600 to-emerald-600"><CheckCircle2 className="h-4 w-4 mr-2" />Accept</Button>
                    </div>
                  </div>
                )}
                {selectedEscalation.status === 'accepted' && (
                  <Button onClick={() => updateStatus(selectedEscalation, 'completed')} className="w-full bg-cyan-600 hover:bg-cyan-700"><CheckCircle2 className="h-4 w-4 mr-2" />Mark as Complete</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
