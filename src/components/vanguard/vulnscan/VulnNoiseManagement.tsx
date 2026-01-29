import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  VolumeX, Filter, EyeOff, CheckCircle, XCircle, 
  Clock, AlertTriangle, Search, Trash2, Calendar, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  port: number | null;
  solution: string | null;
  status: string | null;
  discovered_at: string;
  patched_at: string | null;
  device_id: string | null;
}

interface SuppressionRule {
  id: string;
  name: string;
  suppression_type: 'false_positive' | 'accepted_risk' | 'addressed' | 'temporary';
  criteria: {
    cve_ids?: string[];
    titles?: string[];
    severities?: string[];
    services?: string[];
    ports?: number[];
  };
  reason: string | null;
  expires_at: string | null;
  created_at: string;
  vuln_count: number;
  is_active: boolean;
}

interface VulnNoiseManagementProps {
  vulnerabilities: Vulnerability[];
  onVulnUpdate: () => void;
}

const SUPPRESSION_TYPES = [
  { value: 'false_positive', label: 'False Positive', description: 'Not actually a vulnerability', color: 'bg-gray-500/10 text-gray-500' },
  { value: 'accepted_risk', label: 'Accepted Risk', description: 'Known risk, accepted by management', color: 'bg-yellow-500/10 text-yellow-500' },
  { value: 'addressed', label: 'Addressed', description: 'Mitigated through other controls', color: 'bg-green-500/10 text-green-500' },
  { value: 'temporary', label: 'Temporary Suppression', description: 'Hide until specified date', color: 'bg-blue-500/10 text-blue-500' },
];

export function VulnNoiseManagement({ vulnerabilities, onVulnUpdate }: VulnNoiseManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("suppress");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVulns, setSelectedVulns] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [suppressionType, setSuppressionType] = useState<string>("false_positive");
  const [suppressionReason, setSuppressionReason] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [suppressionRules, setSuppressionRules] = useState<SuppressionRule[]>([]);

  useEffect(() => {
    if (user) {
      fetchSuppressionRules();
    }
  }, [user]);

  const fetchSuppressionRules = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('vanguard_vuln_suppression_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSuppressionRules((data || []).map(r => ({
        id: r.id,
        name: r.name,
        suppression_type: r.suppression_type as SuppressionRule['suppression_type'],
        criteria: (r.criteria as any) || {},
        reason: r.reason,
        expires_at: r.expires_at,
        created_at: r.created_at,
        vuln_count: r.vuln_count || 0,
        is_active: r.is_active,
      })));
    } catch (error) {
      console.error('Error fetching suppression rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVulns = useMemo(() => {
    return vulnerabilities.filter(v => 
      v.status !== 'patched' && 
      (v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       v.cve_id?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [vulnerabilities, searchQuery]);

  const vulnGroups = useMemo(() => {
    const groups = new Map<string, Vulnerability[]>();
    
    filteredVulns.forEach(v => {
      const key = v.cve_id || v.title;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(v);
    });
    
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredVulns]);

  const toggleVulnSelection = (vulnId: string) => {
    const newSelection = new Set(selectedVulns);
    if (newSelection.has(vulnId)) {
      newSelection.delete(vulnId);
    } else {
      newSelection.add(vulnId);
    }
    setSelectedVulns(newSelection);
  };

  const selectAllOfType = (vulnIds: string[]) => {
    const newSelection = new Set(selectedVulns);
    vulnIds.forEach(id => newSelection.add(id));
    setSelectedVulns(newSelection);
  };

  const handleSuppressSelected = async () => {
    if (!user || selectedVulns.size === 0) {
      toast.error('Select vulnerabilities to suppress');
      return;
    }

    setIsSaving(true);

    try {
      const suppressedStatus = suppressionType === 'false_positive' ? 'false_positive' :
                               suppressionType === 'accepted_risk' ? 'accepted_risk' :
                               suppressionType === 'addressed' ? 'addressed' : 'suppressed';

      const { error: updateError } = await supabase
        .from('safenet_vulnerabilities')
        .update({ status: suppressedStatus })
        .in('id', Array.from(selectedVulns));

      if (updateError) throw updateError;

      const selectedVulnData = vulnerabilities.filter(v => selectedVulns.has(v.id));
      
      const { error: ruleError } = await supabase
        .from('vanguard_vuln_suppression_rules')
        .insert({
          user_id: user.id,
          name: `Bulk suppression - ${selectedVulnData[0]?.cve_id || selectedVulnData[0]?.title}`,
          suppression_type: suppressionType,
          criteria: {
            cve_ids: [...new Set(selectedVulnData.map(v => v.cve_id).filter(Boolean) as string[])],
            titles: [...new Set(selectedVulnData.map(v => v.title))],
          },
          reason: suppressionReason || null,
          expires_at: expirationDate ? new Date(expirationDate).toISOString() : null,
          vuln_count: selectedVulns.size,
          is_active: true,
        });

      if (ruleError) throw ruleError;

      toast.success(`${selectedVulns.size} vulnerabilities suppressed`);
      setSelectedVulns(new Set());
      setIsDialogOpen(false);
      setSuppressionReason("");
      setExpirationDate("");
      fetchSuppressionRules();
      onVulnUpdate();
    } catch (error) {
      console.error('Error suppressing vulnerabilities:', error);
      toast.error('Failed to suppress vulnerabilities');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRuleActive = async (ruleId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('vanguard_vuln_suppression_rules')
      .update({ is_active: !currentActive })
      .eq('id', ruleId);

    if (error) {
      toast.error('Failed to update rule');
    } else {
      toast.success('Rule updated');
      fetchSuppressionRules();
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Delete this suppression rule?')) return;

    const { error } = await supabase
      .from('vanguard_vuln_suppression_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      toast.error('Failed to delete rule');
    } else {
      toast.success('Rule deleted');
      fetchSuppressionRules();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredVulns.length}</p>
                <p className="text-xs text-muted-foreground">Active Vulns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <EyeOff className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppressionRules.filter(r => r.is_active).length}</p>
                <p className="text-xs text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {suppressionRules.reduce((sum, r) => sum + r.vuln_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Suppressed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {suppressionRules.filter(r => r.expires_at).length}
                </p>
                <p className="text-xs text-muted-foreground">Temporary</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="suppress" className="flex items-center gap-2">
            <VolumeX className="h-4 w-4" />
            Suppress Vulns
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Suppression Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppress" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <VolumeX className="h-5 w-5" />
                    Noise Management
                  </CardTitle>
                  <CardDescription>
                    Suppress false positives, accepted risks, and addressed vulnerabilities
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search CVE or title..."
                      className="pl-9 w-48"
                    />
                  </div>
                  <Button 
                    onClick={() => setIsDialogOpen(true)}
                    disabled={selectedVulns.size === 0}
                  >
                    Suppress Selected ({selectedVulns.size})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {vulnGroups.map(([key, vulns]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={vulns.every(v => selectedVulns.has(v.id))}
                            onCheckedChange={() => {
                              if (vulns.every(v => selectedVulns.has(v.id))) {
                                const newSelection = new Set(selectedVulns);
                                vulns.forEach(v => newSelection.delete(v.id));
                                setSelectedVulns(newSelection);
                              } else {
                                selectAllOfType(vulns.map(v => v.id));
                              }
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{key}</span>
                              <Badge variant="outline">{vulns.length} instance{vulns.length !== 1 ? 's' : ''}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getSeverityColor(vulns[0].severity)}>
                                {vulns[0].severity}
                              </Badge>
                              {vulns[0].cve_id && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {vulns[0].cve_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {vulns[0].cvss_score && (
                            <Badge variant="outline">CVSS: {vulns[0].cvss_score}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {vulnGroups.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No active vulnerabilities to manage</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Suppression Rules
              </CardTitle>
              <CardDescription>
                Manage rules to automatically filter vulnerability noise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : suppressionRules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No suppression rules configured</p>
                  <p className="text-sm">Suppress vulnerabilities to create rules</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suppressionRules.map(rule => (
                    <div 
                      key={rule.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        rule.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRuleActive(rule.id, rule.is_active)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.name}</span>
                            <Badge className={
                              SUPPRESSION_TYPES.find(t => t.value === rule.suppression_type)?.color
                            }>
                              {SUPPRESSION_TYPES.find(t => t.value === rule.suppression_type)?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.reason || 'No reason provided'} • {rule.vuln_count} vulns suppressed
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>Created {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}</span>
                            {rule.expires_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Expires {format(new Date(rule.expires_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suppression Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suppress Vulnerabilities</DialogTitle>
            <DialogDescription>
              Configure how to suppress {selectedVulns.size} selected vulnerabilities
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Suppression Type</Label>
              <Select value={suppressionType} onValueChange={setSuppressionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPRESSION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={suppressionReason}
                onChange={(e) => setSuppressionReason(e.target.value)}
                placeholder="Explain why these vulnerabilities are being suppressed..."
                rows={3}
              />
            </div>

            {suppressionType === 'temporary' && (
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSuppressSelected} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppressing...
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Suppress {selectedVulns.size} Vulnerabilities
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
