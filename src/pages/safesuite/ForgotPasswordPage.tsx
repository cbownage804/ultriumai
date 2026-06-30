/**
 * Forgot Password Page
 * Self-service password reset request
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      // Send branded password reset email via our edge function
      const { error: emailError } = await supabase.functions.invoke('send-auth-email', {
        body: {
          type: 'password_reset',
          email: email,
          redirectUrl: `${window.location.origin}/auth/reset-password`,
        },
      });

      if (emailError) {
        // Fallback to Supabase default if our function fails
        console.error('Branded email failed, falling back:', emailError);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccess(true);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/app" className="inline-flex items-center gap-2">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Shield className="h-7 w-7 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
            <p className="text-muted-foreground">Enter your email to receive a reset link</p>
          </div>

          <Card>
            {success ? (
              <>
                <CardHeader>
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  <CardTitle className="text-center">Check Your Email</CardTitle>
                  <CardDescription className="text-center">
                    We've sent a password reset link to <strong>{email}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click the link in the email to reset your password. 
                    If you don't see it, check your spam folder.
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => { setSuccess(false); setEmail(''); }}
                  >
                    Try a different email
                  </Button>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                    Return to Sign In
                  </Link>
                </CardFooter>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Forgot your password?</CardTitle>
                  <CardDescription>
                    No problem! Enter your email and we'll send you a link to reset it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
                    Remember your password? Sign in
                  </Link>
                </CardFooter>
              </form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
