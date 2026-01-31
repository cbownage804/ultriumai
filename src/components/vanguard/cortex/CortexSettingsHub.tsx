import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, Brain, Zap, Shield, Bell, Clock, 
  DollarSign, Users, Gauge, Save, RefreshCw,
  Bot, MessageSquare, Route, Search, Activity,
  Terminal, Heart, FileText, Mail, HardDrive, Mic
} from 'lucide-react';

interface AIToolConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  autoExecute: boolean;
  confidenceThreshold: number;
  notifications: boolean;
}

export function CortexSettingsHub() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [globalSettings, setGlobalSettings] = useState({
    aiEnabled: true,
    defaultModel: 'google/gemini-3-flash-preview',
    maxTokens: 2000,
    temperature: 0.3,
    rateLimitPerMinute: 60,
    loggingEnabled: true,
    costTrackingEnabled: true,
    monthlyBudget: 500,
    notifyOnBudgetThreshold: 80
  });

  const [toolConfigs, setToolConfigs] = useState<AIToolConfig[]>([
    { id: 'ticket-router', name: 'AI Ticket Router', icon: Route, enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: true },
    { id: 'escalation', name: 'Escalation Engine', icon: Zap, enabled: true, autoExecute: false, confidenceThreshold: 90, notifications: true },
    { id: 'summarizer', name: 'Ticket Summarizer', icon: FileText, enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: false },
    { id: 'sentiment', name: 'Sentiment Analyzer', icon: Heart, enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: true },
    { id: 'response-draft', name: 'Response Draft', icon: MessageSquare, enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: false },
    { id: 'sla-predictor', name: 'SLA Predictor', icon: Clock, enabled: true, autoExecute: true, confidenceThreshold: 80, notifications: true },
    { id: 'root-cause', name: 'Root Cause Analyzer', icon: Search, enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true },
    { id: 'customer-health', name: 'Customer Health', icon: Users, enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: true },
    { id: 'anomaly', name: 'Anomaly Detection', icon: Activity, enabled: true, autoExecute: true, confidenceThreshold: 90, notifications: true },
    { id: 'script-gen', name: 'Script Generator', icon: Terminal, enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
    { id: 'email-parser', name: 'Email Parser', icon: Mail, enabled: true, autoExecute: true, confidenceThreshold: 85, notifications: false },
    { id: 'asset-analyzer', name: 'Asset Analyzer', icon: HardDrive, enabled: true, autoExecute: false, confidenceThreshold: 80, notifications: false },
    { id: 'voice-to-ticket', name: 'Voice to Ticket', icon: Mic, enabled: true, autoExecute: true, confidenceThreshold: 75, notifications: false },
    { id: 'kb-generator', name: 'KB Generator', icon: Bot, enabled: true, autoExecute: false, confidenceThreshold: 85, notifications: true }
  ]);

  const [systemPrompts, setSystemPrompts] = useState({
    ticketRouter: 'You are an intelligent ticket routing system. Analyze tickets and recommend optimal technician assignment based on skills, workload, and expertise.',
    responseDraft: 'You are a professional support assistant. Generate clear, empathetic, and solution-focused responses for customer tickets.',
    summarizer: 'You are a ticket summarization expert. Extract key points, actions taken, and current status from ticket threads.',
    general: 'You are Cortex AI, an intelligent MSP assistant specializing in IT support, security, and operations.'
  });

  const toggleTool = (toolId: string) => {
    setToolConfigs(prev => prev.map(tool => 
      tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
    ));
  };

  const updateToolConfig = (toolId: string, field: keyof AIToolConfig, value: any) => {
    setToolConfigs(prev => prev.map(tool =>
      tool.id === toolId ? { ...tool, [field]: value } : tool
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast({
      title: "Settings Saved",
      description: "Cortex AI configuration has been updated"
    });
  };

  const enabledCount = toolConfigs.filter(t => t.enabled).length;
  const autoCount = toolConfigs.filter(t => t.enabled && t.autoExecute).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{enabledCount}</p>
                <p className="text-sm text-muted-foreground">AI Tools Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">{autoCount}</p>
                <p className="text-sm text-muted-foreground">Auto-Execute</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">$127</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Gauge className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">2,847</p>
                <p className="text-sm text-muted-foreground">Requests Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tools" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tools">AI Tools</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="prompts">System Prompts</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    AI Tool Configuration
                  </CardTitle>
                  <CardDescription>
                    Enable/disable tools and configure auto-execution settings
                  </CardDescription>
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {toolConfigs.map((tool) => (
                  <div
                    key={tool.id}
                    className={`p-4 border rounded-lg transition-all ${
                      tool.enabled ? 'border-purple-500/30 bg-purple-500/5' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          tool.enabled ? 'bg-purple-500/20' : 'bg-muted'
                        }`}>
                          <tool.icon className={`h-5 w-5 ${tool.enabled ? 'text-purple-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{tool.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {tool.enabled && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {tool.confidenceThreshold}% threshold
                                </Badge>
                                {tool.autoExecute && (
                                  <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                                    Auto-Execute
                                  </Badge>
                                )}
                                {tool.notifications && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Bell className="h-2 w-2 mr-1" />
                                    Alerts
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {tool.enabled && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Auto</span>
                              <Switch
                                checked={tool.autoExecute}
                                onCheckedChange={(v) => updateToolConfig(tool.id, 'autoExecute', v)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Notify</span>
                              <Switch
                                checked={tool.notifications}
                                onCheckedChange={(v) => updateToolConfig(tool.id, 'notifications', v)}
                              />
                            </div>
                            <div className="w-24">
                              <Slider
                                value={[tool.confidenceThreshold]}
                                onValueChange={([v]) => updateToolConfig(tool.id, 'confidenceThreshold', v)}
                                min={50}
                                max={100}
                                step={5}
                              />
                            </div>
                          </>
                        )}
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={() => toggleTool(tool.id)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">AI Processing Enabled</p>
                  <p className="text-sm text-muted-foreground">Master switch for all AI features</p>
                </div>
                <Switch
                  checked={globalSettings.aiEnabled}
                  onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, aiEnabled: v })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Model</label>
                  <Select
                    value={globalSettings.defaultModel}
                    onValueChange={(v) => setGlobalSettings({ ...globalSettings, defaultModel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash (Fast)</SelectItem>
                      <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</SelectItem>
                      <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</SelectItem>
                      <SelectItem value="openai/gpt-5-mini">GPT-5 Mini (Fast)</SelectItem>
                      <SelectItem value="openai/gpt-5">GPT-5 (Advanced)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input
                    type="number"
                    value={globalSettings.maxTokens}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, maxTokens: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature: {globalSettings.temperature}</label>
                <Slider
                  value={[globalSettings.temperature * 100]}
                  onValueChange={([v]) => setGlobalSettings({ ...globalSettings, temperature: v / 100 })}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Lower = more focused, Higher = more creative</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Request Logging</p>
                  <p className="text-sm text-muted-foreground">Log all AI requests for debugging</p>
                </div>
                <Switch
                  checked={globalSettings.loggingEnabled}
                  onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, loggingEnabled: v })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                System Prompts
              </CardTitle>
              <CardDescription>
                Customize the AI behavior for different tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">General Assistant Prompt</label>
                <Textarea
                  value={systemPrompts.general}
                  onChange={(e) => setSystemPrompts({ ...systemPrompts, general: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket Router Prompt</label>
                <Textarea
                  value={systemPrompts.ticketRouter}
                  onChange={(e) => setSystemPrompts({ ...systemPrompts, ticketRouter: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Response Draft Prompt</label>
                <Textarea
                  value={systemPrompts.responseDraft}
                  onChange={(e) => setSystemPrompts({ ...systemPrompts, responseDraft: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Summarizer Prompt</label>
                <Textarea
                  value={systemPrompts.summarizer}
                  onChange={(e) => setSystemPrompts({ ...systemPrompts, summarizer: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Prompts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Usage & Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Cost Tracking</p>
                  <p className="text-sm text-muted-foreground">Track AI usage costs</p>
                </div>
                <Switch
                  checked={globalSettings.costTrackingEnabled}
                  onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, costTrackingEnabled: v })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Budget ($)</label>
                  <Input
                    type="number"
                    value={globalSettings.monthlyBudget}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, monthlyBudget: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert at % of Budget</label>
                  <Input
                    type="number"
                    value={globalSettings.notifyOnBudgetThreshold}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, notifyOnBudgetThreshold: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rate Limit (requests/minute)</label>
                <Slider
                  value={[globalSettings.rateLimitPerMinute]}
                  onValueChange={([v]) => setGlobalSettings({ ...globalSettings, rateLimitPerMinute: v })}
                  min={10}
                  max={120}
                  step={10}
                />
                <p className="text-xs text-muted-foreground">{globalSettings.rateLimitPerMinute} requests per minute</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Current Month Usage</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-400">45,231</p>
                    <p className="text-xs text-muted-foreground">Total Requests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">2.1M</p>
                    <p className="text-xs text-muted-foreground">Tokens Used</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">$127.45</p>
                    <p className="text-xs text-muted-foreground">Estimated Cost</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
