import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVanguardSub } from '@/contexts/VanguardSubscriptionContext';
import { Loader2, Shield, Lock, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation } from 'react-router-dom';

interface VanguardAccessGateProps {
  children: ReactNode;
}

export function VanguardAccessGate({ children }: VanguardAccessGateProps) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-white/60">Verifying Vanguard access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-xl text-white">Sign In Required</CardTitle>
            <CardDescription className="text-white/60">
              Sign in to access <span className="text-cyan-400">Vanguard</span> security platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">Enterprise Security Platform</p>
                  <p>Vanguard provides comprehensive MSP and enterprise security operations capabilities.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" asChild>
                <Link to="/auth" state={{ from: location }}>
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In to Vanguard
                </Link>
              </Button>
              <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                <Link to="/hub">Return to Product Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <VanguardSubscriptionGate>{children}</VanguardSubscriptionGate>;
}

/** Inner gate that checks subscription/trial status (must be inside VanguardSubscriptionProvider) */
function VanguardSubscriptionGate({ children }: { children: ReactNode }) {
  const { subscribed, loading, trialEnded } = useVanguardSub();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-white/60">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Trial expired and no active subscription
  if (!subscribed && trialEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-xl text-white">Trial Expired</CardTitle>
            <CardDescription className="text-white/60">
              Your 14-day Vanguard trial has ended. Subscribe to continue using the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">Continue with Vanguard</p>
                  <p>Choose a plan that fits your needs — IT Department or MSP plans available.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" asChild>
                <Link to="/vanguard/pricing">
                  View Plans & Pricing
                </Link>
              </Button>
              <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                <Link to="/hub">Return to Product Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not subscribed and no trial yet (edge case — trial should auto-provision)
  if (!subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-white/60">Setting up your trial...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
