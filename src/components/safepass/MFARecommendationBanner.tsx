/**
 * MFA Recommendation Banner for Vault
 * Prompts users to enable 2FA for enhanced vault security
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, X, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const MFA_DISMISSED_KEY = 'safepass_mfa_prompt_dismissed';
const MFA_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface MFARecommendationBannerProps {
  className?: string;
}

export function MFARecommendationBanner({ className }: MFARecommendationBannerProps) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [hasMFA, setHasMFA] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMFAStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user already has 2FA enabled
        const { data: securitySettings } = await supabase
          .from('security_settings')
          .select('two_factor_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        const mfaEnabled = securitySettings?.two_factor_enabled ?? false;
        setHasMFA(mfaEnabled);

        // Check if prompt was recently dismissed
        const dismissedAt = localStorage.getItem(MFA_DISMISSED_KEY);
        const wasDismissed = dismissedAt && 
          (Date.now() - parseInt(dismissedAt, 10)) < MFA_DISMISS_DURATION;

        // Show banner if MFA not enabled and not recently dismissed
        setShowBanner(!mfaEnabled && !wasDismissed);
      } catch (error) {
        console.error('Error checking MFA status:', error);
        setShowBanner(false);
      } finally {
        setLoading(false);
      }
    };

    checkMFAStatus();
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(MFA_DISMISSED_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (loading || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className={className}
        >
          <Alert className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.1),transparent_50%)]" />
            <div className="relative flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/20 border border-primary/30 shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-primary font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Strengthen Your Vault Security
                </AlertTitle>
                <AlertDescription className="text-primary/80 text-sm mt-1.5 leading-relaxed">
                  Enable two-factor authentication (2FA) to add an extra layer of protection to your password vault. 
                  Even if someone discovers your master password, they won't be able to access your data without your authenticator.
                </AlertDescription>
                
                <div className="flex items-center gap-3 mt-4">
                  <Button 
                    asChild
                    size="sm" 
                    className="bg-primary hover:bg-primary text-black font-medium"
                  >
                    <Link to="/settings/security">
                      Enable 2FA Now
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-primary/60 hover:text-primary hover:bg-primary/10"
                  >
                    Remind me later
                  </Button>
                </div>
              </div>
              
              <button 
                onClick={handleDismiss}
                className="text-primary/40 hover:text-primary transition-colors p-1 shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
