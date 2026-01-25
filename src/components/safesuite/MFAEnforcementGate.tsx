/**
 * MFA Enforcement Gate for SafeSuite Sensitive Features
 * Blocks access to vault, billing, and settings until MFA is enabled
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMFAStatus } from '@/hooks/useMFAStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  Smartphone, 
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { isSafeSuiteDomain } from '@/utils/subdomain';

// Product logos
import safesuiteLogo from '@/assets/safesuite-logo.png';

interface MFAEnforcementGateProps {
  children: ReactNode;
  /** Feature name for display purposes */
  featureName?: string;
}

const MFA_BENEFITS = [
  "Protect your vault with an authenticator app",
  "Prevent unauthorized access even if password is compromised",
  "Required for master password recovery",
  "Industry-standard security for sensitive data"
];

export function MFAEnforcementGate({ children, featureName = 'this feature' }: MFAEnforcementGateProps) {
  const { loading, hasMFA } = useMFAStatus();
  
  const settingsPath = isSafeSuiteDomain() ? '/settings' : '/safesuite/settings';

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Checking security status...</p>
        </div>
      </div>
    );
  }

  // MFA is enabled - render children
  if (hasMFA) {
    return <>{children}</>;
  }

  // MFA not enabled - show enforcement screen
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden">
          {/* Decorative header */}
          <div className="relative h-32 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15),transparent_70%)]" />
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative"
            >
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </motion.div>
          </div>

          <CardHeader className="text-center pb-2">
            <Badge variant="outline" className="mx-auto mb-3 border-amber-500/50 text-amber-500">
              <Lock className="h-3 w-3 mr-1" />
              Security Required
            </Badge>
            <CardTitle className="text-xl md:text-2xl">
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-base">
              To access {featureName}, you must enable 2FA to protect your sensitive data.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits list */}
            <div className="space-y-3">
              {MFA_BENEFITS.map((benefit, index) => (
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

            {/* Setup instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4 text-amber-500" />
                How to set up 2FA:
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Go to Settings and click "Enable 2FA"</li>
                <li>Scan the QR code with your authenticator</li>
                <li>Enter the 6-digit code to verify</li>
              </ol>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link to={settingsPath}>
                <Button 
                  size="lg" 
                  className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Set Up 2FA Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* SafeSuite branding */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Secured by
              </p>
              <img 
                src={safesuiteLogo} 
                alt="SafeSuite" 
                className="h-8 mx-auto opacity-60"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
