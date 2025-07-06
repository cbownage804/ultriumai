import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Key, 
  Plus,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  CheckCircle,
  Users,
  Loader2,
  Edit,
  Trash2,
  Search,
  Filter,
  Settings,
  Download,
  Upload,
  Share,
  Lock,
  Unlock,
  History,
  Globe
} from "lucide-react";
import { useSafePass, PasswordEntry, PasswordVault } from "@/hooks/useSafePass";
import { useToast } from "@/hooks/use-toast";

interface SafePassAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafePassApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafePassAppProps) => {
  const {
    vaults,
    entries,
    auditLogs,
    isLoading,
    selectedVault,
    setSelectedVault,
    createVault,
    createEntry,
    updateEntry,
    deleteEntry,
    generatePassword,
    calculatePasswordStrength
  } = useSafePass();

  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  
  const { toast } = useToast();

  // Form states
  const [vaultForm, setVaultForm] = useState({
    name: '',
    description: ''
  });
  
  const [entryForm, setEntryForm] = useState({
    vault_id: '',
    name: '',
    username: '',
    password: '',
    website: '',
    category: 'General',
    notes: '',
    tags: [] as string[]
  });

  const generateSecurePassword = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const password = generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true
    });
    
    setNewPassword(password);
    setEntryForm(prev => ({ ...prev, password }));
    setIsGenerating(false);
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "text-green-500";
    if (strength >= 60) return "text-yellow-500";
    if (strength >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return "Strong";
    if (strength >= 60) return "Good";
    if (strength >= 40) return "Fair";
    return "Weak";
  };

  const copyToClipboard = (text: string, label: string = "Text") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleCreateVault = async () => {
    if (!vaultForm.name.trim()) return;
    
    const vault = await createVault({
      name: vaultForm.name,
      description: vaultForm.description
    });
    
    if (vault) {
      setVaultForm({ name: '', description: '' });
      setShowCreateVault(false);
      setSelectedVault(vault.id);
    }
  };

  const handleCreateEntry = async () => {
    if (!entryForm.name.trim() || !entryForm.password.trim() || !entryForm.vault_id) return;
    
    const entry = await createEntry({
      vault_id: entryForm.vault_id,
      name: entryForm.name,
      username: entryForm.username,
      password: entryForm.password,
      website: entryForm.website,
      category: entryForm.category,
      notes: entryForm.notes,
      tags: entryForm.tags
    });
    
    if (entry) {
      setEntryForm({
        vault_id: '',
        name: '',
        username: '',
        password: '',
        website: '',
        category: 'General',
        notes: '',
        tags: []
      });
      setShowCreateEntry(false);
    }
  };

  // Initialize vault selection
  useEffect(() => {
    if (vaults.length > 0 && !selectedVault) {
      setSelectedVault(vaults[0].id);
    }
  }, [vaults, selectedVault, setSelectedVault]);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.website?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalEntries = entries.length;
  const averageStrength = totalEntries > 0 ? Math.round(entries.reduce((acc, e) => acc + e.strength_score, 0) / totalEntries) : 0;
  const weakPasswords = entries.filter(e => e.strength_score < 60).length;
  const sharedEntries = entries.filter(e => e.is_shared).length;
  const categories = Array.from(new Set(entries.map(e => e.category)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafePass
          </h1>
          <p className="text-muted-foreground">
            Enterprise password management with security monitoring and team collaboration
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/embed-demo', '_blank')}
            className="mb-2"
          >
            <Globe className="h-4 w-4 mr-2" />
            Embeddable Widget Demo
          </Button>
          
          <Dialog open={showCreateVault} onOpenChange={setShowCreateVault}>
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
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vault-name">Vault Name</Label>
                  <Input
                    id="vault-name"
                    value={vaultForm.name}
                    onChange={(e) => setVaultForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Personal, Work, Team"
                  />
                </div>
                <div>
                  <Label htmlFor="vault-description">Description (Optional)</Label>
                  <Textarea
                    id="vault-description"
                    value={vaultForm.description}
                    onChange={(e) => setVaultForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this vault is for..."
                  />
                </div>
                <Button onClick={handleCreateVault} className="w-full">
                  Create Vault
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showCreateEntry} onOpenChange={setShowCreateEntry}>
            <DialogTrigger asChild>
              <Button disabled={!selectedVault}>
                <Plus className="h-4 w-4 mr-2" />
                Add Password
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Password Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-name">Name *</Label>
                    <Input
                      id="entry-name"
                      value={entryForm.name}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Gmail Account"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-website">Website</Label>
                    <Input
                      id="entry-website"
                      value={entryForm.website}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="e.g., gmail.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-username">Username/Email</Label>
                    <Input
                      id="entry-username"
                      value={entryForm.username}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="username or email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-category">Category</Label>
                    <Select value={entryForm.category} onValueChange={(value) => setEntryForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Work">Work</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Banking">Banking</SelectItem>
                        <SelectItem value="Social">Social Media</SelectItem>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="entry-password">Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="entry-password"
                      type="password"
                      value={entryForm.password}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter or generate password"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSecurePassword}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                    </Button>
                  </div>
                  {entryForm.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <Progress value={calculatePasswordStrength(entryForm.password)} className="flex-1" />
                        <span className={`text-sm font-medium ${getStrengthColor(calculatePasswordStrength(entryForm.password))}`}>
                          {getStrengthLabel(calculatePasswordStrength(entryForm.password))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="entry-notes">Notes (Optional)</Label>
                  <Textarea
                    id="entry-notes"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>

                <input type="hidden" value={selectedVault || ''} onChange={(e) => setEntryForm(prev => ({ ...prev, vault_id: e.target.value }))} />
                
                <Button 
                  onClick={handleCreateEntry} 
                  className="w-full"
                  disabled={!entryForm.name.trim() || !entryForm.password.trim()}
                >
                  Add Password Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: getStrengthColor(averageStrength).replace('text-', '') }}>
              {averageStrength}%
            </div>
            <Progress value={averageStrength} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passwords</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">
              Across {vaults.length} vault{vaults.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{weakPasswords}</div>
            <p className="text-xs text-muted-foreground">
              Passwords need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Access</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{sharedEntries}</div>
            <p className="text-xs text-muted-foreground">
              Team credentials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="passwords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="passwords">Password Vault</TabsTrigger>
          <TabsTrigger value="generator">Password Generator</TabsTrigger>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="passwords" className="space-y-4">
          {/* Vault Selector & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Select value={selectedVault || ''} onValueChange={setSelectedVault}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a vault" />
              </SelectTrigger>
              <SelectContent>
                {vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    {vault.name} ({entries.filter(e => e.vault_id === vault.id).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Password Entries */}
          <div className="grid gap-4">
            {filteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No passwords found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || categoryFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "Add your first password to get started"}
                  </p>
                  {(!searchTerm && categoryFilter === "all") && (
                    <Button onClick={() => setShowCreateEntry(true)} disabled={!selectedVault}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Password
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold">{entry.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {entry.website && `${entry.website} • `}
                            {entry.username}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={entry.strength_score >= 60 ? "default" : "destructive"}>
                            {getStrengthLabel(entry.strength_score)}
                          </Badge>
                          <Badge variant="secondary">{entry.category}</Badge>
                          {entry.is_shared && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              Shared
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(entry.username || '', 'Username')}
                          disabled={!entry.username}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(showPassword === entry.id ? null : entry.id)}
                        >
                          {showPassword === entry.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(atob(entry.password_encrypted), 'Password')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {showPassword === entry.id && (
                      <div className="bg-muted p-3 rounded-md mb-3">
                        <div className="font-mono text-sm break-all">
                          {atob(entry.password_encrypted)}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Progress value={entry.strength_score} className="flex-1 mr-4" />
                      <span className="text-sm text-muted-foreground">
                        Last used: {entry.last_used_at ? new Date(entry.last_used_at).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <CardTitle>Password Generator</CardTitle>
              <CardDescription>Generate secure passwords with custom requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newPassword}
                  placeholder="Generated password will appear here"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newPassword, 'Generated password')}
                  disabled={!newPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={generateSecurePassword}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Strong Password
                  </>
                )}
              </Button>

              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Strength:</span>
                    <div className="flex items-center gap-2">
                      <Progress value={calculatePasswordStrength(newPassword)} className="w-32" />
                      <span className={`text-sm font-medium ${getStrengthColor(calculatePasswordStrength(newPassword))}`}>
                        {getStrengthLabel(calculatePasswordStrength(newPassword))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit</CardTitle>
              <CardDescription>Monitor your password security and access logs</CardDescription>
            </CardHeader>
            <CardContent>
              {weakPasswords > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {weakPasswords} weak password{weakPasswords > 1 ? 's' : ''} that should be updated immediately.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <h4 className="font-semibold">Recent Activity</h4>
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground">No activity logged yet.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {log.action} {log.details?.name && `"${log.details.name}"`}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};