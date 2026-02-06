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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Settings, Brain, Zap, Shield, Bell, Clock, 
  DollarSign, Gauge, Save, RefreshCw, ChevronDown,
  MessageSquare, Power, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useCortexFeatures, type CortexModule } from '@/hooks/useCortexFeatures';

const MODULE_ICONS: Record<string, string> = {
  helpdesk: '🎫', atlas: '📚', pursuit: '🛡️', rmm: '⚙️', sentinel: '🔶', general: '🤖',
};

const MODULE_COLORS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/5', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-400' },
  cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400' },
  red: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400' },
  amber: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
};

export function CortexSettingsHub() {
  const { toast } = useToast();
  const { modules, toggleFeature, updateFeature, toggleAllInModule, enabledCount, totalCount } = useCortexFeatures();
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [globalSettings, setGlobalSettings] = useState({
    aiEnabled: true,
    defaultModel: 'google/gemini-3-flash-preview',
    maxTokens: 2000,
    temperature: 0.3,
    rateLimitPerMinute: 60,
    loggingEnabled: true,
    costTrackingEnabled: true,
    monthlyBudget: 500,
    notifyOnBudgetThreshold: 80,
  });

  const [systemPrompts, setSystemPrompts] = useState({
    ticketRouter: 'You are an intelligent ticket routing system. Analyze tickets and recommend optimal technician assignment based on skills, workload, and expertise.',
    responseDraft: 'You are a professional support assistant. Generate clear, empathetic, and solution-focused responses for customer tickets.',
    summarizer: 'You are a ticket summarization expert. Extract key points, actions taken, and current status from ticket threads.',
    general: 'You are Cortex AI, an intelligent MSP assistant specializing in IT support, security, and operations.',
  });

  const autoCount = modules.reduce((s, m) => s + m.features.filter(f => f.enabled && f.autoExecute).length, 0);

  const toggleModule = (modId: string) => {
    setExpandedModules(prev => ({ ...prev, [modId]: !prev[modId] }));
  };

  const saveSettings = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast({ title: 'Settings Saved', description: 'Cortex AI configuration has been updated' });
  };

  const renderModuleCard = (mod: CortexModule) => {
    const colors = MODULE_COLORS[mod.color] || MODULE_COLORS.purple;
    const enabledInModule = mod.features.filter(f => f.enabled).length;
    const allEnabled = enabledInModule === mod.features.length;
    const isOpen = expandedModules[mod.id] ?? false;

    return (
      <Card key={mod.id} className={`${colors.border} ${colors.bg} transition-all`}>
        <Collapsible open={isOpen} onOpenChange={() => toggleModule(mod.id)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{MODULE_ICONS[mod.id] || '🤖'}</span>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {mod.name}
                      <Badge className={colors.badge}>
                        {enabledInModule}/{mod.features.length} active
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">{mod.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => { e.stopPropagation(); toggleAllInModule(mod.id, !allEnabled); }}
                  >
                    {allEnabled ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                    {allEnabled ? 'Disable All' : 'Enable All'}
                  </Button>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-2">
              {mod.features.map(feature => (
                <div
                  key={feature.id}
                  className={`p-3 border rounded-lg transition-all ${
                    feature.enabled ? `${colors.border} bg-white/[0.02]` : 'border-border/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{feature.name}</p>
                        {feature.enabled && feature.autoExecute && (
                          <Badge variant="outline" className="text-[10px] px-1.5">Auto</Badge>
                        )}
                        {feature.enabled && feature.notifications && (
                          <Badge variant="secondary" className="text-[10px] px-1.5">
                            <Bell className="h-2 w-2 mr-0.5" />Alerts
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{feature.description}</p>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      {feature.enabled && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Auto</span>
                            <Switch
                              checked={feature.autoExecute}
                              onCheckedChange={(v) => updateFeature(feature.id, { autoExecute: v })}
                              className="scale-75"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Notify</span>
                            <Switch
                              checked={feature.notifications}
                              onCheckedChange={(v) => updateFeature(feature.id, { notifications: v })}
                              className="scale-75"
                            />
                          </div>
                          <div className="w-16">
                            <Slider
                              value={[feature.confidenceThreshold]}
                              onValueChange={([v]) => updateFeature(feature.id, { confidenceThreshold: v })}
                              min={50} max={100} step={5}
                            />
                            <span className="text-[9px] text-muted-foreground block text-center">{feature.confidenceThreshold}%</span>
                          </div>
                        </>
                      )}
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

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
                <p className="text-2xl font-bold text-blue-400">{totalCount}</p>
                <p className="text-sm text-muted-foreground">Total Features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="modules">Features by Module</TabsTrigger>
          <TabsTrigger value="global">Global Settings</TabsTrigger>
          <TabsTrigger value="prompts">System Prompts</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
        </TabsList>

        {/* Features by Module Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                AI Features by Module
              </h3>
              <p className="text-sm text-muted-foreground">
                Activate or deactivate AI features organized by their parent module
              </p>
            </div>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map(mod => renderModuleCard(mod))}
          </div>
        </TabsContent>

        {/* Global Settings Tab */}
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
                  <Select value={globalSettings.defaultModel} onValueChange={(v) => setGlobalSettings({ ...globalSettings, defaultModel: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <Input type="number" value={globalSettings.maxTokens} onChange={(e) => setGlobalSettings({ ...globalSettings, maxTokens: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature: {globalSettings.temperature}</label>
                <Slider value={[globalSettings.temperature * 100]} onValueChange={([v]) => setGlobalSettings({ ...globalSettings, temperature: v / 100 })} min={0} max={100} step={5} />
                <p className="text-xs text-muted-foreground">Lower = more focused, Higher = more creative</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Request Logging</p>
                  <p className="text-sm text-muted-foreground">Log all AI requests for debugging</p>
                </div>
                <Switch checked={globalSettings.loggingEnabled} onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, loggingEnabled: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                System Prompts
              </CardTitle>
              <CardDescription>Customize the AI behavior for different tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(systemPrompts).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Prompt</label>
                  <Textarea value={value} onChange={(e) => setSystemPrompts({ ...systemPrompts, [key]: e.target.value })} rows={3} />
                </div>
              ))}
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Prompts
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage & Limits Tab */}
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
                  <p className="text-sm text-muted-foreground">Track AI usage costs across all modules</p>
                </div>
                <Switch checked={globalSettings.costTrackingEnabled} onCheckedChange={(v) => setGlobalSettings({ ...globalSettings, costTrackingEnabled: v })} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monthly Budget ($)</label>
                  <Input type="number" value={globalSettings.monthlyBudget} onChange={(e) => setGlobalSettings({ ...globalSettings, monthlyBudget: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alert at % of Budget</label>
                  <Input type="number" value={globalSettings.notifyOnBudgetThreshold} onChange={(e) => setGlobalSettings({ ...globalSettings, notifyOnBudgetThreshold: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rate Limit (requests/min): {globalSettings.rateLimitPerMinute}</label>
                <Slider value={[globalSettings.rateLimitPerMinute]} onValueChange={([v]) => setGlobalSettings({ ...globalSettings, rateLimitPerMinute: v })} min={10} max={200} step={10} />
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
