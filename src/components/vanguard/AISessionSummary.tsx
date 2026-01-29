import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Clock, 
  Loader2, 
  FileText,
  Copy,
  Download,
  Terminal,
  Monitor
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInSeconds } from "date-fns";

interface RemoteSession {
  id: string;
  device_id: string;
  session_type: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  connection_details: any;
  device?: {
    hostname: string;
  };
}

export function AISessionSummary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<RemoteSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<{
    summary: string;
    actions: string[];
    duration_formatted: string;
    billing_notes: string;
  } | null>(null);

  // Fetch recent remote sessions with device info
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['remote-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('remote_sessions')
        .select(`
          id,
          device_id,
          session_type,
          started_at,
          ended_at,
          status,
          connection_details
        `)
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      // Fetch device hostnames separately
      const deviceIds = (data || []).map(s => s.device_id).filter(Boolean);
      let deviceMap: Record<string, string> = {};
      
      if (deviceIds.length > 0) {
        const { data: devices } = await supabase
          .from('rmm_devices')
          .select('id, hostname')
          .in('id', deviceIds);
        
        if (devices) {
          deviceMap = devices.reduce((acc, d) => ({ ...acc, [d.id]: d.hostname }), {});
        }
      }
      
      return (data || []).map(session => ({
        ...session,
        device: deviceMap[session.device_id] ? { hostname: deviceMap[session.device_id] } : undefined
      })) as RemoteSession[];
    },
    enabled: !!user,
  });

  const calculateDuration = (session: RemoteSession) => {
    if (!session.ended_at) return null;
    return differenceInSeconds(new Date(session.ended_at), new Date(session.started_at));
  };

  const generateSessionSummary = async (session: RemoteSession) => {
    setIsGenerating(true);
    setSelectedSession(session);
    
    const durationSeconds = calculateDuration(session);
    
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-ai-ticket-processor', {
        body: {
          action: 'generate_session_summary',
          ticketData: {
            session_id: session.id,
            hostname: session.device?.hostname || session.device_id,
            session_type: session.session_type,
            started_at: session.started_at,
            ended_at: session.ended_at,
            duration_seconds: durationSeconds,
            connection_details: session.connection_details
          }
        }
      });

      if (error) throw error;

      setGeneratedSummary(data.summary);

      toast({
        title: "Summary Generated",
        description: "Session summary has been created.",
      });
    } catch (error: any) {
      console.error('Error generating session summary:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate session summary",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDuration = (session: RemoteSession) => {
    const seconds = calculateDuration(session);
    if (!seconds) return 'In Progress';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const copyToClipboard = () => {
    if (!generatedSummary || !selectedSession) return;
    
    const text = `
Remote Session Summary
=====================
Device: ${selectedSession.device?.hostname || selectedSession.device_id}
Date: ${format(new Date(selectedSession.started_at), 'PPpp')}
Duration: ${generatedSummary.duration_formatted}

Summary:
${generatedSummary.summary}

Actions Performed:
${generatedSummary.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Billing Notes:
${generatedSummary.billing_notes}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Summary copied to clipboard" });
  };

  const downloadSummary = () => {
    if (!generatedSummary || !selectedSession) return;
    
    const text = `
Remote Session Summary
=====================
Device: ${selectedSession.device?.hostname || selectedSession.device_id}
Date: ${format(new Date(selectedSession.started_at), 'PPpp')}
Duration: ${generatedSummary.duration_formatted}

Summary:
${generatedSummary.summary}

Actions Performed:
${generatedSummary.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Billing Notes:
${generatedSummary.billing_notes}
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-summary-${selectedSession.device?.hostname || selectedSession.device_id}-${format(new Date(selectedSession.started_at), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sessions */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Monitor className="h-5 w-5 text-cyan-400" />
              Recent Sessions
            </CardTitle>
            <CardDescription className="text-white/60">
              Select a session to generate a summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                </div>
              ) : sessions?.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No remote sessions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions?.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-white/5 ${
                        selectedSession?.id === session.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10'
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium flex items-center gap-2 text-white">
                            <Monitor className="h-4 w-4 text-cyan-400" />
                            {session.device?.hostname || session.device_id.slice(0, 8)}
                          </h4>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                              {session.session_type}
                            </Badge>
                            <Badge 
                              variant={session.status === 'active' ? 'default' : 'secondary'} 
                              className={`text-xs ${session.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/10 text-white/60'}`}
                            >
                              {session.status}
                            </Badge>
                            <span className="text-xs text-white/40 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(session)}
                            </span>
                            <span className="text-xs text-white/40">
                              {format(new Date(session.started_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateSessionSummary(session);
                          }}
                          disabled={isGenerating || session.status === 'active'}
                        >
                          {isGenerating && selectedSession?.id === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Generated Summary */}
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              Session Summary
            </CardTitle>
            <CardDescription className="text-white/60">
              AI-generated summary for billing and documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedSummary && selectedSession ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{selectedSession.device?.hostname || selectedSession.device_id.slice(0, 8)}</span>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">{generatedSummary.duration_formatted}</Badge>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    {format(new Date(selectedSession.started_at), 'PPpp')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Summary</h4>
                  <p className="text-sm text-white/60">
                    {generatedSummary.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    Actions Performed
                  </h4>
                  <ul className="space-y-1">
                    {generatedSummary.actions.map((action, i) => (
                      <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                        <span className="text-cyan-400 font-medium">{i + 1}.</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">Billing Notes</h4>
                  <p className="text-sm text-white/60 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                    {generatedSummary.billing_notes}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    onClick={downloadSummary}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-white/60">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50 text-cyan-400" />
                <p>Select a completed session and click the sparkle icon to generate a summary</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
