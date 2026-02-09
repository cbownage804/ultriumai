import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, CheckCircle2, AlertTriangle, Lock, RefreshCw, Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  category: string;
  lastRotated: string;
}

export function SelfServicePasswordReset() {
  const [selectedEntry, setSelectedEntry] = useState<PasswordEntry | null>(null);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [entries] = useState<PasswordEntry[]>([
    { id: '1', name: 'Email Account', username: 'user@company.com', category: 'Email', lastRotated: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: '2', name: 'VPN Access', username: 'vpn-user', category: 'Network', lastRotated: new Date(Date.now() - 86400000 * 60).toISOString() },
    { id: '3', name: 'WiFi Network', username: 'N/A', category: 'Network', lastRotated: new Date(Date.now() - 86400000 * 90).toISOString() },
  ]);

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

    setIsResetting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setIsResetting(false);
    setShowChangeDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSelectedEntry(null);
    toast.success('Password reset submitted. Your IT admin will process this shortly.');
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password Management
        </h2>
        <p className="text-sm text-muted-foreground">Request password resets for your managed accounts</p>
      </div>

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
