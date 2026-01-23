import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Key,
  Folder,
  MoreHorizontal,
  Download,
  Upload,
  Settings,
  Lock,
  Unlock,
  History,
  Globe,
  User,
  Bot,
  ShieldAlert
} from "lucide-react";
import { useSafePass, PasswordEntry, PasswordVault } from "@/hooks/useSafePass";
import { useToast } from "@/hooks/use-toast";
import { MasterPasswordSetup } from "@/components/safepass/MasterPasswordSetup";
import { SecurePasswordGenerator } from "@/components/safepass/SecurePasswordGenerator";
import { AppAIChat } from "@/components/shared/AppAIChat";
import { DarkWebCheck } from "@/components/shared/DarkWebCheck";
import { useAuth } from "@/hooks/useAuth";

interface SafePassAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafePassApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafePassAppProps) => {
  const { user } = useAuth();
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
    calculatePasswordStrength,
    masterPassword,
    getEntryName,
    getEntryUsername,
    getEntryWebsite,
    getEntryPassword,
    getEntryNotes,
    getEntryStrengthScore,
    isEntryShared,
    getVaultName
  } = useSafePass();

  const [showPassword, setShowPassword] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showCreateVault, setShowCreateVault] = useState(false);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDarkWebCheck, setShowDarkWebCheck] = useState(false);
  
  const { toast } = useToast();

  // Form states
  const [vaultForm, setVaultForm] = useState({
    name: '',
    description: ''
  });
  
  const [entryForm, setEntryForm] = useState({
    vault_id: selectedVault || '',
    title: '',
    username: '',
    password: '',
    website: '',
    category: 'General',
    notes: '',
    tags: [] as string[]
  });

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Generate password
  const handleGeneratePassword = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generatePassword(16, {
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true
      });
      setNewPassword(generated);
      setEntryForm(prev => ({ ...prev, password: generated }));
      setIsGenerating(false);
    }, 500);
  };

  // Create vault handler
  const handleCreateVault = async () => {
    if (!vaultForm.name.trim()) return;
    
    const vault = await createVault({
      name: vaultForm.name,
      description: vaultForm.description,
      is_shared: false
    });
    
    if (vault) {
      setVaultForm({ name: '', description: '' });
      setShowCreateVault(false);
      setSelectedVault(vault.id);
    }
  };

  const handleCreateEntry = async () => {
    if (!entryForm.title.trim() || !entryForm.password.trim() || !entryForm.vault_id) return;
    
    const entry = await createEntry({
      vault_id: entryForm.vault_id,
      title: entryForm.title,
      username: entryForm.username,
      password: entryForm.password,
      website: entryForm.website,
      category: entryForm.category,
      notes: entryForm.notes,
      tags: entryForm.tags
    });
    
    if (entry) {
      setEntryForm({
        vault_id: selectedVault || '',
        title: '',
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

  // Set vault_id in entry form when selectedVault changes
  useEffect(() => {
    if (selectedVault) {
      setEntryForm(prev => ({ ...prev, vault_id: selectedVault }));
    }
  }, [selectedVault]);

  // Create sync helpers for UI display
  const [entryDisplayData, setEntryDisplayData] = useState<Record<string, {username: string, website: string, password: string}>>({});

  // Update display data when entries change
  useEffect(() => {
    const updateDisplayData = async () => {
      const newDisplayData: Record<string, {username: string, website: string, password: string}> = {};
      for (const entry of entries) {
        try {
          newDisplayData[entry.id] = {
            username: await getEntryUsername(entry),
            website: await getEntryWebsite(entry),
            password: await getEntryPassword(entry)
          };
        } catch (error) {
          newDisplayData[entry.id] = {
            username: '[Error]',
            website: '[Error]',
            password: '[Error]'
          };
        }
      }
      setEntryDisplayData(newDisplayData);
    };

    if (entries.length > 0) {
      updateDisplayData();
    }
  }, [entries, masterPassword.isUnlocked]);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const displayData = entryDisplayData[entry.id];
    const matchesSearch = getEntryName(entry).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (displayData?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (displayData?.website || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || entry.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalEntries = entries.length;
  const averageStrength = totalEntries > 0 ? Math.round(entries.reduce((acc, e) => acc + getEntryStrengthScore(e), 0) / totalEntries) : 0;
  const weakPasswords = entries.filter(e => getEntryStrengthScore(e) < 60).length;
  const sharedEntries = 0; // Not implemented in current schema
  const categories = Array.from(new Set(entries.map(e => e.category)));

  // Show master password setup if not set
  if (!masterPassword.hasUserSetMasterPassword()) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <MasterPasswordSetup
          onMasterPasswordSet={masterPassword.setMasterPassword}
          isCreating={true}
          title="Setup SafePass Vault"
          description="Create a master password to encrypt and secure all your passwords."
        />
      </div>
    );
  }

  // Show unlock screen if locked
  if (!masterPassword.isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <MasterPasswordSetup
          onMasterPasswordSet={async (password) => {
            const result = await masterPassword.unlockWithPassword(password);
            if (!result.success && result.error) {
              toast({
                title: "Unlock Failed",
                description: result.error,
                variant: "destructive",
              });
            }
          }}
          onCancel={() => {}}
          isCreating={false}
          title="Unlock SafePass Vault"
          description="Enter your master password to access your secure vault."
        />
      </div>
    );
  }

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
            Secure password management and vault system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAIChat(!showAIChat)}
            size="sm"
            className={showAIChat ? 'bg-blue-500/10 text-blue-500' : ''}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDarkWebCheck(!showDarkWebCheck)}
            size="sm"
            className={showDarkWebCheck ? 'bg-purple-500/10 text-purple-500' : ''}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Breach Check
          </Button>
          <Button
            variant="outline"
            onClick={() => masterPassword.lock()}
            size="sm"
          >
            <Lock className="h-4 w-4 mr-2" />
            Lock Vault
          </Button>
          <Dialog open={showCreateVault} onOpenChange={setShowCreateVault}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Folder className="h-4 w-4 mr-2" />
                New Vault
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Vault</DialogTitle>
                <DialogDescription>
                  Create a new password vault to organize your credentials
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vault-name">Vault Name</Label>
                  <Input
                    id="vault-name"
                    value={vaultForm.name}
                    onChange={(e) => setVaultForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter vault name"
                  />
                </div>
                <div>
                  <Label htmlFor="vault-description">Description</Label>
                  <Textarea
                    id="vault-description"
                    value={vaultForm.description}
                    onChange={(e) => setVaultForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
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
              <Button style={{ backgroundColor: brandColor }}>
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Password Entry</DialogTitle>
                <DialogDescription>
                  Add a new password entry to your vault
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-title">Title</Label>
                    <Input
                      id="entry-title"
                      value={entryForm.title}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Gmail Account"
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
                        <SelectItem value="Social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-username">Username/Email</Label>
                    <Input
                      id="entry-username"
                      value={entryForm.username}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Username or email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-website">Website</Label>
                    <Input
                      id="entry-website"
                      value={entryForm.website}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="entry-password">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="entry-password"
                      type="password"
                      value={entryForm.password}
                      onChange={(e) => setEntryForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                    <Button 
                      onClick={() => setShowPasswordGenerator(true)} 
                      variant="outline"
                      type="button"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {entryForm.password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Strength:</span>
                        <Progress value={calculatePasswordStrength(entryForm.password)} className="flex-1" />
                        <span className="text-sm font-medium">{calculatePasswordStrength(entryForm.password)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="entry-notes">Notes</Label>
                  <Textarea
                    id="entry-notes"
                    value={entryForm.notes}
                    onChange={(e) => setEntryForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                  />
                </div>
                <Button onClick={handleCreateEntry} className="w-full" disabled={!entryForm.title || !entryForm.password}>
                  Create Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Password Generator Dialog */}
      <Dialog open={showPasswordGenerator} onOpenChange={setShowPasswordGenerator}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Password Generator</DialogTitle>
            <DialogDescription>
              Generate secure passwords and passphrases
            </DialogDescription>
          </DialogHeader>
          <SecurePasswordGenerator
            onPasswordSelect={(password) => {
              setEntryForm(prev => ({ ...prev, password }));
              setShowPasswordGenerator(false);
            }}
            embedded={true}
          />
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${brandColor}20` }}>
                <Key className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalEntries}</p>
                <p className="text-sm text-muted-foreground">Total Passwords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageStrength}%</p>
                <p className="text-sm text-muted-foreground">Avg Strength</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weakPasswords}</p>
                <p className="text-sm text-muted-foreground">Weak Passwords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vaults.length}</p>
                <p className="text-sm text-muted-foreground">Vaults</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Vault Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Vaults
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                <Button
                  variant={selectedVault === null ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedVault(null)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  All Vaults
                </Button>
                {vaults.map((vault) => (
                  <Button
                    key={vault.id}
                    variant={selectedVault === vault.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedVault(vault.id)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {getVaultName(vault)}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Password Entries</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Strength</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {entry.category === 'Banking' && <Key className="h-4 w-4 text-green-600" />}
                            {entry.category === 'Work' && <Folder className="h-4 w-4 text-blue-600" />}
                            {entry.category === 'Personal' && <User className="h-4 w-4 text-purple-600" />}
                            {entry.category === 'Social' && <Globe className="h-4 w-4 text-orange-600" />}
                            {entry.category === 'General' && <Key className="h-4 w-4 text-gray-600" />}
                            {getEntryName(entry)}
                          </div>
                        </TableCell>
                        <TableCell>{entryDisplayData[entry.id]?.username || '[Loading...]'}</TableCell>
                        <TableCell>{entryDisplayData[entry.id]?.website || '[Loading...]'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={getEntryStrengthScore(entry)} className="w-16 h-2" />
                            <span className="text-sm">{getEntryStrengthScore(entry)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(entryDisplayData[entry.id]?.password || '')}
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteEntry(entry.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredEntries.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No password entries found</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <div className="fixed right-4 bottom-4 w-96 z-50">
          <AppAIChat
            appType="safepass"
            context={{ entries_count: entries.length, weak_passwords: weakPasswords }}
            onClose={() => setShowAIChat(false)}
          />
        </div>
      )}

      {/* Dark Web Check Modal */}
      {showDarkWebCheck && (
        <div className="fixed right-4 bottom-4 w-[450px] z-50">
          <DarkWebCheck
            userId={user?.id}
            onClose={() => setShowDarkWebCheck(false)}
          />
        </div>
      )}
    </div>
  );
};