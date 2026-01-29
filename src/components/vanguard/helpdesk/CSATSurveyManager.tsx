import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  MessageSquare,
  TrendingUp,
  Users,
  Mail,
  Plus,
  BarChart3,
  Smile,
  Meh,
  Frown,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SurveyResponse {
  id: string;
  ticketId?: string;
  ticketTitle?: string;
  clientName: string;
  rating: number;
  npsScore: number;
  feedback?: string;
  createdAt: string;
  technicianName?: string;
}

interface SurveyTemplate {
  id: string;
  name: string;
  triggerEvent: 'ticket_resolved' | 'after_response' | 'manual';
  questions: string[];
  isActive: boolean;
  responseRate: number;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star 
          key={star} 
          className={cn(
            starSize,
            star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'
          )} 
        />
      ))}
    </div>
  );
}

function NPSBadge({ score }: { score: number }) {
  const type = score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor';
  const colors = {
    promoter: 'bg-green-500/10 text-green-500 border-green-500/30',
    passive: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    detractor: 'bg-red-500/10 text-red-500 border-red-500/30',
  };
  const labels = { promoter: 'Promoter', passive: 'Passive', detractor: 'Detractor' };
  
  return (
    <Badge variant="outline" className={colors[type]}>
      {score} - {labels[type]}
    </Badge>
  );
}

export function CSATSurveyManager() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState({ name: '', triggerEvent: 'ticket_resolved' as const });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [responseRes, templateRes] = await Promise.all([
        (supabase as any).from('vanguard_survey_responses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('vanguard_survey_templates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (responseRes.data) {
        setResponses(responseRes.data.map((r: any) => ({
          id: r.id,
          ticketId: r.ticket_id,
          ticketTitle: r.ticket_title,
          clientName: r.client_name || 'Unknown',
          rating: r.rating || 0,
          npsScore: r.nps_score || 0,
          feedback: r.feedback,
          createdAt: r.created_at,
          technicianName: r.technician_name
        })));
      }

      if (templateRes.data) {
        setTemplates(templateRes.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          triggerEvent: t.trigger_event,
          questions: t.questions || [],
          isActive: t.is_active,
          responseRate: t.response_rate || 0
        })));
      }
    } catch (error) {
      console.error('Error loading survey data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!user || !newTemplate.name) return;
    try {
      const { error } = await (supabase as any).from('vanguard_survey_templates').insert({
        user_id: user.id,
        name: newTemplate.name,
        trigger_event: newTemplate.triggerEvent,
        questions: [],
        is_active: true
      });
      if (error) throw error;
      toast.success('Template created');
      setShowTemplateDialog(false);
      setNewTemplate({ name: '', triggerEvent: 'ticket_resolved' });
      loadData();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  };

  // Calculate metrics
  const avgCsat = responses.length > 0 ? responses.reduce((sum, r) => sum + r.rating, 0) / responses.length : 0;
  const avgNps = responses.length > 0 ? responses.reduce((sum, r) => sum + r.npsScore, 0) / responses.length : 0;
  const promoters = responses.filter(r => r.npsScore >= 9).length;
  const passives = responses.filter(r => r.npsScore >= 7 && r.npsScore < 9).length;
  const detractors = responses.filter(r => r.npsScore < 7).length;
  const npsScore = responses.length > 0 ? Math.round(((promoters - detractors) / responses.length) * 100) : 0;

  const pieData = [
    { name: 'Promoters', value: promoters, color: 'hsl(142, 76%, 36%)' },
    { name: 'Passives', value: passives, color: 'hsl(45, 93%, 47%)' },
    { name: 'Detractors', value: detractors, color: 'hsl(0, 84%, 60%)' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">CSAT Score</p>
                <p className="text-3xl font-bold">{avgCsat.toFixed(1)}</p>
                <StarRating rating={Math.round(avgCsat)} />
              </div>
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          npsScore >= 50 ? "border-green-500/30 bg-green-500/5" :
          npsScore >= 0 ? "border-yellow-500/30 bg-yellow-500/5" :
          "border-red-500/30 bg-red-500/5"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">NPS Score</p>
                <p className={cn(
                  "text-3xl font-bold",
                  npsScore >= 50 ? "text-green-500" :
                  npsScore >= 0 ? "text-yellow-500" : "text-red-500"
                )}>{npsScore}</p>
                <div className="flex items-center gap-1 mt-1">
                  {npsScore >= 50 ? (
                    <>
                      <Smile className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-500">Excellent</span>
                    </>
                  ) : npsScore >= 0 ? (
                    <>
                      <Meh className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-yellow-500">Good</span>
                    </>
                  ) : (
                    <>
                      <Frown className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-500">Needs Work</span>
                    </>
                  )}
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Responses</p>
                <p className="text-3xl font-bold">{responses.length}</p>
                <p className="text-xs text-muted-foreground">{responses.filter(r => r.feedback).length} with comments</p>
              </div>
              <MessageSquare className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Templates</p>
                <p className="text-3xl font-bold">{templates.filter(t => t.isActive).length}</p>
                <p className="text-xs text-muted-foreground">of {templates.length} total</p>
              </div>
              <Mail className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-cyan-500" />
                Customer Satisfaction Surveys
              </CardTitle>
              <CardDescription>Track and analyze customer feedback</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="responses">Responses</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* NPS Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">NPS Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {responses.length > 0 ? (
                      <>
                        <div className="h-[200px] flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px'
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 mt-2">
                          {pieData.map(item => (
                            <div key={item.name} className="flex items-center gap-1 text-xs">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span>{item.name}: {item.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No survey responses yet
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Feedback */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {responses.filter(r => r.feedback).slice(0, 3).map(response => (
                        <div key={response.id} className="p-3 rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <StarRating rating={response.rating} />
                              <span className="text-sm font-medium">{response.clientName}</span>
                            </div>
                            <NPSBadge score={response.npsScore} />
                          </div>
                          <p className="text-sm text-muted-foreground">{response.feedback}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {response.ticketId} • {format(new Date(response.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      ))}
                      {responses.filter(r => r.feedback).length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No feedback comments yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="responses" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>NPS</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No survey responses yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    responses.map(response => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{response.ticketId || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{response.ticketTitle}</p>
                          </div>
                        </TableCell>
                        <TableCell>{response.clientName}</TableCell>
                        <TableCell>
                          <StarRating rating={response.rating} />
                        </TableCell>
                        <TableCell>
                          <NPSBadge score={response.npsScore} />
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {response.feedback ? (
                            <p className="text-sm text-muted-foreground truncate">{response.feedback}</p>
                          ) : (
                            <span className="text-xs text-muted-foreground">No comment</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(response.createdAt), 'MMM dd')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <div className="flex justify-end mb-4">
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Survey Template</DialogTitle>
                      <DialogDescription>Configure when and how surveys are sent</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input 
                          placeholder="Post-Resolution Survey"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Trigger Event</Label>
                        <Select 
                          value={newTemplate.triggerEvent}
                          onValueChange={(val) => setNewTemplate(prev => ({ ...prev, triggerEvent: val as any }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                            <SelectItem value="after_response">After Response</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateTemplate}>Create Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No survey templates yet</p>
                  </div>
                ) : (
                  templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{template.name}</p>
                              <Badge variant="outline">{template.triggerEvent.replace('_', ' ')}</Badge>
                              {template.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {template.questions.length} questions • {template.responseRate}% response rate
                            </p>
                          </div>
                          <Switch checked={template.isActive} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}