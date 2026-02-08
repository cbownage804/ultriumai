import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Building2 } from 'lucide-react';

type InviteStatus = 'loading' | 'valid' | 'expired' | 'error' | 'accepted';
type AuthMode = 'signin' | 'signup';

const OrgAcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const token = searchParams.get('token');
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invite, setInvite] = useState<any>(null);
  const [orgName, setOrgName] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    validateToken();
  }, [token]);

  // If user becomes authenticated, try to accept
  useEffect(() => {
    if (user && invite && status === 'valid') {
      acceptInvite();
    }
  }, [user, invite, status]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('org_team_members')
        .select('id, email, organization_id, status, token_expires_at, role')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        setStatus('error');
        return;
      }

      if (data.status !== 'pending') {
        setStatus('accepted');
        return;
      }

      if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      setInvite(data);
      setEmail(data.email);

      // Fetch org name
      const { data: org } = await supabase
        .from('org_teams')
        .select('name')
        .eq('id', data.organization_id)
        .single();

      setOrgName(org?.name || 'the organization');
      setStatus('valid');
    } catch {
      setStatus('error');
    }
  };

  const acceptInvite = async () => {
    if (!user || !invite) return;

    setSubmitting(true);
    try {
      // Update the member row: set user_id, status to active, clear token
      const { error } = await supabase
        .from('org_team_members')
        .update({
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString(),
          invite_token: null,
          token_expires_at: null,
        })
        .eq('id', invite.id);

      if (error) throw error;

      setStatus('accepted');
      toast({ title: 'Welcome!', description: `You've joined ${orgName}.` });

      // Redirect to org page after short delay
      setTimeout(() => navigate('/organization'), 2000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/org/accept-invite?token=${token}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast({
          title: 'Check your email',
          description: 'Click the confirmation link to activate your account, then come back here.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // acceptInvite will be triggered by the useEffect above
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or has already been used.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth')}>Go to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>This invitation has expired. Please ask your admin to send a new one.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <CardTitle>You're In!</CardTitle>
            <CardDescription>You've successfully joined {orgName}. Redirecting to your organization…</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/organization')}>Go to Organization</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Status === 'valid' — show auth form if not logged in
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
            <CardTitle>Join {orgName}</CardTitle>
            <CardDescription>Accepting invitation as {user.email}…</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
          <CardTitle>Join {orgName}</CardTitle>
          <CardDescription>
            {authMode === 'signup'
              ? 'Create an account to accept your invitation.'
              : 'Sign in to accept your invitation.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={authMode === 'signup' ? 'Create a password' : 'Enter your password'}
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {authMode === 'signup' ? 'Create Account & Join' : 'Sign In & Join'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {authMode === 'signup' ? (
                <>Already have an account?{' '}
                  <button type="button" className="text-primary underline" onClick={() => setAuthMode('signin')}>
                    Sign in
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button type="button" className="text-primary underline" onClick={() => setAuthMode('signup')}>
                    Create one
                  </button>
                </>
              )}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrgAcceptInvite;
