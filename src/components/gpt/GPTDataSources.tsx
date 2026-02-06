import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Database, Table, Plus, Trash2, Loader2, Search, Sparkles, Shield } from 'lucide-react';

interface GPTDataSourcesProps {
  gptId: string;
  gptName: string;
  themeColor: string;
}

interface DataSource {
  id: string;
  table_name: string;
  allowed_columns: string[];
  description: string | null;
  is_enabled: boolean;
}

// Available tables that can be connected
const AVAILABLE_TABLES = [
  { name: 'tickets', label: 'Helpdesk Tickets', description: 'Support tickets and their status', icon: '🎫', columns: ['id', 'title', 'description', 'status', 'priority', 'created_at', 'updated_at', 'assigned_to'] },
  { name: 'vanguard_agents', label: 'Fleet Devices', description: 'Monitored endpoints and agents', icon: '💻', columns: ['id', 'hostname', 'os_type', 'os_version', 'status', 'last_seen', 'ip_address'] },
  { name: 'atlas_organizations', label: 'Organizations', description: 'Client organizations', icon: '🏢', columns: ['id', 'name', 'description', 'primary_contact_name', 'primary_contact_email', 'address'] },
  { name: 'atlas_contacts', label: 'Contacts', description: 'Contact directory', icon: '👤', columns: ['id', 'first_name', 'last_name', 'email', 'phone', 'department', 'organization_id'] },
  { name: 'atlas_documents', label: 'Documents', description: 'Documentation and knowledge base', icon: '📄', columns: ['id', 'title', 'content', 'category', 'tags', 'created_at'] },
  { name: 'atlas_passwords', label: 'Passwords', description: 'Password vault entries (names only)', icon: '🔐', columns: ['id', 'name', 'username', 'url', 'category'] },
  { name: 'assets', label: 'Assets', description: 'IT asset inventory', icon: '📦', columns: ['id', 'name', 'serial_number', 'manufacturer', 'model', 'status', 'assigned_to', 'location'] },
  { name: 'compliance_frameworks', label: 'Compliance', description: 'Compliance framework status', icon: '✅', columns: ['id', 'name', 'framework_type', 'status', 'completion_percentage'] },
  { name: 'realtime_alerts', label: 'Security Alerts', description: 'Real-time security alerts', icon: '🚨', columns: ['id', 'title', 'severity', 'status', 'source', 'created_at'] },
  { name: 'knowledge_sources', label: 'Knowledge Sources', description: 'GPT knowledge base sources', icon: '📚', columns: ['id', 'name', 'source_type', 'status', 'content'] },
];

export function GPTDataSources({ gptId, gptName, themeColor }: GPTDataSourcesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  useEffect(() => {
    loadDataSources();
  }, [gptId]);

  const loadDataSources = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('gpt_data_sources' as any)
        .select('*')
        .eq('gpt_id', gptId)
        .eq('user_id', user.id);
      if (error) throw error;
      setDataSources((data as unknown as DataSource[]) || []);
    } catch (err) {
      console.error('Error loading data sources:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDataSource = async () => {
    if (!user || !selectedTable) return;
    setSaving(true);
    try {
      const tableInfo = AVAILABLE_TABLES.find(t => t.name === selectedTable);
      const columns = selectedColumns.length > 0 ? selectedColumns : tableInfo?.columns || [];
      
      const { error } = await supabase
        .from('gpt_data_sources' as any)
        .insert({
          gpt_id: gptId,
          user_id: user.id,
          table_name: selectedTable,
          allowed_columns: columns,
          description: tableInfo?.description || null,
          is_enabled: true,
        });
      if (error) throw error;
      toast({ title: 'Data source connected', description: `${tableInfo?.label} is now available to ${gptName}` });
      setSelectedTable(null);
      setSelectedColumns([]);
      setShowAddPanel(false);
      await loadDataSources();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDataSource = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('gpt_data_sources' as any)
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
      setDataSources(prev => prev.map(ds => ds.id === id ? { ...ds, is_enabled: enabled } : ds));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const removeDataSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('gpt_data_sources' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      setDataSources(prev => prev.filter(ds => ds.id !== id));
      toast({ title: 'Data source removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const connectedTableNames = dataSources.map(ds => ds.table_name);
  const availableTables = AVAILABLE_TABLES.filter(t => 
    !connectedTableNames.includes(t.name) &&
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" style={{ color: themeColor }} />
            Data Sources
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect live data tables so {gptName} can answer questions about your real data
          </p>
        </div>
        <Button onClick={() => setShowAddPanel(!showAddPanel)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Connect Table
        </Button>
      </div>

      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Ask AI — Data-Aware Chat</p>
            <p className="text-muted-foreground">
              When data sources are connected, users can ask natural language questions like 
              "How many open tickets do I have?" and get real answers from your live data.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">Security</p>
            <p className="text-muted-foreground">
              All queries are read-only and scoped to the authenticated user's data via RLS policies.
              No passwords or sensitive fields are ever exposed to the AI.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connected sources */}
      {dataSources.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Connected Sources ({dataSources.length})</h4>
          {dataSources.map(ds => {
            const tableInfo = AVAILABLE_TABLES.find(t => t.name === ds.table_name);
            return (
              <Card key={ds.id} className="group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tableInfo?.icon || '📊'}</span>
                    <div>
                      <p className="font-medium">{tableInfo?.label || ds.table_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ds.allowed_columns.length} columns · {ds.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={ds.is_enabled ? 'default' : 'secondary'} className="text-xs">
                      {ds.is_enabled ? 'Active' : 'Disabled'}
                    </Badge>
                    <Switch
                      checked={ds.is_enabled}
                      onCheckedChange={(checked) => toggleDataSource(ds.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => removeDataSource(ds.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add panel */}
      {showAddPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connect a Data Table</CardTitle>
            <CardDescription>Select a table to make its data queryable by AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {availableTables.map(table => (
                  <div
                    key={table.name}
                    onClick={() => {
                      setSelectedTable(table.name);
                      setSelectedColumns(table.columns);
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTable === table.name 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{table.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{table.label}</p>
                        <p className="text-xs text-muted-foreground">{table.description}</p>
                      </div>
                    </div>
                    {selectedTable === table.name && (
                      <div className="mt-3 pl-10 space-y-2">
                        <Label className="text-xs text-muted-foreground">Columns to expose:</Label>
                        <div className="flex flex-wrap gap-2">
                          {table.columns.map(col => (
                            <label key={col} className="flex items-center gap-1.5 text-xs">
                              <Checkbox
                                checked={selectedColumns.includes(col)}
                                onCheckedChange={(checked) => {
                                  setSelectedColumns(prev => 
                                    checked 
                                      ? [...prev, col]
                                      : prev.filter(c => c !== col)
                                  );
                                }}
                              />
                              {col}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {availableTables.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    All available tables are already connected
                  </p>
                )}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowAddPanel(false); setSelectedTable(null); }}>
                Cancel
              </Button>
              <Button
                onClick={addDataSource}
                disabled={!selectedTable || saving}
                style={{ backgroundColor: themeColor }}
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect Table
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {dataSources.length === 0 && !showAddPanel && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Table className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">No data sources connected</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your data tables to enable AI-powered data queries
            </p>
            <Button onClick={() => setShowAddPanel(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Table
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
