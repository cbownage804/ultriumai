import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquareText, Clock, Search, Users, Sparkles, Loader2, 
  Send, AlertTriangle, Target, TrendingUp, TrendingDown, Minus,
  Copy, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function CortexAIToolsExtended() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'response' | 'sla' | 'rootcause' | 'health'>('response');
  const [isProcessing, setIsProcessing] = useState(false);

  // Response Draft State
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [responseTone, setResponseTone] = useState('professional');
  const [draftResult, setDraftResult] = useState<any>(null);

  // SLA Predictor State
  const [ticketsJson, setTicketsJson] = useState('');
  const [slaResult, setSlaResult] = useState<any>(null);

  // Root Cause State
  const [incidentsJson, setIncidentsJson] = useState('');
  const [rootCauseResult, setRootCauseResult] = useState<any>(null);

  // Customer Health State
  const [healthCustomerName, setHealthCustomerName] = useState('');
  const [ticketHistoryJson, setTicketHistoryJson] = useState('');
  const [csatJson, setCsatJson] = useState('');
  const [healthResult, setHealthResult] = useState<any>(null);

  const handleResponseDraft = async () => {
    if (!ticketTitle || !ticketDescription) {
      toast.error('Please enter ticket title and description');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-response-draft', {
        body: {
          ticketTitle,
          ticketDescription,
          customerName,
          tone: responseTone,
          userId: user?.id
        }
      });

      if (error) throw error;
      setDraftResult(data.draft);
      toast.success('Response draft generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate draft');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSlaPredict = async () => {
    let tickets;
    try {
      tickets = JSON.parse(ticketsJson);
    } catch {
      toast.error('Please enter valid JSON tickets');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sla-predictor', {
        body: { tickets, userId: user?.id }
      });

      if (error) throw error;
      setSlaResult(data);
      toast.success('SLA analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to predict SLA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRootCause = async () => {
    let incidents;
    try {
      incidents = JSON.parse(incidentsJson);
    } catch {
      toast.error('Please enter valid JSON incidents');
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-root-cause', {
        body: { incidents, userId: user?.id }
      });

      if (error) throw error;
      setRootCauseResult(data);
      toast.success('Root cause analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomerHealth = async () => {
    if (!healthCustomerName) {
      toast.error('Please enter customer name');
      return;
    }

    setIsProcessing(true);
    try {
      const body: any = {
        customerName: healthCustomerName,
        userId: user?.id
      };
      
      if (ticketHistoryJson) {
        try { body.ticketHistory = JSON.parse(ticketHistoryJson); } catch {}
      }
      if (csatJson) {
        try { body.csatScores = JSON.parse(csatJson); } catch {}
      }

      const { data, error } = await supabase.functions.invoke('ai-customer-health', { body });

      if (error) throw error;
      setHealthResult(data);
      toast.success('Health score calculated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to calculate health');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-green-500/20 text-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'response' ? 'default' : 'outline'}
          onClick={() => setActiveTab('response')}
          className={activeTab === 'response' ? 'bg-indigo-500' : ''}
        >
          <MessageSquareText className="h-4 w-4 mr-2" />
          Response Draft
        </Button>
        <Button
          variant={activeTab === 'sla' ? 'default' : 'outline'}
          onClick={() => setActiveTab('sla')}
          className={activeTab === 'sla' ? 'bg-cyan-500' : ''}
        >
          <Clock className="h-4 w-4 mr-2" />
          SLA Predictor
        </Button>
        <Button
          variant={activeTab === 'rootcause' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rootcause')}
          className={activeTab === 'rootcause' ? 'bg-violet-500' : ''}
        >
          <Search className="h-4 w-4 mr-2" />
          Root Cause
        </Button>
        <Button
          variant={activeTab === 'health' ? 'default' : 'outline'}
          onClick={() => setActiveTab('health')}
          className={activeTab === 'health' ? 'bg-teal-500' : ''}
        >
          <Users className="h-4 w-4 mr-2" />
          Customer Health
        </Button>
      </div>

      {/* Response Draft Tab */}
      {activeTab === 'response' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-indigo-400" />
                AI Response Draft Generator
              </CardTitle>
              <CardDescription>Generate professional ticket responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <Input 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                    className="bg-slate-900/50 border-slate-700"
                  />
                </div>
                <div>
                  <Label>Tone</Label>
                  <Select value={responseTone} onValueChange={setResponseTone}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="empathetic">Empathetic</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Ticket Title</Label>
                <Input 
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="Email not syncing on mobile"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label>Ticket Description</Label>
                <Textarea 
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Customer reports that their Outlook mobile app stopped syncing emails 2 days ago..."
                  className="bg-slate-900/50 border-slate-700 min-h-[120px]"
                />
              </div>
              <Button 
                onClick={handleResponseDraft} 
                disabled={isProcessing}
                className="w-full bg-indigo-500 hover:bg-indigo-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Generate Response
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-indigo-500/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Generated Draft</CardTitle>
              {draftResult?.draftResponse && (
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(draftResult.draftResponse)}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {draftResult ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge className="bg-indigo-500/20 text-indigo-400">{draftResult.responseType}</Badge>
                      <Badge variant="outline">{draftResult.confidenceLevel} confidence</Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-slate-200 whitespace-pre-wrap">{draftResult.draftResponse}</p>
                    </div>
                    {draftResult.followUpActions?.length > 0 && (
                      <div className="p-3 rounded-lg bg-indigo-500/10">
                        <Label className="text-indigo-400 text-xs">Follow-up Actions</Label>
                        <ul className="text-sm text-slate-300 list-disc list-inside mt-1">
                          {draftResult.followUpActions.map((a: string, i: number) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <MessageSquareText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter ticket details to generate a response</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SLA Predictor Tab */}
      {activeTab === 'sla' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-400" />
                AI SLA Predictor
              </CardTitle>
              <CardDescription>Predict SLA breaches before they happen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tickets (JSON Array)</Label>
                <Textarea 
                  value={ticketsJson}
                  onChange={(e) => setTicketsJson(e.target.value)}
                  placeholder='[{"id": "TKT-001", "title": "Server down", "priority": "high", "created": "2025-01-30T10:00:00Z", "slaDeadline": "2025-01-31T10:00:00Z"}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleSlaPredict} 
                disabled={isProcessing}
                className="w-full bg-cyan-500 hover:bg-cyan-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Target className="h-4 w-4 mr-2" />}
                Predict SLA Risks
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-white">SLA Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {slaResult?.predictions ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    {slaResult.summary && (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-slate-800/50">
                          <div className="text-lg font-bold text-white">{slaResult.summary.totalTicketsAnalyzed}</div>
                          <div className="text-xs text-slate-400">Analyzed</div>
                        </div>
                        <div className="p-2 rounded bg-red-500/10">
                          <div className="text-lg font-bold text-red-400">{slaResult.summary.highRiskCount}</div>
                          <div className="text-xs text-slate-400">High Risk</div>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10">
                          <div className="text-lg font-bold text-amber-400">{slaResult.summary.mediumRiskCount}</div>
                          <div className="text-xs text-slate-400">Medium Risk</div>
                        </div>
                        <div className="p-2 rounded bg-green-500/10">
                          <div className="text-lg font-bold text-green-400">{slaResult.summary.lowRiskCount}</div>
                          <div className="text-xs text-slate-400">Low Risk</div>
                        </div>
                      </div>
                    )}
                    {slaResult.predictions.map((p: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border-l-2 ${
                        p.breachRisk === 'high' ? 'bg-red-500/10 border-red-500' :
                        p.breachRisk === 'medium' ? 'bg-amber-500/10 border-amber-500' :
                        'bg-green-500/10 border-green-500'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{p.ticketTitle || p.ticketId}</span>
                          <Badge className={getRiskBadge(p.breachRisk)}>{p.breachProbability}%</Badge>
                        </div>
                        <p className="text-xs text-slate-400">Time remaining: {p.timeRemaining}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Submit tickets to predict SLA risks</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Root Cause Tab */}
      {activeTab === 'rootcause' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-violet-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-violet-400" />
                AI Root Cause Analyzer
              </CardTitle>
              <CardDescription>Identify root causes of recurring issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Incidents/Tickets (JSON)</Label>
                <Textarea 
                  value={incidentsJson}
                  onChange={(e) => setIncidentsJson(e.target.value)}
                  placeholder='[{"id": "INC-001", "title": "Network slowdown", "description": "...", "occurredAt": "...", "affectedSystems": ["router-1"]}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[200px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleRootCause} 
                disabled={isProcessing}
                className="w-full bg-violet-500 hover:bg-violet-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Analyze Root Causes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-violet-500/30">
            <CardHeader>
              <CardTitle className="text-white">Root Cause Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {rootCauseResult?.rootCauses ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm">{rootCauseResult.summary}</p>
                    {rootCauseResult.rootCauses.map((rc: any, i: number) => (
                      <div key={i} className={`p-3 rounded-lg border-l-2 ${
                        rc.severity === 'critical' ? 'bg-red-500/10 border-red-500' :
                        rc.severity === 'high' ? 'bg-orange-500/10 border-orange-500' :
                        'bg-violet-500/10 border-violet-500'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{rc.title}</span>
                          <Badge variant="outline">{rc.confidence}%</Badge>
                        </div>
                        <p className="text-sm text-slate-400">{rc.description}</p>
                        {rc.permanentFix && (
                          <div className="mt-2 p-2 rounded bg-green-500/10">
                            <Label className="text-green-400 text-xs">Fix</Label>
                            <p className="text-xs text-slate-300">{rc.permanentFix}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Submit incidents to find root causes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Health Tab */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/60 border-teal-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-400" />
                AI Customer Health Score
              </CardTitle>
              <CardDescription>Calculate customer health & churn risk</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Customer Name</Label>
                <Input 
                  value={healthCustomerName}
                  onChange={(e) => setHealthCustomerName(e.target.value)}
                  placeholder="Acme Corporation"
                  className="bg-slate-900/50 border-slate-700"
                />
              </div>
              <div>
                <Label>Ticket History (Optional JSON)</Label>
                <Textarea 
                  value={ticketHistoryJson}
                  onChange={(e) => setTicketHistoryJson(e.target.value)}
                  placeholder='[{"title": "...", "priority": "high", "resolved": true}]'
                  className="bg-slate-900/50 border-slate-700 min-h-[80px] font-mono text-sm"
                />
              </div>
              <div>
                <Label>CSAT Scores (Optional JSON)</Label>
                <Textarea 
                  value={csatJson}
                  onChange={(e) => setCsatJson(e.target.value)}
                  placeholder='{"nps": 8, "csat": [5, 4, 5, 3]}'
                  className="bg-slate-900/50 border-slate-700 min-h-[60px] font-mono text-sm"
                />
              </div>
              <Button 
                onClick={handleCustomerHealth} 
                disabled={isProcessing}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                Calculate Health Score
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-black/60 border-teal-500/30">
            <CardHeader>
              <CardTitle className="text-white">Health Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {healthResult?.healthScore !== undefined ? (
                <ScrollArea className="h-[350px]">
                  <div className="space-y-4">
                    <div className="text-center p-4 rounded-lg bg-slate-800/50">
                      <div className={`text-5xl font-bold ${getHealthColor(healthResult.healthScore)}`}>
                        {healthResult.healthScore}
                      </div>
                      <div className="text-slate-400 text-sm">Health Score</div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <Badge className={getRiskBadge(healthResult.churnRisk)}>
                          {healthResult.churnRisk} churn risk
                        </Badge>
                        <Badge className={
                          healthResult.healthStatus === 'healthy' ? 'bg-green-500' :
                          healthResult.healthStatus === 'at-risk' ? 'bg-amber-500' : 'bg-red-500'
                        }>
                          {healthResult.healthStatus}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{healthResult.executiveSummary}</p>
                    {healthResult.nextBestActions?.length > 0 && (
                      <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30">
                        <Label className="text-teal-400 text-xs">Next Best Actions</Label>
                        <ul className="text-sm text-slate-300 list-decimal list-inside mt-1">
                          {healthResult.nextBestActions.map((a: string, i: number) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Enter customer details to calculate health</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
