/**
 * Ray's 2FA recommendation — replaces the old "Strengthen Your Vault Security" alert
 * with a conversational, Wrayth-styled nudge.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const MFA_DISMISSED_KEY = 'wrayth_mfa_prompt_dismissed';
const MFA_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export function MFARecommendationBanner({ className }: { className?: string }) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data } = await supabase
          .from('security_settings')
          .select('two_factor_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        const enabled = data?.two_factor_enabled ?? false;
        const dismissedAt = localStorage.getItem(MFA_DISMISSED_KEY);
        const wasDismissed = dismissedAt && (Date.now() - parseInt(dismissedAt, 10)) < MFA_DISMISS_DURATION;
        setShowBanner(!enabled && !wasDismissed);
      } catch {
        setShowBanner(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(MFA_DISMISSED_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (loading || !showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -6, height: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-card/60 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.08),transparent_60%)] pointer-events-none" />
          <div className="relative p-5 flex items-start gap-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-muted-foreground">Ray recommends</span> enabling two-factor authentication.
                You're one step away from fully protecting your vault.
              </p>
              <div className="flex items-center gap-4 mt-3">
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/settings/security">Enable with Ray</Link>
                </Button>
                <span className="text-xs text-muted-foreground">Estimated setup · 2 minutes</span>
                <button
                  onClick={handleDismiss}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
