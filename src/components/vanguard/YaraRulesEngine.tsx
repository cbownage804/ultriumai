import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileSearch, Plus, Play, Trash2, Edit, AlertTriangle, 
  CheckCircle, Shield, Download, Upload, Code, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface YaraRule {
  id: string;
  rule_name: string;
  rule_content: string;
  category: string;
  severity: string;
  is_enabled: boolean;
  description?: string;
  created_at: string;
  match_count: number;
}

interface YaraMatch {
  id: string;
  rule_id: string;
  file_path: string;
  created_at: string;
  agent_id: string;
  severity?: string;
  rule_name?: string;
}

export function YaraRulesEngine() {
  const { user } = useAuth();
  const [rules, setRules] = useState<YaraRule[]>([]);
  const [matches, setMatches] = useState<YaraMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<YaraRule | null>(null);
  
  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_content: "",
    category: "malware",
    severity: "high",
    description: ""
  });

  useEffect(() => {
    if (user) {
      loadRules();
      loadMatches();
    }
  }, [user]);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('yara_rules')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err) {
      console.error('Failed to load YARA rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('yara_matches')
        .select(`
          *,
          yara_rules (rule_name, severity)
        `)
        .eq('user_id', user?.id)
        .order('matched_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMatches((data || []).map((m: any) => ({
        ...m,
        rule_name: m.yara_rules?.rule_name || 'Unknown',
        severity: m.yara_rules?.severity || 'medium'
      })));
    } catch (err) {
      console.error('Failed to load YARA matches:', err);
    }
  };

  const createRule = async () => {
    if (!newRule.rule_name || !newRule.rule_content) {
      toast.error("Rule name and content are required");
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('yara_rules')
        .insert({
          user_id: user?.id,
          rule_name: newRule.rule_name,
          rule_content: newRule.rule_content,
          category: newRule.category,
          severity: newRule.severity,
          description: newRule.description,
          is_enabled: true,
          match_count: 0
        });

      if (error) throw error;
      
      toast.success("YARA rule created");
      setShowCreateDialog(false);
      setNewRule({ rule_name: "", rule_content: "", category: "malware", severity: "high", description: "" });
      loadRules();
    } catch (err: any) {
      toast.error("Failed to create rule", { description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleRule = async (ruleId: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('yara_rules')
        .update({ is_enabled: !isEnabled })
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success(isEnabled ? "Rule disabled" : "Rule enabled");
      loadRules();
    } catch (err) {
      toast.error("Failed to update rule");
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('yara_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      toast.success("Rule deleted");
      loadRules();
    } catch (err) {
      toast.error("Failed to delete rule");
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'low': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const sampleRules = [
    {
      name: "Detect_Mimikatz",
      content: `rule Detect_Mimikatz {
    meta:
        description = "Detects Mimikatz credential dumping tool"
        severity = "critical"
    strings:
        $s1 = "sekurlsa::logonpasswords" ascii wide
        $s2 = "lsadump::sam" ascii wide
        $s3 = "kerberos::golden" ascii wide
    condition:
        any of them
}`,
      category: "credential_theft",
      severity: "critical"
    },
    {
      name: "Ransomware_Indicators",
      content: `rule Ransomware_Indicators {
    meta:
        description = "Generic ransomware behavioral indicators"
        severity = "high"
    strings:
        $ransom1 = "Your files have been encrypted" ascii wide nocase
        $ransom2 = "bitcoin" ascii wide nocase
        $ransom3 = ".onion" ascii wide
        $ext1 = ".encrypted" ascii
        $ext2 = ".locked" ascii
    condition:
        2 of them
}`,
      category: "ransomware",
      severity: "critical"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileSearch className="h-6 w-6" />
            YARA Rules Engine
          </h2>
          <p className="text-muted-foreground">Create and manage threat detection rules</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create YARA Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    value={newRule.rule_name}
                    onChange={(e) => setNewRule({...newRule, rule_name: e.target.value})}
                    placeholder="Detect_Malware_XYZ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newRule.category} onValueChange={(v) => setNewRule({...newRule, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malware">Malware</SelectItem>
                      <SelectItem value="ransomware">Ransomware</SelectItem>
                      <SelectItem value="credential_theft">Credential Theft</SelectItem>
                      <SelectItem value="backdoor">Backdoor</SelectItem>
                      <SelectItem value="exploit">Exploit</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select value={newRule.severity} onValueChange={(v) => setNewRule({...newRule, severity: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newRule.description}
                  onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                  placeholder="Detects indicators of..."
                />
              </div>

              <div>
                <label className="text-sm font-medium">Rule Content (YARA Syntax)</label>
                <Textarea
                  value={newRule.rule_content}
                  onChange={(e) => setNewRule({...newRule, rule_content: e.target.value})}
                  placeholder={`rule Example_Rule {
    meta:
        description = "Example rule"
    strings:
        $s1 = "malicious_string" ascii
    condition:
        $s1
}`}
                  className="font-mono h-64"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={createRule} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Rule"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Active Rules ({rules.filter(r => r.is_active).length})</TabsTrigger>
          <TabsTrigger value="matches">Recent Matches ({matches.length})</TabsTrigger>
          <TabsTrigger value="templates">Rule Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-4">
          <div className="grid gap-4">
            {rules.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No YARA rules yet. Create your first rule or import from templates.</p>
                </CardContent>
              </Card>
            ) : (
              rules.map(rule => (
                <Card key={rule.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{rule.rule_name}</CardTitle>
                        <Badge className={getSeverityColor(rule.severity)}>{rule.severity}</Badge>
                        <Badge variant="outline">{rule.category}</Badge>
                        {rule.is_enabled ? (
                          <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedRule(rule)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleRule(rule.id, rule.is_enabled)}
                        >
                          {rule.is_enabled ? <CheckCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{rule.description || "No description"}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Matches: {rule.match_count}</span>
                      <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent YARA Matches</CardTitle>
              <CardDescription>Files that matched your detection rules</CardDescription>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No matches detected. Your network is clean!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {matches.map(match => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${match.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`} />
                          <div>
                            <p className="font-medium">{match.rule_name}</p>
                            <p className="text-sm text-muted-foreground">{match.matched_file}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(match.severity)}>{match.severity}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(match.matched_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid gap-4">
            {sampleRules.map((template, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getSeverityColor(template.severity)}>{template.severity}</Badge>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setNewRule({
                          rule_name: template.name,
                          rule_content: template.content,
                          category: template.category,
                          severity: template.severity,
                          description: ""
                        });
                        setShowCreateDialog(true);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                    {template.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule View Dialog */}
      <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRule?.rule_name}</DialogTitle>
          </DialogHeader>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto font-mono">
            {selectedRule?.rule_content}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
