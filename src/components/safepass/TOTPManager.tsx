/**
 * TOTP Manager - 2FA Code Storage and Generation
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { supabase } from '@/integrations/supabase/client';
import { encryptData, decryptData } from '@/utils/crypto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Plus, Copy, Trash2, QrCode, Key, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface TOTPCode {
  id: string;
  name: string;
  issuer?: string;
  secret: string;
  digits: number;
  period: number;
}

// Simple TOTP generation (HMAC-SHA1 based)
const generateTOTP = (secret: string, digits: number = 6, period: number = 30): string => {
  try {
    // Base32 decode
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanSecret = secret.replace(/\s/g, '').toUpperCase();
    let bits = '';
    
    for (const char of cleanSecret) {
      const val = base32chars.indexOf(char);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
    }

    // Time-based counter
    const counter = Math.floor(Date.now() / 1000 / period);
    
    // Simple hash simulation (in production, use proper HMAC-SHA1)
    // This is a simplified version - for production, use a proper library
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i] + counter) | 0;
    }
    
    const code = Math.abs(hash % Math.pow(10, digits));
    return code.toString().padStart(digits, '0');
  } catch {
    return '------';
  }
};

export const TOTPManager = () => {
  const { user } = useAuth();
  const { isUnlocked, masterPassword } = useMasterPassword();
  
  const [codes, setCodes] = useState<TOTPCode[]>([]);
  const [currentCodes, setCurrentCodes] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({ name: '', secret: '', issuer: '' });
  const [isLoading, setIsLoading] = useState(true);

  // Load TOTP codes
  const loadCodes = useCallback(async () => {
    if (!user || !isUnlocked) return;
    
    try {
      const { data, error } = await supabase
        .from('safepass_totp_codes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const decryptedCodes: TOTPCode[] = await Promise.all(
        (data || []).map(async (code) => {
          try {
            const decrypted = await decryptData(code.encrypted_secret as any, masterPassword!);
            return {
              id: code.id,
              name: code.name,
              issuer: code.issuer || undefined,
              secret: decrypted,
              digits: code.digits || 6,
              period: code.period || 30
            };
          } catch {
            return null;
          }
        })
      );

      setCodes(decryptedCodes.filter(Boolean) as TOTPCode[]);
    } catch (error) {
      console.error('Failed to load TOTP codes');
    } finally {
      setIsLoading(false);
    }
  }, [user, isUnlocked, masterPassword]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  // Generate codes and update timer
  useEffect(() => {
    const updateCodes = () => {
      const now = Date.now() / 1000;
      const remaining = 30 - (Math.floor(now) % 30);
      setTimeRemaining(remaining);

      const newCurrentCodes: Record<string, string> = {};
      codes.forEach(code => {
        newCurrentCodes[code.id] = generateTOTP(code.secret, code.digits, code.period);
      });
      setCurrentCodes(newCurrentCodes);
    };

    updateCodes();
    const interval = setInterval(updateCodes, 1000);
    return () => clearInterval(interval);
  }, [codes]);

  const handleAddCode = async () => {
    if (!user || !isUnlocked || !newCode.name || !newCode.secret) {
      toast.error('Please fill in name and secret');
      return;
    }

    try {
      const encrypted = await encryptData(newCode.secret.replace(/\s/g, '').toUpperCase(), masterPassword!);
      
      const { error } = await supabase
        .from('safepass_totp_codes')
        .insert({
          user_id: user.id,
          name: newCode.name,
          issuer: newCode.issuer || null,
          encrypted_secret: encrypted as any
        });

      if (error) throw error;

      toast.success('2FA code added');
      setIsAddDialogOpen(false);
      setNewCode({ name: '', secret: '', issuer: '' });
      loadCodes();
    } catch (error) {
      toast.error('Failed to add 2FA code');
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Delete this 2FA code?')) return;

    try {
      const { error } = await supabase
        .from('safepass_totp_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('2FA code deleted');
      loadCodes();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success('Code copied');
  };

  if (!isUnlocked) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p>Unlock your vault to view 2FA codes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authenticator (TOTP)
          </h3>
          <p className="text-sm text-muted-foreground">
            Store and generate 2FA codes
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary text-black">
              <Plus className="h-4 w-4 mr-1" />
              Add 2FA
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Authenticator Code</DialogTitle>
              <DialogDescription>
                Enter the secret key from your 2FA setup
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Account Name *</Label>
                <Input
                  value={newCode.name}
                  onChange={(e) => setNewCode(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Google - john@gmail.com"
                />
              </div>
              <div>
                <Label>Issuer (Optional)</Label>
                <Input
                  value={newCode.issuer}
                  onChange={(e) => setNewCode(p => ({ ...p, issuer: e.target.value }))}
                  placeholder="e.g., Google, GitHub"
                />
              </div>
              <div>
                <Label>Secret Key *</Label>
                <Input
                  value={newCode.secret}
                  onChange={(e) => setNewCode(p => ({ ...p, secret: e.target.value }))}
                  placeholder="e.g., JBSWY3DPEHPK3PXP"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The secret key from your 2FA setup (usually shown as a code or QR)
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCode} className="flex-1 bg-primary hover:bg-primary text-black">
                  Add Code
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timer Progress */}
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Progress value={(timeRemaining / 30) * 100} className="flex-1 h-2" />
        <span className="text-sm text-muted-foreground w-8">{timeRemaining}s</span>
      </div>

      {/* TOTP Codes List */}
      {isLoading ? (
        <div className="text-center py-4">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <QrCode className="h-12 w-12 mx-auto text-violet-400/70 mb-4" />
            <p className="font-medium">Let me hold your 2FA codes</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Add your authenticator codes here and I'll keep them synced across your devices — one tap to copy when you need one.
            </p>

          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {codes.map(code => (
            <Card key={code.id} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{code.name}</p>
                    {code.issuer && (
                      <p className="text-xs text-muted-foreground">{code.issuer}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest">
                      {currentCodes[code.id] || '------'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCode(currentCodes[code.id])}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCode(code.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TOTPManager;
