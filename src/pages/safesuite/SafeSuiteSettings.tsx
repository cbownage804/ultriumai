/**
 * Wrayth Settings Page
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWraythSubscription } from '@/hooks/useSafeSuite';
import { useSecurity } from '@/hooks/useSecurity';
import { useWraythSettings } from '@/hooks/useSafeSuiteSettings';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  User,
  Shield,
  Bell,
  Download,
  Trash2,
  Loader2,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { PageMotion } from '@/components/ray/PageMotion';
import { ExplainThis } from '@/components/ray/ExplainThis';

export default function WraythSettings() {
  const { user } = useAuth();
  const { tier } = useWraythSubscription();
  const { securitySettings, setupTwoFactor, enableTwoFactor, disableTwoFactor, loading: securityLoading } = useSecurity();
  const { settings, saving, saveSettings, updateNotifications } = useWraythSettings();
  
  // 2FA Setup state
  const [twoFactorDialog, setTwoFactorDialog] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ qr_code?: string; secret?: string; backup_codes?: string[] } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [setupStep, setSetupStep] = useState<'setup' | 'verify'>('setup');

  const userInitials = user?.email
    ?.split('@')[0]
    .slice(0, 2)
    .toUpperCase() || 'U';

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveSettings = async () => {
    await saveSettings(settings);
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast.error('No email on file for this account.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(`Password reset link sent to ${user.email}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start password reset.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('safesuite-user-management', {
        body: { action: 'delete_self' },
      });
      if (error) throw error;
      toast.success('Account deletion requested. You will be signed out shortly.');
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete account. Contact support.');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  const handleExportData = async () => {
    toast.info('Preparing your data export...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to export your data');
        return;
      }

      const response = await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safesuite-data-export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const exportData = await response.json();
      
      // Create and download the file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `safesuite-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  const handleSetup2FA = async () => {
    setTwoFactorDialog(true);
    setSetupStep('setup');
    setVerificationCode('');
    setQrCodeDataUrl(null);
    
    const result = await setupTwoFactor();
    if (result) {
      setTwoFactorSetup(result);
      // Generate QR code image from the otpauth URL
      if (result.qr_code) {
        try {
          const dataUrl = await QRCode.toDataURL(result.qr_code, {
            width: 200,
            margin: 2,
          });
          setQrCodeDataUrl(dataUrl);
        } catch (err) {
          console.error('Failed to generate QR code:', err);
        }
      }
      setSetupStep('verify');
    } else {
      setTwoFactorDialog(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }
    
    const success = await enableTwoFactor(verificationCode);
    if (success) {
      setTwoFactorDialog(false);
      setTwoFactorSetup(null);
      setVerificationCode('');
    }
  };

  const handleDisable2FA = async () => {
    // For disabling, we'd normally require the current TOTP code
    // For simplicity, showing a confirmation
    const code = prompt('Enter your current 2FA code to disable:');
    if (code) {
      await disableTwoFactor(code);
    }
  };

  const is2FAEnabled = securitySettings?.two_factor_enabled;

  return (
    <PageMotion className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Ray's account briefing */}
      <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="flex-1">Ray says</span>
            <ExplainThis
              title="What Ray checks on this page"
              bullets={[
                'Whether two-factor authentication is protecting your login.',
                'Whether the notifications Ray needs to reach you are enabled.',
                'Whether your plan matches how much of Ray you are actually using.',
              ]}
            />
          </div>
          <CardTitle className="text-lg font-light mt-1">
            {securitySettings?.two_factor_enabled
              ? "Everything looks good."
              : "Your account is almost fully protected."}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{tier === 'free' ? 'Free plan' : `${tier[0].toUpperCase()}${tier.slice(1)} plan active`}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Notifications {settings?.notifications?.breachAlerts !== false ? 'enabled' : 'configured'}</span>
            </li>
            <li className="flex items-center gap-2">
              {securitySettings?.two_factor_enabled ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>Two-factor authentication enabled</span>
                </>
              ) : (
                <>
                  <span className="h-4 w-4 flex items-center justify-center text-yellow-400 text-lg leading-none">✗</span>
                  <span className="text-muted-foreground">Two-factor authentication</span>
                </>
              )}
            </li>
          </ul>
          {!securitySettings?.two_factor_enabled && (
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recommended next step</div>
                <div className="text-sm mt-0.5">Enable 2FA · <span className="text-muted-foreground">about 45 seconds</span></div>
              </div>
              <Button size="sm" variant="outline" className="border-violet-500/40 text-violet-200 hover:bg-violet-500/10" onClick={() => setTwoFactorDialog(true)}>
                Set up
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>
            Your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>
            Protect your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {is2FAEnabled && <ShieldCheck className="h-5 w-5 text-green-500" />}
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled 
                    ? 'Your account is protected with 2FA' 
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
            </div>
            {is2FAEnabled ? (
              <Button variant="outline" onClick={handleDisable2FA} disabled={securityLoading}>
                {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable 2FA'}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleSetup2FA} disabled={securityLoading}>
                {securityLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable 2FA'}
              </Button>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">
                Update your password regularly
              </p>
            </div>
            <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Change'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what alerts you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Breach Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when your data appears in a breach
              </p>
            </div>
            <Switch
              checked={settings.notifications.breachAlerts}
              onCheckedChange={(checked) => updateNotifications('breachAlerts', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Security Report</p>
              <p className="text-sm text-muted-foreground">
                Receive a summary of your security status
              </p>
            </div>
            <Switch
              checked={settings.notifications.weeklyReport}
              onCheckedChange={(checked) => updateNotifications('weeklyReport', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Product Updates</p>
              <p className="text-sm text-muted-foreground">
                Learn about new features and improvements
              </p>
            </div>
            <Switch
              checked={settings.notifications.productUpdates}
              onCheckedChange={(checked) => updateNotifications('productUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Manage your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your Wrayth data
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={twoFactorDialog} onOpenChange={setTwoFactorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {setupStep === 'setup' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {setupStep === 'verify' && twoFactorSetup && (
              <>
                {qrCodeDataUrl && (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="2FA QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                )}
                
                {twoFactorSetup.secret && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Or enter this code manually:
                    </Label>
                    <code className="block p-2 bg-muted rounded text-center font-mono text-sm break-all">
                      {twoFactorSetup.secret}
                    </code>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Verification Code</Label>
                  <Input
                    id="verify-code"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerify2FA} 
                    disabled={verificationCode.length !== 6 || securityLoading}
                    className="flex-1"
                  >
                    {securityLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Verify & Enable
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTwoFactorDialog(false);
                      setTwoFactorSetup(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onOpenChange={(o) => { setDeleteDialog(o); if (!o) setDeleteConfirm(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This permanently deletes your Wrayth account, vault entries, and history. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="delete-confirm">Type <span className="font-mono">DELETE</span> to confirm</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              autoComplete="off"
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleting}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting || deleteConfirm.trim().toUpperCase() !== 'DELETE'}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete my account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageMotion>
  );
}
