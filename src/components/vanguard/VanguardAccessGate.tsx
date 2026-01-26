import { ReactNode } from 'react';
import { useProductAccess } from '@/hooks/useProductAccess';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface VanguardAccessGateProps {
  children: ReactNode;
}

/**
 * VanguardAccessGate - Enforces admin-approved access to Vanguard
 * 
 * Vanguard requires manual approval - users cannot self-register.
 * Only users with explicit Vanguard access in user_product_access table can enter.
 * This is different from SafeSuite which has a free tier.
 */
export function VanguardAccessGate({ children }: VanguardAccessGateProps) {
  const { user } = useAuth();
  const { access, loading, hasAccess } = useProductAccess();

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

  // Check if user has ANY Vanguard access (must be explicitly granted by admin)
  const vanguardAccess = access.find(a => a.product === 'vanguard');
  const hasVanguardAccess = vanguardAccess && hasAccess('vanguard', 'free');

  if (!hasVanguardAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-xl text-white">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-white/60">
              <span className="text-cyan-400">Vanguard</span> requires administrator approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">Enterprise Security Platform</p>
                  <p>Vanguard is designed for MSPs and enterprise security teams. Access is granted on a case-by-case basis after verification.</p>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-white/50">
              Logged in as: <span className="text-white/70">{user?.email}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600" 
                asChild
              >
                <Link to="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Request Access
                </Link>
              </Button>
              <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/5" asChild>
                <Link to="/hub">
                  Return to Product Hub
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
