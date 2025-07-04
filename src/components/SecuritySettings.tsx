import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Clock, 
  Activity, 
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { useSecurity } from "@/hooks/useSecurity";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

const SecuritySettings = () => {
  const { 
    securitySettings, 
    auditLogs, 
    loading,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    updateSecuritySettings
  } = useSecurity();

  const { toast } = useToast();
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<any>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState('');

  useEffect(() => {
    if (securitySettings?.ip_whitelist) {
      setIpWhitelist(securitySettings.ip_whitelist.join('\n'));
    }
  }, [securitySettings]);

  const handleSetupTwoFactor = async () => {
    const data = await setupTwoFactor();
    if (data) {
      setTwoFactorData(data);
      setShowTwoFactorSetup(true);
      
      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(data.qr_code);
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!verificationToken) {
      toast({
        title: "Token Required",
        description: "Please enter the 6-digit code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    const success = await enableTwoFactor(verificationToken);
    if (success) {
      setShowTwoFactorSetup(false);
      setVerificationToken('');
      setTwoFactorData(null);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!verificationToken) {
      toast({
        title: "Token Required",
        description: "Please enter a 6-digit code to disable 2FA.",
        variant: "destructive",
      });
      return;
    }

    const success = await disableTwoFactor(verificationToken);
    if (success) {
      setVerificationToken('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Text copied to clipboard.",
    });
  };

  const handleUpdateIpWhitelist = async () => {
    const ips = ipWhitelist.split('\n').filter(ip => ip.trim()).map(ip => ip.trim());
    await updateSecuritySettings({ ip_whitelist: ips });
  };

  const formatAuditLogAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && !securitySettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {securitySettings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <Badge variant={securitySettings?.two_factor_enabled ? 'default' : 'secondary'}>
              {securitySettings?.two_factor_enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          {!securitySettings?.two_factor_enabled ? (
            <Button onClick={handleSetupTwoFactor} disabled={loading}>
              <Shield className="h-4 w-4 mr-2" />
              Enable Two-Factor Authentication
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Disable Two-Factor Authentication
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                  <DialogDescription>
                    Enter a 6-digit code from your authenticator app to disable 2FA.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="disable-token">Verification Code</Label>
                    <Input
                      id="disable-token"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setVerificationToken('')}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDisableTwoFactor} disabled={loading}>
                    Disable 2FA
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {/* Session & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Session & Security</CardTitle>
          </div>
          <CardDescription>
            Configure session timeout and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Login Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified of new login attempts
              </p>
            </div>
            <Switch
              checked={securitySettings?.login_notifications || false}
              onCheckedChange={(checked) => updateSecuritySettings({ login_notifications: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={securitySettings?.session_timeout_minutes || 60}
              onChange={(e) => updateSecuritySettings({ session_timeout_minutes: parseInt(e.target.value) || 60 })}
              min={5}
              max={1440}
            />
          </div>
        </CardContent>
      </Card>

      {/* IP Whitelist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>IP Whitelist</CardTitle>
          </div>
          <CardDescription>
            Restrict access to your account from specific IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip-whitelist">Allowed IP Addresses (one per line)</Label>
            <textarea
              id="ip-whitelist"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={ipWhitelist}
              onChange={(e) => setIpWhitelist(e.target.value)}
              placeholder="192.168.1.1&#10;10.0.0.1"
            />
          </div>
          <Button onClick={handleUpdateIpWhitelist} disabled={loading}>
            Update IP Whitelist
          </Button>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Security Activity</CardTitle>
          </div>
          <CardDescription>
            Recent security events and account activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events recorded</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatAuditLogAction(log.action)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                      {log.ip_address && ` • ${log.ip_address}`}
                    </p>
                  </div>
                  <Badge variant="outline">{log.resource_type || 'Security'}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Setup Dialog */}
      <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code
            </DialogDescription>
          </DialogHeader>
          
          {twoFactorData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="2FA QR Code" className="border rounded" />
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 border rounded bg-muted">
                    <QrCode className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Can't scan? Enter this code manually:</Label>
                <div className="flex items-center gap-2">
                  <Input value={twoFactorData.secret} readOnly className="font-mono text-xs" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(twoFactorData.secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Verification */}
              <div className="space-y-2">
                <Label htmlFor="verification-code">Enter 6-digit code from your app:</Label>
                <Input
                  id="verification-code"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {/* Backup Codes */}
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Save your backup codes in a safe place</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBackupCodes(!showBackupCodes)}
                    >
                      {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {showBackupCodes && (
                    <div className="mt-2 space-y-1">
                      {twoFactorData.backup_codes.map((code: string, index: number) => (
                        <div key={index} className="font-mono text-xs bg-muted p-1 rounded">
                          {code}
                        </div>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnableTwoFactor} disabled={loading || !verificationToken}>
              <Check className="h-4 w-4 mr-2" />
              Enable 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecuritySettings;