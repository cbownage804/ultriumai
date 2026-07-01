import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useVault, PasswordEntry as VaultEntry } from '@/hooks/useSafePass';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { encryptData } from '@/utils/crypto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Star,
  Globe,
  CreditCard,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Upload,
  Download,
  Key,
  User,
  Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TOTPManager } from './TOTPManager';
import { EntryAttachments } from './EntryAttachments';
import { ShareEntry } from './ShareEntry';
import { PasswordCard } from './PasswordCard';
import { SecureNotes } from './SecureNotes';
import { CreditCards } from './CreditCards';
import { IdentityProfiles } from './IdentityProfiles';
import { PasswordHealthDashboard } from './PasswordHealthDashboard';
import { VaultLoadingScreen } from './VaultLoadingScreen';
import { PasswordScoreBlock } from './PasswordScoreBlock';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { AnimatePresence } from 'framer-motion';

// Input sanitization helper
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
};

// Cache for decrypted entries - persists across component remounts
const decryptedEntriesCache = new Map<string, DisplayEntry[]>();
const lastDecryptTime = new Map<string, number>();
const DECRYPT_CACHE_TTL = 60 * 1000; // 1 minute

interface DisplayEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website: string;
  notes: string;
  category: string;
  is_favorite: boolean;
  password_strength: number;
  created_at: string;
  vault_id: string;
}

const categories = [
  { value: 'login', label: 'Logins', icon: Globe },
  { value: 'General', label: 'General', icon: Globe },
  { value: 'payment', label: 'Payment Cards', icon: CreditCard },
  { value: 'identity', label: 'Identity', icon: FileText },
  { value: 'secure-note', label: 'Secure Notes', icon: Lock },
];

export const PasswordVault = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    vaults, 
    entries: safePassEntries, 
    isLoading: vaultsLoading,
    createEntry, 
    deleteEntry: deleteVaultEntry,
    updateEntry,
    createVault,
    loadVaults,
    selectedVault,
    setSelectedVault,
    getEntryUsername,
    getEntryPassword,
    getEntryWebsite,
    getEntryNotes,
    generatePassword: generateSecurePassword
  } = useVault();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  // Initialize with cached data if available
  const getCachedEntries = useCallback(() => {
    if (selectedVault && decryptedEntriesCache.has(selectedVault)) {
      const lastTime = lastDecryptTime.get(selectedVault) || 0;
      if (Date.now() - lastTime < DECRYPT_CACHE_TTL) {
        return decryptedEntriesCache.get(selectedVault) || [];
      }
    }
    return [];
  }, [selectedVault]);
  
  const [entries, setEntries] = useState<DisplayEntry[]>(getCachedEntries);
  const [loading, setLoading] = useState(!getCachedEntries().length);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'all' | 'weak' | 'strong'>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DisplayEntry | null>(null);
  const [decryptedPasswords, setDecryptedPasswords] = useState<Record<string, string>>({});
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track decryption in progress to avoid duplicates
  const decryptionInProgress = useRef(false);

  const [newEntry, setNewEntry] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: '',
    category: 'General'
  });
  // Auto-create default vault if none exist (only once per session, with DB check)
  const [vaultInitialized, setVaultInitialized] = useState(false);

  const ensureDefaultVault = async (): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase.rpc('ensure_my_vault');
    if (error) {
      console.error('Failed to ensure default vault');
      toast.error('Failed to initialize your vault. Please try again.');
      return null;
    }

    // RPC returns the vault id (existing or created)
    const vaultId = (data as unknown as string) || null;
    if (vaultId) {
      setSelectedVault(vaultId);
    }
    await loadVaults();
    return vaultId;
  };
  
  useEffect(() => {
    const initializeVault = async () => {
      if (!user || vaultInitialized || vaultsLoading) return;

      // Mark as initialized if vaults already exist
      if (vaults.length > 0) {
        setVaultInitialized(true);
        return;
      }

      setVaultInitialized(true);

      // Use a single, idempotent DB function to avoid duplicate creation races
      const vaultId = await ensureDefaultVault();
      if (vaultId && !selectedVault) {
        setSelectedVault(vaultId);
      }
    };

    initializeVault();
  }, [user, vaultsLoading, vaults.length, vaultInitialized, selectedVault]);

  // Auto-select first vault if none selected
  useEffect(() => {
    if (vaults.length > 0 && !selectedVault) {
      setSelectedVault(vaults[0].id);
    }
  }, [vaults, selectedVault]);

  // Decrypt entries when they change - with caching
  useEffect(() => {
    const decryptEntries = async () => {
      // Skip if no entries or not unlocked
      if (!isUnlocked || safePassEntries.length === 0) {
        setEntries([]);
        setLoading(false);
        return;
      }
      
      // Skip if already decrypting
      if (decryptionInProgress.current) return;
      
      // Check cache first - show cached data immediately while re-decrypting in background
      const cacheKey = selectedVault || 'default';
      const cachedData = decryptedEntriesCache.get(cacheKey);
      const cacheTime = lastDecryptTime.get(cacheKey) || 0;
      const cacheValid = cachedData && (Date.now() - cacheTime < DECRYPT_CACHE_TTL);
      
      // Show cached data immediately if available
      if (cachedData && cachedData.length > 0) {
        setEntries(cachedData);
        // If cache is still valid, no need to re-decrypt
        if (cacheValid && cachedData.length === safePassEntries.length) {
          setLoading(false);
          return;
        }
      }
      
      // Only show loading if no cached data
      if (!cachedData || cachedData.length === 0) {
        setLoading(true);
      }
      
      decryptionInProgress.current = true;
      
      try {
        // Decrypt all entries in parallel for speed
        const decryptPromises = safePassEntries.map(async (entry) => {
          try {
            const [username, password, website, notes] = await Promise.all([
              getEntryUsername(entry),
              getEntryPassword(entry),
              getEntryWebsite(entry),
              getEntryNotes(entry)
            ]);

            return {
              id: entry.id,
              title: entry.title,
              username: username || '',
              password: password || '',
              website: website || entry.url || '',
              notes: notes || '',
              category: entry.category || 'General',
              is_favorite: entry.is_favorite,
              password_strength: entry.password_strength_score,
              created_at: entry.created_at,
              vault_id: entry.vault_id
            } as DisplayEntry;
          } catch (error) {
            console.error('Error decrypting password entry');
            return null;
          }
        });
        
        const results = await Promise.all(decryptPromises);
        const decrypted = results.filter((e): e is DisplayEntry => e !== null);
        
        // Update cache
        decryptedEntriesCache.set(cacheKey, decrypted);
        lastDecryptTime.set(cacheKey, Date.now());
        
        setEntries(decrypted);
      } finally {
        decryptionInProgress.current = false;
        setLoading(false);
      }
    };

    decryptEntries();
  }, [safePassEntries, isUnlocked, selectedVault, getEntryUsername, getEntryPassword, getEntryWebsite, getEntryNotes]);

  const calculatePasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    return Math.min(score, 100);
  };

  // Use cryptographically secure password generation
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(randomBytes[i] % chars.length);
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const generated = generatePassword();
    setNewEntry(prev => ({ ...prev, password: generated }));
  };

  const handleSaveEntry = async () => {
    // Must be unlocked to encrypt & save
    if (!isUnlocked || !masterPassword) {
      toast.error('Unlock Vault to save passwords.');
      return;
    }

    // Prevent double-clicks
    if (isSaving) return;
    setIsSaving(true);

    // Ensure we have a vault on first save
    let vaultId = selectedVault;
    if (!vaultId) {
      vaultId = await ensureDefaultVault();
      if (!vaultId) {
        setIsSaving(false);
        return;
      }
    }

    try {
      if (editingEntry) {
        // Update existing entry - re-encrypt and update in DB
        const sanitizedEntry = {
          title: sanitizeInput(newEntry.title),
          url: sanitizeInput(newEntry.website),
          category: sanitizeInput(newEntry.category),
          notes: sanitizeInput(newEntry.notes),
        };

        // If password changed, need to re-encrypt
        if (newEntry.password !== editingEntry.password && masterPassword) {
          const dataToEncrypt = JSON.stringify({
            username: sanitizeInput(newEntry.username),
            password: newEntry.password,
            website: sanitizeInput(newEntry.website),
            notes: sanitizeInput(newEntry.notes)
          });
          const encryptedData = await encryptData(dataToEncrypt, masterPassword);
          Object.assign(sanitizedEntry, { 
            encrypted_data: encryptedData,
            password_strength_score: calculatePasswordStrength(newEntry.password)
          });
        }

        const result = await updateEntry(editingEntry.id, sanitizedEntry);
        if (!result) {
          toast.error('Failed to update password entry');
          setIsSaving(false);
          return;
        }

        toast.success('Password entry updated successfully');
      } else {
        // Sanitize all inputs before saving
        const sanitizedEntry = {
          vault_id: vaultId,
          title: sanitizeInput(newEntry.title),
          username: sanitizeInput(newEntry.username),
          password: newEntry.password, // Don't sanitize password - may contain special chars
          website: sanitizeInput(newEntry.website),
          notes: sanitizeInput(newEntry.notes),
          category: sanitizeInput(newEntry.category)
        };

        // Create new entry using the hook
        const result = await createEntry(sanitizedEntry);

        if (!result) {
          // Don't close the dialog on failure
          toast.error('Failed to save password entry');
          setIsSaving(false);
          return;
        }

        // Invalidate cache so fresh data shows
        if (selectedVault) {
          decryptedEntriesCache.delete(selectedVault);
        }
        toast.success('Password entry added successfully');
      }

      setIsAddDialogOpen(false);
      setEditingEntry(null);
      setNewEntry({
        title: '',
        username: '',
        password: '',
        website: '',
        notes: '',
        category: 'General'
      });
      setIsSaving(false);
    } catch (error) {
      // Log generic error without sensitive data
      console.error('Error saving password entry');
      toast.error('Failed to save password entry');
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this password entry?')) return;

    try {
      const success = await deleteVaultEntry(entryId);
      if (success) {
        // Invalidate cache
        if (selectedVault) {
          decryptedEntriesCache.delete(selectedVault);
        }
        toast.success('Password entry deleted');
      }
    } catch (error) {
      // Log generic error without sensitive data
      console.error('Error deleting password entry');
      toast.error('Failed to delete password entry');
    }
  };


  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const togglePasswordVisibility = (entryId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  const toggleFavorite = (entryId: string) => {
    setEntries(prev => prev.map(entry =>
      entry.id === entryId ? { ...entry, is_favorite: !entry.is_favorite } : entry
    ));
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600';
    if (strength >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 80) return 'Strong';
    if (strength >= 60) return 'Medium';
    return 'Weak';
  };

  const filteredEntries = useMemo(() => {
    let result = entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.website.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    // Apply sorting based on sortBy
    if (sortBy === 'weak') {
      // Show weak passwords first (lowest strength first)
      result = [...result].sort((a, b) => a.password_strength - b.password_strength);
    } else if (sortBy === 'strong') {
      // Show strong passwords first (highest strength first)
      result = [...result].sort((a, b) => b.password_strength - a.password_strength);
    }
    
    return result;
  }, [entries, searchTerm, selectedCategory, sortBy]);

  const weakPasswords = entries.filter(entry => entry.password_strength < 60).length;
  const strongPasswords = entries.filter(entry => entry.password_strength >= 80).length;
  const overallScore = entries.length === 0
    ? 100
    : Math.round(entries.reduce((sum, e) => sum + (e.password_strength || 0), 0) / entries.length);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="sr-only">
          <h2>Passwords</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/app/passwords/import')} className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary h-10 sm:h-9 touch-target tap-scale flex-1 sm:flex-initial min-w-[100px]">
            <Upload className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Import</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/passwords/export')} className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary h-10 sm:h-9 touch-target tap-scale flex-1 sm:flex-initial min-w-[100px]">
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="text-sm">Export</span>
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary text-black h-10 sm:h-9 touch-target tap-scale flex-1 sm:flex-initial min-w-[140px]">
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="text-sm">Add Password</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md border-primary/30 mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary text-lg sm:text-xl">
                {editingEntry ? 'Edit Password Entry' : 'Add New Password'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Fill in the details for your password entry
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-primary/80 text-sm">Title *</Label>
                <Input
                  id="title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Gmail Account"
                  className="border-primary/30 focus:border-primary focus:ring-primary/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-primary/80">Category</Label>
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="border-primary/30 focus:border-primary focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="website" className="text-primary/80">Website</Label>
                <Input
                  id="website"
                  value={newEntry.website}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div>
                <Label htmlFor="username" className="text-primary/80">Username/Email</Label>
                <Input
                  id="username"
                  value={newEntry.username}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="your@email.com"
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-primary/80">Password *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? "text" : "password"}
                    value={newEntry.password}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter or generate password"
                    className="pr-10 border-primary/30 focus:border-primary focus:ring-primary/20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:text-primary"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {newEntry.password && (
                  <div className="mt-1 text-sm">
                    Strength: <span className={getStrengthColor(calculatePasswordStrength(newEntry.password))}>
                      {getStrengthLabel(calculatePasswordStrength(newEntry.password))}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes" className="text-primary/80">Notes</Label>
                <Textarea
                  id="notes"
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  className="border-primary/30 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveEntry}
                  disabled={!newEntry.title || !newEntry.password || !isUnlocked || isSaving}
                  className="flex-1 bg-primary hover:bg-primary text-black"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : !isUnlocked ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Unlock to Save
                    </>
                  ) : (
                    <>{editingEntry ? 'Update' : 'Save'} Password</>
                  )}
                </Button>
                <Button
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingEntry(null);
                    setNewEntry({
                      title: '',
                      username: '',
                      password: '',
                      website: '',
                      notes: '',
                      category: 'login'
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Unified Password Score */}
      <PasswordScoreBlock
        score={overallScore}
        stats={[
          { label: 'Strong passwords', value: strongPasswords, tone: 'success' },
          { label: 'Weak passwords', value: weakPasswords, tone: 'warning' },
          { label: 'Breaches', value: 0, tone: 'warning' },
          { label: 'Accounts using MFA', value: 0 },
        ]}
      />

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passwords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Password Entries */}
      <div className="space-y-4">
        {/* Show loading screen while decrypting */}
        {loading ? (
          <VaultLoadingScreen isLoading={loading} />
        ) : filteredEntries.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No passwords found</h3>
            <p className="text-muted-foreground mb-4">
              {entries.length === 0 
                ? "Start by adding your first password entry" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {entries.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Password
              </Button>
            )}
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredEntries.map((entry) => (
              <PasswordCard
                key={entry.id}
                entry={entry}
                onEdit={() => {
                  setEditingEntry(entry);
                  setNewEntry({
                    title: entry.title,
                    username: entry.username,
                    password: entry.password,
                    website: entry.website,
                    notes: entry.notes,
                    category: entry.category
                  });
                  setIsAddDialogOpen(true);
                }}
                onDelete={() => handleDeleteEntry(entry.id)}
                onToggleFavorite={() => toggleFavorite(entry.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
        </TabsContent>

        {/* Secure Notes Tab */}
        <TabsContent value="notes">
          <SecureNotes />
        </TabsContent>

        {/* Credit Cards Tab */}
        <TabsContent value="cards">
          <CreditCards />
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <IdentityProfiles />
        </TabsContent>




        {/* Password Health Tab */}
        <TabsContent value="health">
          <PasswordHealthDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};