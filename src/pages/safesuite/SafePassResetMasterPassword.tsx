import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Lock, Eye, EyeOff, CheckCircle, Shield, Smartphone } from 'lucide-react';
import safepassLogo from '@/assets/safepass-logo.png';
import heroSafepassBg from '@/assets/hero-safepass-bg.jpg';

export default function VaultResetMasterPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'email' | 'mfa' | 'verify' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  // If token is present, verify it
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-reset-master-password', {
        body: { action: 'verify', token }
      });

      if (error || !data?.valid) {
        toast({
          title: "Invalid Link",
          description: data?.error || "This reset link is invalid or has expired.",
          variant: "destructive",
        });
        setStep('email');
      } else {
        setTokenValid(true);
        setStep('reset');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify reset link.",
        variant: "destructive",
      });
      setStep('email');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckEmail = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-reset-master-password', {
        body: { action: 'check_mfa', email }
      });

      if (error) throw error;

      setMfaEnabled(data.mfaEnabled);
      
      if (!data.mfaEnabled) {
        toast({
          title: "MFA Required",
          description: "You must have MFA enabled to reset your master password. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      setStep('mfa');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!email || !mfaCode || mfaCode.length !== 6) {
      toast({ title: "MFA Code Required", description: "Please enter your 6-digit MFA code.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-reset-master-password', {
        body: { action: 'request', email, mfaCode }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Check your email",
        description: "Reset link sent. Check your inbox.",
      });
      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid MFA code or failed to send reset email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 12) {
      toast({ title: "Password too short", description: "Master password must be at least 12 characters.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please ensure both passwords match.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-reset-master-password', {
        body: { action: 'reset', token, newPassword }
      });

      if (error) throw error;

      setStep('success');
      toast({
        title: "Password Reset Complete",
        description: "Your master password has been reset. Your vault is now empty.",
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to reset master password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${heroSafepassBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/70" />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-black rounded-xl shadow-amber-500/20 shadow-lg">
            <img src={safepassLogo} alt="Vault" className="h-12 w-auto" />
          </div>
          <CardTitle>Reset Master Password</CardTitle>
          <CardDescription>
            {step === 'email' && "Enter your email to start the reset process"}
            {step === 'mfa' && "Enter your MFA code to verify your identity"}
            {step === 'verify' && "Check your email for the reset link"}
            {step === 'reset' && "Create a new master password"}
            {step === 'success' && "Your password has been reset"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email Step */}
          {step === 'email' && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: Data Loss</AlertTitle>
                <AlertDescription>
                  Resetting your master password will permanently delete all encrypted vault data. This cannot be undone.
                </AlertDescription>
              </Alert>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>MFA Required</AlertTitle>
                <AlertDescription>
                  For security, you must verify with your authenticator app to reset your master password.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckEmail()}
                />
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                onClick={handleCheckEmail}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/pass')}
              >
                Back to Vault
              </Button>
            </>
          )}

          {/* MFA Verification Step */}
          {step === 'mfa' && (
            <>
              <div className="text-center py-4">
                <Smartphone className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Open your authenticator app and enter the 6-digit code for <strong>UltriumGPT</strong>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={mfaCode}
                  onChange={(value) => setMfaCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                onClick={handleRequestReset}
                disabled={loading || mfaCode.length !== 6}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                Verify & Send Reset Email
              </Button>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => { setStep('email'); setMfaCode(''); }}
              >
                Use Different Email
              </Button>
            </>
          )}

          {/* Email Sent Step */}
          {step === 'verify' && (
            <>
              <div className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">MFA Verified</span>
                </div>
                <p className="text-muted-foreground">
                  We've sent a reset link to <strong>{email}</strong>. Check your inbox and click the link to continue.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => { setStep('email'); setMfaCode(''); }}
              >
                Use Different Email
              </Button>
            </>
          )}

          {/* Reset Password Step */}
          {step === 'reset' && tokenValid && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Final Warning</AlertTitle>
                <AlertDescription>
                  Proceeding will permanently delete all your saved passwords, cards, notes, and identities.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Master Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 12 characters"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>

              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={handleResetPassword}
                disabled={loading || newPassword.length < 12 || newPassword !== confirmPassword}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password & Delete Vault Data
              </Button>
            </>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Your master password has been reset. You can now log in to Vault with your new password.
                </p>
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={() => navigate('/pass')}
              >
                Go to Vault
              </Button>
            </>
          )}

          {/* Loading State */}
          {loading && step === 'reset' && !tokenValid && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
              <p className="text-muted-foreground mt-2">Verifying reset link...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}