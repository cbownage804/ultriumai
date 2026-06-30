import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { encryptData as cryptoEncrypt, decryptData as cryptoDecrypt, EncryptedData, AADContext } from '@/utils/crypto';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy,
  Loader2,
  Lock,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface StoredIdentity {
  id: string;
  name: string;
  encrypted_data: string;
  created_at: string;
  updated_at: string;
}

interface DecryptedIdentity {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  created_at: string;
}

export const IdentityProfiles = () => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [identities, setIdentities] = useState<DecryptedIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<DecryptedIdentity | null>(null);
  const [newIdentity, setNewIdentity] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });

  // Use centralized crypto utilities with AAD support
  const encryptIdentityData = async (data: object, identityId?: string): Promise<string> => {
    if (!masterPassword || !user) throw new Error('Master password and user required');
    
    const aadContext: AADContext = {
      userId: user.id,
      entryId: identityId,
    };
    
    const encrypted = await cryptoEncrypt(JSON.stringify(data), masterPassword, undefined, aadContext);
    return JSON.stringify(encrypted);
  };

  const decryptIdentityData = async (encryptedData: string, identityId?: string): Promise<any> => {
    if (!masterPassword || !user) throw new Error('Master password and user required');
    
    const aadContext: AADContext = {
      userId: user.id,
      entryId: identityId,
    };
    
    // Parse the encrypted data (handle both old and new formats)
    const parsed = JSON.parse(encryptedData);
    
    // Check if it's the new EncryptedData format (has ciphertext) or old format
    if (parsed.ciphertext) {
      const decrypted = await cryptoDecrypt(parsed as EncryptedData, masterPassword, parsed.aad ? undefined : aadContext);
      return JSON.parse(decrypted);
    } else {
      // Legacy format with iv, salt, ciphertext (base64 encoded)
      const legacyData: EncryptedData = {
        ciphertext: parsed.ciphertext || '',
        iv: parsed.iv || '',
        salt: parsed.salt || '',
        tag: '',
      };
      const decrypted = await cryptoDecrypt(legacyData, masterPassword);
      return JSON.parse(decrypted);
    }
  };

  // Load and decrypt identities
  useEffect(() => {
    const loadIdentities = async () => {
      if (!user || !isUnlocked) {
        setIdentities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('safepass_identities')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const decrypted: DecryptedIdentity[] = [];
        for (const identity of data || []) {
          try {
            const identityData = await decryptIdentityData(identity.encrypted_data, identity.id);
            decrypted.push({
              id: identity.id,
              name: identity.name,
              firstName: identityData.firstName || '',
              lastName: identityData.lastName || '',
              email: identityData.email || '',
              phone: identityData.phone || '',
              address: identityData.address || '',
              city: identityData.city || '',
              state: identityData.state || '',
              zip: identityData.zip || '',
              country: identityData.country || '',
              created_at: identity.created_at
            });
          } catch {
            console.error('Failed to decrypt identity');
          }
        }
        setIdentities(decrypted);
      } catch (error) {
        console.error('Error loading identities:', error);
        toast.error('Failed to load identities');
      } finally {
        setLoading(false);
      }
    };

    loadIdentities();
  }, [user, isUnlocked, masterPassword]);

  const handleSaveIdentity = async () => {
    if (!newIdentity.name && !newIdentity.firstName) {
      toast.error('Please provide a name');
      return;
    }

    try {
      const identityData = {
        firstName: newIdentity.firstName,
        lastName: newIdentity.lastName,
        email: newIdentity.email,
        phone: newIdentity.phone,
        address: newIdentity.address,
        city: newIdentity.city,
        state: newIdentity.state,
        zip: newIdentity.zip,
        country: newIdentity.country
      };
      const encryptedData = await encryptIdentityData(identityData, editingIdentity?.id);
      const displayName = newIdentity.name || `${newIdentity.firstName} ${newIdentity.lastName}`.trim();

      if (editingIdentity) {
        const { error } = await supabase
          .from('safepass_identities')
          .update({
            name: displayName,
            encrypted_data: encryptedData
          })
          .eq('id', editingIdentity.id);

        if (error) throw error;
        
        setIdentities(prev => prev.map(i => 
          i.id === editingIdentity.id 
            ? { ...i, name: displayName, ...identityData }
            : i
        ));
        toast.success('Identity updated');
      } else {
        const { data, error } = await supabase
          .from('safepass_identities')
          .insert({
            user_id: user?.id,
            name: displayName,
            encrypted_data: encryptedData
          })
          .select()
          .single();

        if (error) throw error;

        setIdentities(prev => [{
          id: data.id,
          name: displayName,
          ...identityData,
          created_at: data.created_at
        }, ...prev]);
        toast.success('Identity created');
      }

      setIsAddDialogOpen(false);
      setEditingIdentity(null);
      setNewIdentity({
        name: '', firstName: '', lastName: '', email: '', phone: '',
        address: '', city: '', state: '', zip: '', country: ''
      });
    } catch (error) {
      console.error('Error saving identity:', error);
      toast.error('Failed to save identity');
    }
  };

  const handleDeleteIdentity = async (identityId: string) => {
    if (!confirm('Are you sure you want to delete this identity?')) return;

    try {
      const { error } = await supabase
        .from('safepass_identities')
        .delete()
        .eq('id', identityId);

      if (error) throw error;

      setIdentities(prev => prev.filter(i => i.id !== identityId));
      toast.success('Identity deleted');
    } catch (error) {
      console.error('Error deleting identity:', error);
      toast.error('Failed to delete identity');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const filteredIdentities = identities.filter(identity =>
    identity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    identity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    identity.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    identity.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isUnlocked) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Vault Locked</h3>
        <p className="text-muted-foreground">Unlock your vault to view identities</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5" />
            Identity Profiles
          </h3>
          <p className="text-muted-foreground text-sm">Save addresses for quick form filling</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary text-black" onClick={() => {
              setEditingIdentity(null);
              setNewIdentity({
                name: '', firstName: '', lastName: '', email: '', phone: '',
                address: '', city: '', state: '', zip: '', country: ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Identity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingIdentity ? 'Edit Identity' : 'New Identity Profile'}</DialogTitle>
              <DialogDescription>Save your information for quick form filling</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="identity-name">Profile Name</Label>
                <Input
                  id="identity-name"
                  value={newIdentity.name}
                  onChange={(e) => setNewIdentity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Home Address, Work"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    value={newIdentity.firstName}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={newIdentity.lastName}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newIdentity.email}
                  onChange={(e) => setNewIdentity(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newIdentity.phone}
                  onChange={(e) => setNewIdentity(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={newIdentity.address}
                  onChange={(e) => setNewIdentity(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main Street"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newIdentity.city}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={newIdentity.state}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    value={newIdentity.zip}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newIdentity.country}
                    onChange={(e) => setNewIdentity(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="United States"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveIdentity} className="flex-1 bg-primary hover:bg-primary text-black">
                  {editingIdentity ? 'Update' : 'Save'} Identity
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search identities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Identities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredIdentities.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Identity Profiles</h3>
          <p className="text-muted-foreground mb-4">Save your information for quick checkout</p>
          <Button className="bg-primary hover:bg-primary text-black" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Identity
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredIdentities.map((identity) => (
              <motion.div
                key={identity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base font-medium">
                            {identity.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {identity.firstName} {identity.lastName}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => copyToClipboard(`${identity.firstName} ${identity.lastName}`.trim())}
                        title="Copy full name"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {identity.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{identity.email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(identity.email)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {identity.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{identity.phone}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100"
                            onClick={() => copyToClipboard(identity.phone)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {identity.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5" />
                          <span className="line-clamp-2 flex-1">
                            {identity.address}
                            {identity.city && `, ${identity.city}`}
                            {identity.state && `, ${identity.state}`}
                            {identity.zip && ` ${identity.zip}`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={() => {
                              const fullAddress = [
                                identity.address,
                                identity.city,
                                identity.state,
                                identity.zip,
                                identity.country
                              ].filter(Boolean).join(', ');
                              copyToClipboard(fullAddress);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingIdentity(identity);
                          setNewIdentity({
                            name: identity.name,
                            firstName: identity.firstName,
                            lastName: identity.lastName,
                            email: identity.email,
                            phone: identity.phone,
                            address: identity.address,
                            city: identity.city,
                            state: identity.state,
                            zip: identity.zip,
                            country: identity.country
                          });
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteIdentity(identity.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
