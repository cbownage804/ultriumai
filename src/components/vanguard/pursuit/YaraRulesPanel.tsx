import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileCode, Plus, Search, Play, Pause, Download, Upload } from "lucide-react";
import { useXDRYaraRules, useCreateYaraRule } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const sampleYaraRule = `rule Ransomware_Generic {
    meta:
        description = "Detects generic ransomware behavior"
        author = "Pursuit XDR"
        severity = "critical"
    
    strings:
        $ransom_note1 = "Your files have been encrypted" nocase
        $ransom_note2 = "bitcoin" nocase
        $extension1 = ".encrypted" nocase
        $extension2 = ".locked" nocase
    
    condition:
        2 of them
}`;

export function YaraRulesPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: "",
    rule_content: sampleYaraRule,
    description: "",
    category: "malware",
    severity: "high",
  });

  const { data: rules, isLoading } = useXDRYaraRules();
  const createRule = useCreateYaraRule();

  const filteredRules = rules?.filter(rule => {
    if (categoryFilter !== "all" && rule.category !== categoryFilter) return false;
    if (!searchQuery) return true;
    return rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCreateRule = () => {
    if (!newRule.rule_name || !newRule.rule_content) return;
    createRule.mutate(newRule as any, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewRule({
          rule_name: "",
          rule_content: sampleYaraRule,
          description: "",
          category: "malware",
          severity: "high",
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search YARA rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="malware">Malware</SelectItem>
                <SelectItem value="ransomware">Ransomware</SelectItem>
                <SelectItem value="apt">APT</SelectItem>
                <SelectItem value="exploit">Exploit</SelectItem>
                <SelectItem value="pup">PUP</SelectItem>
                <SelectItem value="hacking_tool">Hacking Tool</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create YARA Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        placeholder="e.g., Ransomware_LockBit"
                        value={newRule.rule_name}
                        onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newRule.category} 
                        onValueChange={(v) => setNewRule({ ...newRule, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="malware">Malware</SelectItem>
                          <SelectItem value="ransomware">Ransomware</SelectItem>
                          <SelectItem value="apt">APT</SelectItem>
                          <SelectItem value="exploit">Exploit</SelectItem>
                          <SelectItem value="pup">PUP</SelectItem>
                          <SelectItem value="hacking_tool">Hacking Tool</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description of what this rule detects"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>YARA Rule Content</Label>
                    <Textarea
                      value={newRule.rule_content}
                      onChange={(e) => setNewRule({ ...newRule, rule_content: e.target.value })}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRule}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            YARA Rules
            {filteredRules && (
              <Badge variant="secondary">{filteredRules.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading rules...
              </div>
            ) : !filteredRules?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <FileCode className="h-8 w-8 mb-2" />
                <p>No YARA rules found</p>
                <p className="text-xs">Create rules to detect malware patterns</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium font-mono">{rule.rule_name}</span>
                          <Badge variant="outline">{rule.category}</Badge>
                          <Badge 
                            className={
                              rule.severity === "critical" ? "bg-destructive" :
                              rule.severity === "high" ? "bg-orange-500" :
                              "bg-yellow-500"
                            }
                          >
                            {rule.severity}
                          </Badge>
                          {rule.matches_count > 0 && (
                            <Badge variant="secondary">
                              {rule.matches_count} matches
                            </Badge>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {rule.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Author: {rule.author || "Unknown"}</span>
                          <span>Created: {formatDistanceToNow(new Date(rule.created_at), { addSuffix: true })}</span>
                          {rule.false_positives > 0 && (
                            <span className="text-orange-500">{rule.false_positives} false positives</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.is_active} />
                        <Button variant="ghost" size="icon">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
