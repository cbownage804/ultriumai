import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Key, Plus, Trash2, Edit, Shield, Server, Terminal, Network,
  Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Credential {
  id: string;
  credential_name: string;
  credential_type: string;
  username: string | null;
  domain: string | null;
  port: number | null;
  use_ssl: boolean | null;
  snmp_community: string | null;
  target_scope: string[];
  is_active: boolean;
  last_used_at: string | null;
  last_test_result: string | null;
  notes: string | null;
  created_at: string;
}

const CREDENTIAL_TYPES = [
  { id: 'winrm', name: 'WinRM (Windows)', icon: Server, description: 'PowerShell remoting for Windows compliance' },
  { id: 'ssh_password', name: 'SSH (Password)', icon: Terminal, description: 'SSH access with password auth' },
  { id: 'ssh_key', name: 'SSH (Key)', icon: Key, description: 'SSH access with private key' },
  { id: 'snmp_v2', name: 'SNMP v2c', icon: Network, description: 'SNMP community string for network devices' },
  { id: 'snmp_v3', name: 'SNMP v3', icon: Shield, description: 'Secure SNMP with authentication' },
];

export function CredentialVault() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [isTesting, setIsTesting] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    credential_name: '',
    credential_type: 'winrm',
    username: '',
    password: '',
    private_key: '',
    domain: '',
    port: 22,
    use_ssl: true,
    snmp_community: '',
    snmp_auth_protocol: 'SHA',
    snmp_priv_protocol: 'AES',
    target_scope: '',
    notes: '',
  });

  useEffect(() => {
    if (user) loadCredentials();
  }, [user]);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_agent_credentials')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredentials((data || []).map(c => ({
        ...c,
        target_scope: Array.isArray(c.target_scope) ? (c.target_scope as string[]) : []
      })));
    } catch (err) {
      console.error('Failed to load credentials:', err);
      toast.error('Failed to load credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      credential_name: '',
      credential_type: 'winrm',
      username: '',
      password: '',
      private_key: '',
      domain: '',
      port: 22,
      use_ssl: true,
      snmp_community: '',
      snmp_auth_protocol: 'SHA',
      snmp_priv_protocol: 'AES',
      target_scope: '',
      notes: '',
    });
  };

  const handleSave = async () => {
    if (!formData.credential_name) {
      toast.error('Credential name is required');
      return;
    }

    try {
      const payload: any = {
        user_id: user?.id,
        credential_name: formData.credential_name,
        credential_type: formData.credential_type,
        username: formData.username || null,
        domain: formData.domain || null,
        port: formData.port,
        use_ssl: formData.use_ssl,
        snmp_community: formData.snmp_community || null,
        snmp_auth_protocol: formData.snmp_auth_protocol,
        snmp_priv_protocol: formData.snmp_priv_protocol,
        target_scope: formData.target_scope.split(',').map(s => s.trim()).filter(Boolean),
        notes: formData.notes || null,
      };

      // In production, these would be encrypted before storage
      if (formData.password) {
        payload.encrypted_password = btoa(formData.password); // Simple base64 for demo
      }
      if (formData.private_key) {
        payload.encrypted_private_key = btoa(formData.private_key);
      }

      if (editingCredential) {
        const { error } = await supabase
          .from('vanguard_agent_credentials')
          .update(payload)
          .eq('id', editingCredential.id);
        if (error) throw error;
        toast.success('Credential updated');
      } else {
        const { error } = await supabase
          .from('vanguard_agent_credentials')
          .insert(payload);
        if (error) throw error;
        toast.success('Credential created');
      }

      setShowAddDialog(false);
      setEditingCredential(null);
      resetForm();
      loadCredentials();
    } catch (err: any) {
      toast.error('Failed to save credential', { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this credential? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('vanguard_agent_credentials')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Credential deleted');
      loadCredentials();
    } catch (err: any) {
      toast.error('Failed to delete', { description: err.message });
    }
  };

  const handleEdit = (cred: Credential) => {
    setEditingCredential(cred);
    setFormData({
      credential_name: cred.credential_name,
      credential_type: cred.credential_type,
      username: cred.username || '',
      password: '', // Don't populate password
      private_key: '',
      domain: cred.domain || '',
      port: cred.port || 22,
      use_ssl: cred.use_ssl ?? true,
      snmp_community: cred.snmp_community || '',
      snmp_auth_protocol: 'SHA',
      snmp_priv_protocol: 'AES',
      target_scope: cred.target_scope?.join(', ') || '',
      notes: cred.notes || '',
    });
    setShowAddDialog(true);
  };

  const testCredential = async (cred: Credential) => {
    setIsTesting(cred.id);
    try {
      // In production, this would call an edge function to test connectivity
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate result
      const success = Math.random() > 0.3;
      
      await supabase
        .from('vanguard_agent_credentials')
        .update({ 
          last_test_result: success ? 'success' : 'failed',
          last_used_at: new Date().toISOString()
        })
        .eq('id', cred.id);

      if (success) {
        toast.success('Connection successful');
      } else {
        toast.error('Connection failed');
      }
      
      loadCredentials();
    } catch (err) {
      toast.error('Test failed');
    } finally {
      setIsTesting(null);
    }
  };

  const getTypeInfo = (type: string) => {
    return CREDENTIAL_TYPES.find(t => t.id === type) || CREDENTIAL_TYPES[0];
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Credential Vault
          </h2>
          <p className="text-muted-foreground">Manage credentials for agentless scanning</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingCredential(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCredential ? 'Edit Credential' : 'Add Credential'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Credential Name</Label>
                  <Input 
                    placeholder="e.g., Domain Admin - Production"
                    value={formData.credential_name}
                    onChange={e => setFormData(f => ({ ...f, credential_name: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Type</Label>
                  <Select 
                    value={formData.credential_type} 
                    onValueChange={v => setFormData(f => ({ ...f, credential_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDENTIAL_TYPES.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* WinRM / SSH fields */}
                {['winrm', 'ssh_password', 'ssh_key'].includes(formData.credential_type) && (
                  <>
                    <div>
                      <Label>Username</Label>
                      <Input 
                        placeholder="administrator"
                        value={formData.username}
                        onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                      />
                    </div>
                    
                    {formData.credential_type === 'winrm' && (
                      <div>
                        <Label>Domain</Label>
                        <Input 
                          placeholder="CORP"
                          value={formData.domain}
                          onChange={e => setFormData(f => ({ ...f, domain: e.target.value }))}
                        />
                      </div>
                    )}

                    {formData.credential_type !== 'ssh_key' && (
                      <div className="col-span-2">
                        <Label>Password</Label>
                        <Input 
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                        />
                      </div>
                    )}

                    {formData.credential_type === 'ssh_key' && (
                      <div className="col-span-2">
                        <Label>Private Key</Label>
                        <Textarea 
                          placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                          className="font-mono text-xs"
                          rows={4}
                          value={formData.private_key}
                          onChange={e => setFormData(f => ({ ...f, private_key: e.target.value }))}
                        />
                      </div>
                    )}

                    {formData.credential_type === 'winrm' && (
                      <div className="col-span-2 flex items-center gap-2">
                        <Switch 
                          checked={formData.use_ssl}
                          onCheckedChange={v => setFormData(f => ({ ...f, use_ssl: v }))}
                        />
                        <Label>Use SSL (port 5986)</Label>
                      </div>
                    )}

                    {formData.credential_type.startsWith('ssh') && (
                      <div>
                        <Label>Port</Label>
                        <Input 
                          type="number"
                          value={formData.port}
                          onChange={e => setFormData(f => ({ ...f, port: parseInt(e.target.value) || 22 }))}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* SNMP fields */}
                {formData.credential_type === 'snmp_v2' && (
                  <div className="col-span-2">
                    <Label>Community String</Label>
                    <Input 
                      type="password"
                      placeholder="public"
                      value={formData.snmp_community}
                      onChange={e => setFormData(f => ({ ...f, snmp_community: e.target.value }))}
                    />
                  </div>
                )}

                {formData.credential_type === 'snmp_v3' && (
                  <>
                    <div>
                      <Label>Username</Label>
                      <Input 
                        value={formData.username}
                        onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Auth Protocol</Label>
                      <Select 
                        value={formData.snmp_auth_protocol}
                        onValueChange={v => setFormData(f => ({ ...f, snmp_auth_protocol: v }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MD5">MD5</SelectItem>
                          <SelectItem value="SHA">SHA</SelectItem>
                          <SelectItem value="SHA256">SHA-256</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Auth Password</Label>
                      <Input 
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <Label>Target Scope (comma-separated IPs/subnets)</Label>
                  <Input 
                    placeholder="192.168.1.0/24, 10.0.0.0/8"
                    value={formData.target_scope}
                    onChange={e => setFormData(f => ({ ...f, target_scope: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use for all targets
                  </p>
                </div>

                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Optional notes about this credential"
                    value={formData.notes}
                    onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                {editingCredential ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info banner */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Shield className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-semibold">Agentless Scanning Credentials</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Store credentials for remote access to endpoints without installing agents. 
                The Vanguard Pi appliance uses these credentials to perform compliance checks via WinRM (Windows), SSH (Linux), and SNMP (network devices).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials list */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : credentials.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No credentials configured</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Add credentials to enable agentless compliance scanning
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Credential
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          credentials.map(cred => {
            const typeInfo = getTypeInfo(cred.credential_type);
            const Icon = typeInfo.icon;
            
            return (
              <Card key={cred.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{cred.credential_name}</h3>
                          {cred.is_active ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                          )}
                          {cred.last_test_result === 'success' && (
                            <Badge className="bg-green-500/10 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {cred.last_test_result === 'failed' && (
                            <Badge className="bg-red-500/10 text-red-500">
                              <XCircle className="h-3 w-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{typeInfo.name}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          {cred.username && (
                            <div>
                              <span className="text-muted-foreground">User: </span>
                              <span className="font-mono">
                                {cred.domain ? `${cred.domain}\\` : ''}{cred.username}
                              </span>
                            </div>
                          )}
                          {cred.port && cred.credential_type.startsWith('ssh') && (
                            <div>
                              <span className="text-muted-foreground">Port: </span>
                              <span>{cred.port}</span>
                            </div>
                          )}
                          {cred.target_scope?.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Scope: </span>
                              <span className="font-mono text-xs">
                                {cred.target_scope.slice(0, 3).join(', ')}
                                {cred.target_scope.length > 3 && ` +${cred.target_scope.length - 3} more`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testCredential(cred)}
                        disabled={isTesting === cred.id}
                      >
                        {isTesting === cred.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cred)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cred.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
