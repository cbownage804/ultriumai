import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import safepassLogo from '@/assets/safepass-logo.png';

export default function SafePassResetMasterPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
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
        setStep('request');
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
      setStep('request');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safepass-reset-master-password', {
        body: { action: 'request', email }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "If an account exists, a reset link has been sent.",
      });
      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email.",
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-black rounded-xl shadow-amber-500/20 shadow-lg">
            <img src={safepassLogo} alt="SafePass" className="h-12 w-auto" />
          </div>
          <CardTitle>Reset Master Password</CardTitle>
          <CardDescription>
            {step === 'request' && "Enter your email to receive a reset link"}
            {step === 'verify' && "Check your email for the reset link"}
            {step === 'reset' && "Create a new master password"}
            {step === 'success' && "Your password has been reset"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'request' && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: Data Loss</AlertTitle>
                <AlertDescription>
                  Resetting your master password will permanently delete all encrypted vault data. This cannot be undone.
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
                  onKeyDown={(e) => e.key === 'Enter' && handleRequestReset()}
                />
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600" 
                onClick={handleRequestReset}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/pass')}
              >
                Back to SafePass
              </Button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center py-8">
                <Lock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <p className="text-muted-foreground">
                  We've sent a reset link to <strong>{email}</strong>. Check your inbox and click the link to continue.
                </p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setStep('request')}
              >
                Use Different Email
              </Button>
            </>
          )}

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

          {step === 'success' && (
            <>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Your master password has been reset. You can now log in to SafePass with your new password.
                </p>
              </div>

              <Button 
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={() => navigate('/pass')}
              >
                Go to SafePass
              </Button>
            </>
          )}

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
