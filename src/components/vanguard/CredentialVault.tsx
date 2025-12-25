import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, Plus, Trash2, Edit, Shield, Server, Terminal, Network,
  Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Lock, Monitor, Info, Copy, ExternalLink
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

// Device categories with their protocols
const DEVICE_CATEGORIES = {
  windows: {
    name: 'Windows PCs & Servers',
    icon: Monitor,
    protocol: 'WinRM',
    color: 'blue',
    description: 'Windows Remote Management (built-in)',
    types: ['winrm']
  },
  linux: {
    name: 'Linux Machines',
    icon: Terminal,
    protocol: 'SSH',
    color: 'green',
    description: 'Secure Shell (standard)',
    types: ['ssh_password', 'ssh_key']
  },
  network: {
    name: 'Network Devices',
    icon: Network,
    protocol: 'SNMP',
    color: 'orange',
    description: 'Simple Network Management Protocol',
    types: ['snmp_v2', 'snmp_v3']
  }
};

const CREDENTIAL_TYPES = [
  { id: 'winrm', name: 'WinRM (Windows)', icon: Monitor, description: 'PowerShell remoting for Windows compliance', category: 'windows' },
  { id: 'ssh_password', name: 'SSH (Password)', icon: Terminal, description: 'SSH access with password auth', category: 'linux' },
  { id: 'ssh_key', name: 'SSH (Key)', icon: Key, description: 'SSH access with private key', category: 'linux' },
  { id: 'snmp_v2', name: 'SNMP v2c', icon: Network, description: 'SNMP community string for network devices', category: 'network' },
  { id: 'snmp_v3', name: 'SNMP v3', icon: Shield, description: 'Secure SNMP with authentication', category: 'network' },
];

// Setup instructions component
function SetupInstructionsDialog({ category }: { category: 'windows' | 'linux' | 'network' }) {
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const instructions = {
    windows: {
      title: 'Enable WinRM on Windows',
      description: 'WinRM (Windows Remote Management) is built into Windows. No additional software installation required.',
      steps: [
        {
          title: 'Option 1: PowerShell (Quick Setup)',
          description: 'Run as Administrator on each Windows machine:',
          code: `# Enable WinRM and configure firewall
Enable-PSRemoting -Force
Set-Item WSMan:\\localhost\\Client\\TrustedHosts -Value "*" -Force
Enable-NetFirewallRule -DisplayGroup "Windows Remote Management"`,
          note: 'For production, replace "*" with your Pi appliance IP address'
        },
        {
          title: 'Option 2: Group Policy (Domain Environment)',
          description: 'For domain-joined machines, use GPO for centralized configuration:',
          steps: [
            'Open Group Policy Management Console',
            'Navigate to: Computer Configuration → Policies → Administrative Templates → Windows Components → Windows Remote Management',
            'Enable "Allow remote server management through WinRM"',
            'Set IPv4/IPv6 filters to your Pi appliance subnet',
            'Configure Windows Firewall to allow WinRM (TCP 5985/5986)'
          ]
        },
        {
          title: 'Option 3: Intune/Azure AD',
          description: 'For cloud-managed devices, use Intune configuration profile:',
          steps: [
            'Create a new Configuration Profile',
            'Select "Custom" template',
            'Add OMA-URI settings for WinRM configuration',
            'Deploy to target device groups'
          ]
        }
      ],
      ports: ['5985 (HTTP)', '5986 (HTTPS - Recommended)'],
      verification: `# Test WinRM connectivity from Pi appliance
Test-WSMan -ComputerName TARGET_IP`
    },
    linux: {
      title: 'Configure SSH on Linux',
      description: 'SSH is typically pre-installed on Linux. Just ensure it\'s enabled and accessible.',
      steps: [
        {
          title: 'Verify SSH is Running',
          description: 'Check SSH service status:',
          code: `# Check SSH status
sudo systemctl status sshd

# If not running, start and enable it
sudo systemctl enable sshd
sudo systemctl start sshd`
        },
        {
          title: 'Configure SSH for Key-Based Auth (Recommended)',
          description: 'Generate and deploy SSH keys for passwordless access:',
          code: `# On the Pi appliance, generate key pair
ssh-keygen -t ed25519 -C "vanguard-scanner"

# Copy public key to target machine
ssh-copy-id user@target_ip`
        },
        {
          title: 'Firewall Configuration',
          description: 'Ensure SSH port is open:',
          code: `# Ubuntu/Debian
sudo ufw allow ssh

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload`
        }
      ],
      ports: ['22 (SSH - default)'],
      verification: `# Test SSH connectivity from Pi appliance
ssh -o ConnectTimeout=5 user@TARGET_IP "echo 'Connection successful'"`
    },
    network: {
      title: 'Enable SNMP on Network Devices',
      description: 'SNMP allows monitoring of routers, switches, firewalls, and other network devices.',
      steps: [
        {
          title: 'Cisco IOS/IOS-XE',
          description: 'Configure SNMP on Cisco devices:',
          code: `! SNMP v2c configuration
snmp-server community YOUR_COMMUNITY RO
snmp-server host PI_IP_ADDRESS version 2c YOUR_COMMUNITY

! SNMP v3 (Recommended)
snmp-server group VANGUARD v3 priv
snmp-server user vanguard VANGUARD v3 auth sha AUTH_PASSWORD priv aes 128 PRIV_PASSWORD`
        },
        {
          title: 'Ubiquiti UniFi',
          description: 'Enable via UniFi Controller:',
          steps: [
            'Go to Settings → System → SNMP',
            'Enable SNMP v1/v2c or v3',
            'Set community string or v3 credentials',
            'Save and apply to devices'
          ]
        },
        {
          title: 'Fortinet FortiGate',
          description: 'Configure via CLI:',
          code: `config system snmp community
  edit 1
    set name "vanguard"
    config hosts
      edit 1
        set ip PI_IP_ADDRESS
      next
    end
  next
end`
        }
      ],
      ports: ['161 (SNMP queries)', '162 (SNMP traps)'],
      verification: `# Test SNMP from Pi appliance
snmpwalk -v2c -c COMMUNITY TARGET_IP system`
    }
  };

  const info = instructions[category];
  const categoryInfo = DEVICE_CATEGORIES[category];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="h-4 w-4" />
          Setup Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <categoryInfo.icon className="h-5 w-5" />
            {info.title}
          </DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Required Ports */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Required Ports:</p>
            <div className="flex flex-wrap gap-2">
              {info.ports.map(port => (
                <Badge key={port} variant="secondary">{port}</Badge>
              ))}
            </div>
          </div>

          {/* Setup Steps */}
          {info.steps.map((step, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-semibold text-sm">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              
              {step.code && (
                <div className="relative">
                  <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                    {step.code}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => copyToClipboard(step.code!, `step-${idx}`)}
                  >
                    {copied === `step-${idx}` ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
              
              {step.steps && (
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {step.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              )}
              
              {step.note && (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {step.note}
                </p>
              )}
            </div>
          ))}

          {/* Verification */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Verify Connectivity</h4>
            <div className="relative">
              <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                {info.verification}
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => copyToClipboard(info.verification, 'verify')}
              >
                {copied === 'verify' ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CredentialVault() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [agents, setAgents] = useState<{ id: string; name: string; status: string }[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [testingCommands, setTestingCommands] = useState<Map<string, string>>(new Map()); // credential_id -> command_id
  
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
    if (user) {
      loadCredentials();
      loadAgents();
    }
  }, [user]);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('vanguard_agents')
        .select('id, name, status')
        .eq('user_id', user?.id)
        .order('last_heartbeat', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
      
      // Auto-select first online agent
      const onlineAgent = data?.find(a => a.status === 'online');
      if (onlineAgent && !selectedAgent) {
        setSelectedAgent(onlineAgent.id);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

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
    if (!selectedAgent) {
      toast.error('Please select an agent to run the test');
      return;
    }

    if (!cred.target_scope || cred.target_scope.length === 0) {
      toast.error('No target hosts specified for this credential');
      return;
    }

    setIsTesting(cred.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-connectivity-test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'test_credential',
            credential_id: cred.id,
            agent_id: selectedAgent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Test failed');
      }

      // Store command ID for polling
      if (result.command_id) {
        setTestingCommands(prev => new Map(prev).set(cred.id, result.command_id));
        toast.success('Test queued', { description: 'Agent will test connectivity shortly' });
        
        // Start polling for result
        pollTestResult(cred.id, result.command_id);
      }
    } catch (err: any) {
      toast.error('Test failed', { description: err.message });
      setIsTesting(null);
    }
  };

  const pollTestResult = async (credentialId: string, commandId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const { data: command, error } = await supabase
          .from('vanguard_agent_commands')
          .select('status, response, error_message')
          .eq('id', commandId)
          .single();

        if (error) throw error;

        if (command.status === 'completed' || command.status === 'failed') {
          // Update credential with result
          const responseData = command.response as Record<string, unknown> | null;
          const testResult = command.status === 'completed' && responseData?.success ? 'success' : 'failed';
          
          await supabase
            .from('vanguard_agent_credentials')
            .update({ 
              last_test_result: testResult,
              last_used_at: new Date().toISOString()
            })
            .eq('id', credentialId);

          if (testResult === 'success') {
            toast.success('Connection verified', { 
              description: (responseData?.message as string) || 'All targets reachable' 
            });
          } else {
            toast.error('Connection failed', { 
              description: command.error_message || (responseData?.error as string) || 'Unable to connect to targets' 
            });
          }

          setIsTesting(null);
          setTestingCommands(prev => {
            const next = new Map(prev);
            next.delete(credentialId);
            return next;
          });
          loadCredentials();
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          toast.error('Test timed out', { description: 'Agent did not respond in time' });
          setIsTesting(null);
        }
      } catch (err) {
        console.error('Poll error:', err);
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setIsTesting(null);
        }
      }
    };

    poll();
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

      {/* Agent Selector for Testing */}
      <Card className="border-muted">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Test Agent</Label>
                <p className="text-xs text-muted-foreground">Select the Vanguard agent to run connectivity tests</p>
              </div>
            </div>
            <Select value={selectedAgent || ''} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <SelectItem value="none" disabled>No agents available</SelectItem>
                ) : (
                  agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-muted'}`} />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(DEVICE_CATEGORIES).map(([key, cat]) => {
          const credsCount = credentials.filter(c => cat.types.includes(c.credential_type)).length;
          const Icon = cat.icon;
          
          return (
            <Card key={key} className={`border-${cat.color}-500/30 bg-${cat.color}-500/5`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${cat.color}-500/10`}>
                      <Icon className={`h-5 w-5 text-${cat.color}-500`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{cat.name}</h3>
                      <Badge variant="outline" className="mt-1">{cat.protocol}</Badge>
                    </div>
                  </div>
                  <SetupInstructionsDialog category={key as 'windows' | 'linux' | 'network'} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    <span className="font-semibold">{credsCount}</span> credential{credsCount !== 1 ? 's' : ''}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFormData(f => ({ ...f, credential_type: cat.types[0] }));
                      setShowAddDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Important Note */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3 items-start">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">No software installation required</p>
              <p className="text-muted-foreground mt-1">
                Agentless scanning uses built-in protocols: WinRM is native to Windows, SSH is standard on Linux, and SNMP is supported by most network devices. The Vanguard Pi appliance connects remotely using these credentials.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials by Category */}
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All ({credentials.length})</TabsTrigger>
            {Object.entries(DEVICE_CATEGORIES).map(([key, cat]) => {
              const count = credentials.filter(c => cat.types.includes(c.credential_type)).length;
              if (count === 0) return null;
              return (
                <TabsTrigger key={key} value={key} className="gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.protocol} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {['all', ...Object.keys(DEVICE_CATEGORIES)].map(tabKey => (
            <TabsContent key={tabKey} value={tabKey} className="space-y-4 mt-4">
              {credentials
                .filter(cred => {
                  if (tabKey === 'all') return true;
                  const cat = DEVICE_CATEGORIES[tabKey as keyof typeof DEVICE_CATEGORIES];
                  return cat?.types.includes(cred.credential_type);
                })
                .map(cred => {
                  const typeInfo = getTypeInfo(cred.credential_type);
                  const Icon = typeInfo.icon;
                  const category = CREDENTIAL_TYPES.find(t => t.id === cred.credential_type)?.category;
                  const catInfo = category ? DEVICE_CATEGORIES[category as keyof typeof DEVICE_CATEGORIES] : null;
                  
                  return (
                    <Card key={cred.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{cred.credential_name}</h3>
                                {catInfo && (
                                  <Badge variant="secondary" className="text-xs">
                                    {catInfo.protocol}
                                  </Badge>
                                )}
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
                })}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
