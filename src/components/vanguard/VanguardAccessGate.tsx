import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface VanguardAccessGateProps {
  children: ReactNode;
}

/**
 * VanguardAccessGate - Access control for Vanguard platform
 * 
 * Currently allows all authenticated users access for development/testing.
 * In production, this can be restricted to specific organizations or email domains.
 */
export function VanguardAccessGate({ children }: VanguardAccessGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-white/60">Verifying Vanguard access...</p>
        </div>
      </div>
    );
  }

  // Allow all authenticated users (can be restricted to specific domains in production)
  const hasAccess = !!user;

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-cyan-400" />
            </div>
            <CardTitle className="text-xl text-white">
              Sign In Required
            </CardTitle>
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
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" 
                asChild
              >
                <Link to="/vanguard/auth">
                  <Lock className="mr-2 h-4 w-4" />
                  Sign In to Vanguard
                </Link>
              </Button>
              <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                <Link to="/">
                  Return to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
