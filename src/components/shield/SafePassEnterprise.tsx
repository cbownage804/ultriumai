import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Key, 
  Lock, 
  Plus,
  Search,
  Star,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from "lucide-react";

interface SafePassVault {
  id: string;
  vault_name: string;
  description: string;
  is_shared: boolean;
  entries_count: number;
  last_accessed_at: string;
  created_at: string;
}

interface SafePassEntry {
  id: string;
  title: string;
  entry_type: string;
  url: string;
  notes: string;
  is_favorite: boolean;
  password_strength_score: number;
  is_compromised: boolean;
  last_used_at: string;
  created_at: string;
}

export const SafePassEnterprise = () => {
  const [vaults, setVaults] = useState<SafePassVault[]>([]);
  const [entries, setEntries] = useState<SafePassEntry[]>([]);
  const [selectedVault, setSelectedVault] = useState<SafePassVault | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [newVaultDialog, setNewVaultDialog] = useState(false);
  const [newEntryDialog, setNewEntryDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVaults();
  }, []);

  useEffect(() => {
    if (selectedVault) {
      loadEntries(selectedVault.id);
    }
  }, [selectedVault]);

  const loadVaults = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: vaultsData, error } = await supabase
        .from('safepass_vaults')
        .select(`
          *,
          safepass_entries(count)
        `)
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedVaults = vaultsData?.map(vault => ({
        ...vault,
        entries_count: vault.safepass_entries?.length || 0
      })) || [];

      setVaults(enrichedVaults);
    } catch (error) {
      console.error('Error loading vaults:', error);
      toast({
        title: "Error",
        description: "Failed to load password vaults",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (vaultId: string) => {
    try {
      const { data: entriesData, error } = await supabase
        .from('safepass_entries')
        .select('*')
        .eq('vault_id', vaultId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(entriesData || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error",
        description: "Failed to load password entries",
        variant: "destructive",
      });
    }
  };

  const createVault = async (vaultData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('safepass_vaults')
        .insert({
          user_id: user.user.id,
          vault_name: vaultData.name,
          description: vaultData.description,
          encryption_key_hash: 'demo_hash_' + Math.random().toString(36).substr(2, 9)
        });

      if (error) throw error;

      toast({
        title: "✅ Vault Created",
        description: `${vaultData.name} has been created successfully`,
      });

      setNewVaultDialog(false);
      loadVaults();
    } catch (error) {
      console.error('Error creating vault:', error);
      toast({
        title: "Error",
        description: "Failed to create vault",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (entryId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 80) return 'Strong';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'Weak';
    return 'Very Weak';
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.url?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            SafePass Enterprise
          </h2>
          <p className="text-muted-foreground">
            Enterprise password management and security
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={newVaultDialog} onOpenChange={setNewVaultDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Vault
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Vault</DialogTitle>
              </DialogHeader>
              <VaultForm onSubmit={createVault} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vaults Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vaults.map((vault) => (
          <Card 
            key={vault.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedVault?.id === vault.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedVault(vault)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {vault.vault_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{vault.description}</p>
                </div>
                {vault.is_shared && (
                  <Badge variant="secondary">Shared</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Entries:</span>
                  <span className="font-medium">{vault.entries_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last accessed:</span>
                  <span className="text-sm">
                    {vault.last_accessed_at 
                      ? new Date(vault.last_accessed_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Vault Entries */}
      {selectedVault && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                {selectedVault.vault_name} - Entries
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Dialog open={newEntryDialog} onOpenChange={setNewEntryDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Entry</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                      Entry creation will be available after implementing encryption
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EntriesTable 
              entries={filteredEntries} 
              showPasswords={showPasswords}
              onTogglePassword={togglePasswordVisibility}
              onCopy={copyToClipboard}
              getStrengthColor={getStrengthColor}
              getStrengthLabel={getStrengthLabel}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Vault creation form
const VaultForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Vault Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Optional description..."
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Create Vault</Button>
      </div>
    </form>
  );
};

// Entries table component
const EntriesTable = ({ 
  entries, 
  showPasswords, 
  onTogglePassword, 
  onCopy, 
  getStrengthColor, 
  getStrengthLabel 
}: any) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No entries found in this vault
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Title</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">URL</th>
            <th className="text-left p-2">Password Strength</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: SafePassEntry) => (
            <tr key={entry.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  {entry.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  <span className="font-medium">{entry.title}</span>
                </div>
              </td>
              <td className="p-2">
                <Badge variant="outline">{entry.entry_type}</Badge>
              </td>
              <td className="p-2">
                {entry.url && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{entry.url}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(entry.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getStrengthColor(entry.password_strength_score)}`}>
                    {getStrengthLabel(entry.password_strength_score)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({entry.password_strength_score}/100)
                  </span>
                </div>
              </td>
              <td className="p-2">
                {entry.is_compromised ? (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Compromised
                  </Badge>
                ) : (
                  <Badge variant="default">Secure</Badge>
                )}
              </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePassword(entry.id)}
                  >
                    {showPasswords[entry.id] ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy('***masked***', 'Password')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};