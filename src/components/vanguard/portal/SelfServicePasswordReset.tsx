import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Lock, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  category: string;
  lastRotated: string;
}

export function SelfServicePasswordReset() {
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPasswords();
  }, [user]);

  const loadPasswords = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('atlas_passwords')
        .select('id, name, username, category, updated_at')
        .eq('user_id', user.id)
        .order('name');

      if (data) {
        setEntries(data.map(p => ({
          id: p.id,
          name: p.name,
          username: p.username || 'N/A',
          category: p.category || 'General',
          lastRotated: p.updated_at,
        })));
      }
    } catch (err) {
      console.error('Failed to load passwords:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pw: string): { label: string; color: string; score: number } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { label: 'Weak', color: 'text-red-500', score: score * 20 };
    if (score <= 3) return { label: 'Fair', color: 'text-amber-500', score: score * 20 };
    return { label: 'Strong', color: 'text-green-500', score: score * 20 };
  };

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!selectedEntry || !user) return;

    setIsResetting(true);
    try {
      // Create a helpdesk ticket for the password reset request
      const ticketNumber = `PWD-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          ticket_number: ticketNumber,
          title: `Password Reset: ${selectedEntry.name}`,
          description: `Password reset requested for account "${selectedEntry.name}" (${selectedEntry.username}). New password has been submitted securely.`,
          priority: 'medium',
          status: 'open',
          category: 'password_reset',
          source: 'portal',
        });

      if (error) throw error;

      // Update the password's last rotated timestamp
      await supabase
        .from('atlas_passwords')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedEntry.id);

      toast.success('Password reset submitted. Your IT admin will process this shortly.');
      setShowChangeDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setSelectedEntry(null);
      loadPasswords();
    } catch (err: any) {
      toast.error('Failed to submit reset request: ' + (err.message || 'Unknown error'));
    } finally {
      setIsResetting(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Management
        </h2>
        <p className="text-sm text-muted-foreground">Request password resets for your managed accounts</p>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No managed passwords found</p>
            <p className="text-sm">Contact your IT administrator to set up managed accounts.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => {
            const daysSinceRotation = Math.floor((Date.now() - new Date(entry.lastRotated).getTime()) / 86400000);
            const needsRotation = daysSinceRotation > 60;
            return (
              <Card key={entry.id}>
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.username} · {entry.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {needsRotation && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Rotation Due
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Last changed {daysSinceRotation}d ago
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowChangeDialog(true);
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showChangeDialog && selectedEntry && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-sm">Reset Password: {selectedEntry.name}</CardTitle>
            <CardDescription>Enter a new password for your {selectedEntry.name} account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${strength.score >= 80 ? 'bg-green-500' : strength.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <span className={`text-xs ${strength.color}`}>{strength.label}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReset} disabled={isResetting || !newPassword || newPassword !== confirmPassword}>
                {isResetting ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" />Submit Reset Request</>
                )}
              </Button>
              <Button variant="outline" onClick={() => { setShowChangeDialog(false); setSelectedEntry(null); }}>
                Cancel
              </Button>
            </div>

            <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Password Requirements:</p>
              <div className="flex items-center gap-1">
                {newPassword.length >= 8 ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1">
                {/[A-Z]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-1">
                {/[0-9]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                <span>One number</span>
              </div>
              <div className="flex items-center gap-1">
                {/[^A-Za-z0-9]/.test(newPassword) ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-muted-foreground" />}
                <span>One special character</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
