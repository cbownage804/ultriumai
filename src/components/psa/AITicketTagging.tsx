/**
 * AI Ticket Tagging System
 * Atera-style AI-powered automatic ticket categorization and routing
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Sparkles, 
  Tag, 
  Plus, 
  Pencil, 
  Trash2,
  Zap,
  Target,
  Users,
  Settings,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  ArrowRight,
  Folder,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface AITagRule {
  id: string;
  name: string;
  keywords: string[];
  category: string;
  assignTo?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  isActive: boolean;
  matchCount: number;
  accuracy: number;
}

interface TaggingStats {
  totalTagged: number;
  autoAssigned: number;
  accuracy: number;
  timeSaved: string;
}

const mockRules: AITagRule[] = [
  {
    id: 'rule-1',
    name: 'Network Issues',
    keywords: ['internet', 'wifi', 'network', 'connection', 'vpn', 'dns', 'router'],
    category: 'Network',
    assignTo: 'Network Team',
    priority: 'high',
    isActive: true,
    matchCount: 234,
    accuracy: 94.2,
  },
  {
    id: 'rule-2',
    name: 'Email Problems',
    keywords: ['email', 'outlook', 'mailbox', 'inbox', 'spam', 'calendar'],
    category: 'Email',
    assignTo: 'Cloud Services Team',
    priority: 'medium',
    isActive: true,
    matchCount: 187,
    accuracy: 91.5,
  },
  {
    id: 'rule-3',
    name: 'Password Reset',
    keywords: ['password', 'reset', 'locked out', 'cant login', 'forgot password', 'expired'],
    category: 'Access',
    assignTo: 'Help Desk',
    priority: 'low',
    isActive: true,
    matchCount: 312,
    accuracy: 98.1,
  },
  {
    id: 'rule-4',
    name: 'Hardware Failures',
    keywords: ['blue screen', 'wont turn on', 'broken', 'hardware', 'monitor', 'keyboard', 'mouse'],
    category: 'Hardware',
    assignTo: 'Desktop Support',
    priority: 'high',
    isActive: true,
    matchCount: 89,
    accuracy: 87.3,
  },
  {
    id: 'rule-5',
    name: 'Security Alerts',
    keywords: ['virus', 'malware', 'phishing', 'suspicious', 'hacked', 'ransomware', 'security'],
    category: 'Security',
    assignTo: 'Security Team',
    priority: 'critical',
    isActive: true,
    matchCount: 45,
    accuracy: 96.7,
  },
];

const mockStats: TaggingStats = {
  totalTagged: 867,
  autoAssigned: 752,
  accuracy: 93.4,
  timeSaved: '47h',
};

export function AITicketTagging() {
  const [rules, setRules] = useState(mockRules);
  const [showNewRule, setShowNewRule] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ category: string; priority: string; assignTo: string } | null>(null);
  
  // New rule form state
  const [newRule, setNewRule] = useState({
    name: '',
    keywords: '',
    category: '',
    assignTo: '',
    priority: 'medium' as AITagRule['priority'],
  });

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
    toast.success('Rule updated');
  };

  const handleTestClassification = () => {
    if (!testInput.trim()) {
      toast.error('Please enter a ticket description');
      return;
    }

    // Simulate AI classification
    const lowerInput = testInput.toLowerCase();
    let matchedRule = rules.find(rule => 
      rule.keywords.some(kw => lowerInput.includes(kw.toLowerCase()))
    );

    if (matchedRule) {
      setTestResult({
        category: matchedRule.category,
        priority: matchedRule.priority || 'medium',
        assignTo: matchedRule.assignTo || 'Unassigned',
      });
    } else {
      setTestResult({
        category: 'General',
        priority: 'medium',
        assignTo: 'Help Desk',
      });
    }
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.keywords || !newRule.category) {
      toast.error('Please fill in required fields');
      return;
    }

    const rule: AITagRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      keywords: newRule.keywords.split(',').map(k => k.trim()),
      category: newRule.category,
      assignTo: newRule.assignTo || undefined,
      priority: newRule.priority,
      isActive: true,
      matchCount: 0,
      accuracy: 0,
    };

    setRules(prev => [...prev, rule]);
    setShowNewRule(false);
    setNewRule({ name: '', keywords: '', category: '', assignTo: '', priority: 'medium' });
    toast.success('AI tagging rule created');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            AI Ticket Tagging
          </h1>
          <p className="text-white/60">Automatically categorize and route tickets with AI</p>
        </div>
        <Dialog open={showNewRule} onOpenChange={setShowNewRule}>
          <DialogTrigger asChild>
            <Button className="bg-purple-500 hover:bg-purple-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-slate-900 border-purple-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create AI Tagging Rule</DialogTitle>
              <DialogDescription className="text-white/60">
                Define keywords to automatically categorize and route tickets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Rule Name</Label>
                <Input 
                  placeholder="e.g., Network Issues" 
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-slate-800 border-purple-500/20 text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Keywords (comma-separated)</Label>
                <Textarea 
                  placeholder="e.g., internet, wifi, network, connection"
                  value={newRule.keywords}
                  onChange={(e) => setNewRule(prev => ({ ...prev, keywords: e.target.value }))}
                  className="bg-slate-800 border-purple-500/20 text-white" 
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Category</Label>
                  <Select value={newRule.category} onValueChange={(v) => setNewRule(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/20 text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-purple-500/20">
                      <SelectItem value="Network">Network</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Access">Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Priority</Label>
                  <Select value={newRule.priority} onValueChange={(v: any) => setNewRule(prev => ({ ...prev, priority: v }))}>
                    <SelectTrigger className="bg-slate-800 border-purple-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-purple-500/20">
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Auto-Assign To (optional)</Label>
                <Select value={newRule.assignTo} onValueChange={(v) => setNewRule(prev => ({ ...prev, assignTo: v }))}>
                  <SelectTrigger className="bg-slate-800 border-purple-500/20 text-white">
                    <SelectValue placeholder="Select team or technician" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-purple-500/20">
                    <SelectItem value="Help Desk">Help Desk</SelectItem>
                    <SelectItem value="Network Team">Network Team</SelectItem>
                    <SelectItem value="Security Team">Security Team</SelectItem>
                    <SelectItem value="Desktop Support">Desktop Support</SelectItem>
                    <SelectItem value="Cloud Services Team">Cloud Services Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewRule(false)} className="border-purple-500/20 text-white">
                  Cancel
                </Button>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white" onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Tag className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Tickets Tagged</p>
                <p className="text-2xl font-bold text-white">{mockStats.totalTagged}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Auto-Assigned</p>
                <p className="text-2xl font-bold text-white">{mockStats.autoAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Accuracy</p>
                <p className="text-2xl font-bold text-white">{mockStats.accuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Time Saved</p>
                <p className="text-2xl font-bold text-white">{mockStats.timeSaved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-400" />
            Tagging Rules
          </h2>
          {rules.map((rule) => (
            <Card key={rule.id} className={`bg-slate-900/50 border-purple-500/20 ${!rule.isActive && 'opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">{rule.name}</h3>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                        <Folder className="h-3 w-3 mr-1" />
                        {rule.category}
                      </Badge>
                      {rule.priority && (
                        <Badge className={`
                          ${rule.priority === 'critical' ? 'bg-red-500' : ''}
                          ${rule.priority === 'high' ? 'bg-orange-500' : ''}
                          ${rule.priority === 'medium' ? 'bg-yellow-500 text-black' : ''}
                          ${rule.priority === 'low' ? 'bg-slate-500' : ''}
                        `}>
                          {rule.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {rule.keywords.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-800 text-white/70 text-xs">
                          {kw}
                        </Badge>
                      ))}
                      {rule.keywords.length > 5 && (
                        <Badge variant="secondary" className="bg-slate-800 text-white/50 text-xs">
                          +{rule.keywords.length - 5} more
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-white/50">
                      {rule.assignTo && (
                        <span className="flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" />
                          Auto-assign to {rule.assignTo}
                        </span>
                      )}
                      <span>{rule.matchCount} matches</span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-emerald-400" />
                        {rule.accuracy}% accuracy
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={rule.isActive}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Classification */}
        <div className="space-y-4">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Test Classification
              </CardTitle>
              <CardDescription className="text-white/60">
                Enter a ticket description to see how AI would classify it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., I can't connect to the VPN from home, it keeps timing out"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="bg-slate-800 border-purple-500/20 text-white"
                rows={4}
              />
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={handleTestClassification}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Classify Ticket
              </Button>
              
              {testResult && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20 space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Classification Result
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Category:</span>
                      <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                        {testResult.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Priority:</span>
                      <Badge className={`
                        ${testResult.priority === 'critical' ? 'bg-red-500' : ''}
                        ${testResult.priority === 'high' ? 'bg-orange-500' : ''}
                        ${testResult.priority === 'medium' ? 'bg-yellow-500 text-black' : ''}
                        ${testResult.priority === 'low' ? 'bg-slate-500' : ''}
                      `}>
                        {testResult.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60">Route to:</span>
                      <span className="text-white">{testResult.assignTo}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white text-base">How AI Tagging Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="p-1.5 bg-purple-500/10 rounded h-fit">
                  <Filter className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Keyword Matching</p>
                  <p className="text-white/50">Tickets are scanned for keywords you define</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-1.5 bg-cyan-500/10 rounded h-fit">
                  <Target className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Auto-Categorization</p>
                  <p className="text-white/50">Tickets are automatically tagged with categories</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-1.5 bg-emerald-500/10 rounded h-fit">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Smart Routing</p>
                  <p className="text-white/50">Tickets go to the right team automatically</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
