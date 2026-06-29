/**
 * MFA Onboarding Gate - Forces new users to enable MFA before using Wrayth
 * This wraps the entire Wrayth layout to ensure mandatory MFA for all users
 */

import { useState, useEffect } from 'react';
import { useMFAStatus } from '@/hooks/useMFAStatus';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useSecurity } from '@/hooks/useSecurity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  Smartphone, 
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Copy,
  QrCode,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';

// Product logos
import safesuiteLogo from '@/assets/safesuite-logo.png';

interface MFAOnboardingGateProps {
  children: React.ReactNode;
}

type SetupStep = 'intro' | 'qr' | 'verify' | 'backup' | 'complete';

const SETUP_BENEFITS = [
  "Military-grade protection for your passwords and data",
  "Required for master password recovery",
  "Prevents unauthorized access even if your password is leaked",
  "Industry-standard security used by banks and enterprises"
];

export function MFAOnboardingGate({ children }: MFAOnboardingGateProps) {
  const { user } = useAuth();
  const { loading, hasMFA, refetch } = useMFAStatus();
  const { setupTwoFactor, enableTwoFactor } = useSecurity();
  
  const [step, setStep] = useState<SetupStep>('intro');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Check if user is new (created within last hour and hasn't dismissed)
  const [isNewUser, setIsNewUser] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Check if user was created recently (within 1 hour) OR has never dismissed the prompt
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const hoursSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);
    
    // Consider new if created within last hour
    const isRecentlyCreated = hoursSinceSignup < 1;
    
    // Check if user has dismissed the MFA prompt before
    const hasDismissed = localStorage.getItem(`mfa_onboarding_dismissed_${user.id}`);
    
    setIsNewUser(isRecentlyCreated);
    setDismissed(!!hasDismissed);
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Wrayth...</p>
        </div>
      </div>
    );
  }

  // MFA is already enabled - render app normally
  if (hasMFA) {
    return <>{children}</>;
  }

  // User has dismissed onboarding before - allow access but show enforcement on sensitive pages
  if (dismissed && !isNewUser) {
    return <>{children}</>;
  }

  const handleStartSetup = async () => {
    setIsSettingUp(true);
    setError(null);
    
    try {
      const result = await setupTwoFactor();
      if (result) {
        setSecret(result.secret);
        setBackupCodes(result.backup_codes || []);
        
        // Generate QR code
        if (result.qr_code) {
          const dataUrl = await QRCode.toDataURL(result.qr_code, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          setQrCodeUrl(dataUrl);
        }
        
        setStep('qr');
      } else {
        setError('Failed to initialize 2FA setup. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA setup');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const success = await enableTwoFactor(verificationCode);
      if (success) {
        setStep('backup');
      } else {
        setError('Invalid code. Please check your authenticator app and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleComplete = async () => {
    await refetch();
    setStep('complete');
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`mfa_onboarding_dismissed_${user.id}`, 'true');
    }
    setDismissed(true);
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-amber-500/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          {/* Step 1: Introduction */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card className="border-amber-500/30 overflow-hidden">
                {/* Header with logo */}
                <div className="relative h-40 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.2),transparent_70%)]" />
                  <img src={safesuiteLogo} alt="Wrayth" className="h-12 relative z-10 mb-4" />
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="relative"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                </div>

                <CardHeader className="text-center pb-2">
                  <Badge variant="outline" className="mx-auto mb-3 border-amber-500/50 text-amber-500">
                    <Sparkles className="h-3 w-3 mr-1" />
                    One-Time Setup
                  </Badge>
                  <CardTitle className="text-xl md:text-2xl">
                    Secure Your Account with 2FA
                  </CardTitle>
                  <CardDescription className="text-base">
                    Wrayth requires two-factor authentication to protect your sensitive data.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Benefits */}
                  <div className="space-y-3">
                    {SETUP_BENEFITS.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <Button 
                      size="lg"
                      onClick={handleStartSetup}
                      disabled={isSettingUp}
                      className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                    >
                      {isSettingUp ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-5 w-5" />
                      )}
                      {isSettingUp ? 'Preparing...' : 'Set Up 2FA Now'}
                      {!isSettingUp && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    {/* Skip option for existing users */}
                    {!isNewUser && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleDismiss}
                        className="w-full text-muted-foreground"
                      >
                        Set up later in Settings
                      </Button>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: QR Code */}
          {step === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-amber-500/30">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <QrCode className="h-7 w-7 text-amber-500" />
                  </div>
                  <CardTitle>Scan QR Code</CardTitle>
                  <CardDescription>
                    Open your authenticator app and scan this QR code
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* QR Code */}
                  {qrCodeUrl && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-xl">
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}

                  {/* Manual entry */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                      Or enter this code manually:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono text-center break-all">
                        {secret}
                      </code>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(secret, 'secret')}
                      >
                        {copiedSecret ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setStep('verify')}
                    className="w-full gap-2"
                  >
                    I've Scanned the Code
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Verify */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-amber-500/30">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Smartphone className="h-7 w-7 text-amber-500" />
                  </div>
                  <CardTitle>Verify Setup</CardTitle>
                  <CardDescription>
                    Enter the 6-digit code from your authenticator app
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                      maxLength={6}
                    />

                    {error && (
                      <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleVerify}
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    {isVerifying ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                    {isVerifying ? 'Verifying...' : 'Verify & Enable 2FA'}
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={() => setStep('qr')}
                    className="w-full"
                  >
                    ← Back to QR Code
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Backup Codes */}
          {step === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="border-green-500/30 bg-gradient-to-b from-green-500/5 to-transparent">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                  </div>
                  <CardTitle>Save Your Backup Codes</CardTitle>
                  <CardDescription>
                    Store these codes safely. You can use them if you lose access to your authenticator.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Backup codes grid */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="text-sm font-mono text-center py-1 bg-background rounded">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                    className="w-full gap-2"
                  >
                    {copiedBackupCodes ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedBackupCodes ? 'Copied!' : 'Copy All Codes'}
                  </Button>

                  <div className="flex items-start gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Each backup code can only be used once. Store them in a secure location.</span>
                  </div>

                  <Button 
                    onClick={handleComplete}
                    className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    I've Saved My Codes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-green-500/30 bg-gradient-to-b from-green-500/5 to-transparent">
                <CardContent className="pt-8 pb-8 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                  >
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </motion.div>

                  <div>
                    <h2 className="text-2xl font-bold text-green-500 mb-2">You're All Set!</h2>
                    <p className="text-muted-foreground">
                      Two-factor authentication is now enabled. Your Wrayth account is protected.
                    </p>
                  </div>

                  <img src={safesuiteLogo} alt="Wrayth" className="h-10 mx-auto opacity-60" />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
