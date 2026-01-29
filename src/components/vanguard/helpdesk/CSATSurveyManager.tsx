import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Settings,
  Plus,
  BarChart3,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface SurveyResponse {
  id: string;
  ticketId: string;
  ticketTitle: string;
  clientName: string;
  rating: number;
  npsScore: number;
  feedback: string;
  createdAt: string;
  technicianName: string;
}

interface SurveyTemplate {
  id: string;
  name: string;
  triggerEvent: 'ticket_resolved' | 'after_response' | 'manual';
  questions: string[];
  isActive: boolean;
  responseRate: number;
}

const mockResponses: SurveyResponse[] = [
  { id: '1', ticketId: 'TKT-001', ticketTitle: 'Email sync issue', clientName: 'Acme Corp', rating: 5, npsScore: 10, feedback: 'Excellent support! Issue was resolved quickly.', createdAt: '2024-01-15T10:30:00Z', technicianName: 'John Smith' },
  { id: '2', ticketId: 'TKT-002', ticketTitle: 'VPN not connecting', clientName: 'TechStart Inc', rating: 4, npsScore: 8, feedback: 'Good service, took a bit longer than expected.', createdAt: '2024-01-14T15:45:00Z', technicianName: 'Sarah Johnson' },
  { id: '3', ticketId: 'TKT-003', ticketTitle: 'Printer offline', clientName: 'Global Logistics', rating: 3, npsScore: 5, feedback: 'Issue was fixed but communication could be better.', createdAt: '2024-01-13T09:00:00Z', technicianName: 'Mike Wilson' },
  { id: '4', ticketId: 'TKT-004', ticketTitle: 'Password reset', clientName: 'Acme Corp', rating: 5, npsScore: 9, feedback: '', createdAt: '2024-01-12T14:20:00Z', technicianName: 'John Smith' },
  { id: '5', ticketId: 'TKT-005', ticketTitle: 'Software installation', clientName: 'DataFlow Ltd', rating: 2, npsScore: 3, feedback: 'Had to follow up multiple times. Not satisfied.', createdAt: '2024-01-11T11:00:00Z', technicianName: 'Sarah Johnson' },
];

const mockTemplates: SurveyTemplate[] = [
  { id: '1', name: 'Post-Resolution Survey', triggerEvent: 'ticket_resolved', questions: ['How satisfied are you?', 'Would you recommend us?'], isActive: true, responseRate: 42 },
  { id: '2', name: 'Quick Feedback', triggerEvent: 'after_response', questions: ['Was this response helpful?'], isActive: false, responseRate: 65 },
];

const mockTrendData = [
  { date: 'Jan 8', csat: 4.2, nps: 45 },
  { date: 'Jan 9', csat: 4.0, nps: 42 },
  { date: 'Jan 10', csat: 4.5, nps: 55 },
  { date: 'Jan 11', csat: 3.8, nps: 38 },
  { date: 'Jan 12', csat: 4.3, nps: 50 },
  { date: 'Jan 13', csat: 4.1, nps: 48 },
  { date: 'Jan 14', csat: 4.4, nps: 52 },
  { date: 'Jan 15', csat: 4.6, nps: 58 },
];

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
  const [responses] = useState<SurveyResponse[]>(mockResponses);
  const [templates] = useState<SurveyTemplate[]>(mockTemplates);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Calculate metrics
  const avgCsat = responses.reduce((sum, r) => sum + r.rating, 0) / responses.length;
  const avgNps = responses.reduce((sum, r) => sum + r.npsScore, 0) / responses.length;
  const promoters = responses.filter(r => r.npsScore >= 9).length;
  const passives = responses.filter(r => r.npsScore >= 7 && r.npsScore < 9).length;
  const detractors = responses.filter(r => r.npsScore < 7).length;
  const npsScore = Math.round(((promoters - detractors) / responses.length) * 100);

  const pieData = [
    { name: 'Promoters', value: promoters, color: 'hsl(142, 76%, 36%)' },
    { name: 'Passives', value: passives, color: 'hsl(45, 93%, 47%)' },
    { name: 'Detractors', value: detractors, color: 'hsl(0, 84%, 60%)' },
  ];

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
                <p className="text-xs text-muted-foreground uppercase">Response Rate</p>
                <p className="text-3xl font-bold">42%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8% this month</span>
                </div>
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
              <TabsTrigger value="technicians">By Technician</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4 space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CSAT Trend (7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockTrendData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis domain={[1, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Line type="monotone" dataKey="csat" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* NPS Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">NPS Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              </div>

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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Responses Tab */}
            <TabsContent value="responses" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>NPS</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map(response => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{response.ticketId}</p>
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
                      <TableCell>{response.technicianName}</TableCell>
                      <TableCell>{format(new Date(response.createdAt), 'MMM dd')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Templates Tab */}
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
                        <Input placeholder="Post-Resolution Survey" />
                      </div>
                      <div className="space-y-2">
                        <Label>Trigger Event</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                            <SelectItem value="after_response">After Response</SelectItem>
                            <SelectItem value="manual">Manual Send</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Survey Questions</Label>
                        <Textarea placeholder="Enter each question on a new line" className="min-h-[100px]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                      <Button onClick={() => setShowTemplateDialog(false)}>Save Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {templates.map(template => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{template.name}</p>
                            <Badge variant="outline">{template.triggerEvent.replace('_', ' ')}</Badge>
                            {template.isActive && <Badge variant="default">Active</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{template.questions.length} questions</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{template.responseRate}%</p>
                          <p className="text-xs text-muted-foreground">Response Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* By Technician Tab */}
            <TabsContent value="technicians" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead>Avg Rating</TableHead>
                    <TableHead>NPS</TableHead>
                    <TableHead>Total Responses</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['John Smith', 'Sarah Johnson', 'Mike Wilson'].map(tech => {
                    const techResponses = responses.filter(r => r.technicianName === tech);
                    const techAvg = techResponses.reduce((sum, r) => sum + r.rating, 0) / techResponses.length;
                    const techNps = Math.round(
                      ((techResponses.filter(r => r.npsScore >= 9).length - 
                        techResponses.filter(r => r.npsScore < 7).length) / 
                        techResponses.length) * 100
                    );
                    
                    return (
                      <TableRow key={tech}>
                        <TableCell className="font-medium">{tech}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StarRating rating={Math.round(techAvg)} />
                            <span>{techAvg.toFixed(1)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={techNps >= 50 ? 'default' : techNps >= 0 ? 'secondary' : 'destructive'}>
                            {techNps}
                          </Badge>
                        </TableCell>
                        <TableCell>{techResponses.length}</TableCell>
                        <TableCell>
                          {techNps >= 50 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
