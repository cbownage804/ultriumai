/**
 * Passwords — Managed by Ray.
 *
 * Unified Wrayth design language: no module hero banner, no module logo,
 * no amber/orange theme. Just a calm page header, a conversational
 * briefing, and the vault below.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PasswordProtectionCard, PasswordHealthyCard, PasswordAnalyzingCard } from '@/components/ray/PasswordProtectionCard';
import { usePasswordLifecycle } from '@/lib/ray/passwordLifecycle';

function PasswordsHeaderAndOnboarding() {
  const { stage, passwordCount } = usePasswordLifecycle();
  const question =
    stage === 'not_started'
      ? "Ready to hand your passwords over to me?"
      : stage === 'imported'
        ? "I'm reading through your vault now — one moment."
        : stage === 'analyzed'
          ? "Want me to walk you through what needs fixing?"
          : "Everything looks healthy — anything you'd like me to check?";
  const description =
    stage === 'not_started'
      ? undefined
      : stage === 'imported'
        ? "I'll surface anything that needs attention as soon as the analysis lands."
        : stage === 'analyzed'
          ? "Here's what to focus on today. I keep watch on everything else."
          : undefined;
  return (
    <>
      <RayPageHeader title="Passwords" question={question} description={description} />
      {stage === 'not_started' && <PasswordProtectionCard />}
      {stage === 'imported' && <PasswordAnalyzingCard count={passwordCount} />}
      {stage === 'healthy' && <PasswordHealthyCard />}
    </>
  );
}


export default function PasswordsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showExtensionBanner, setShowExtensionBanner] = useState(false);
  const [showMasterPasswordSetup, setShowMasterPasswordSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { toast } = useToast();

  const {
    isUnlocked,
    isLoading: isMasterPasswordLoading,
    hasUserSetMasterPassword,
    setMasterPassword,
    unlockWithPassword,
  } = useMasterPassword();

  useEffect(() => {
    if (isMasterPasswordLoading) return;
    if (!hasUserSetMasterPassword()) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(true);
    } else if (!isUnlocked) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(false);
    }
  }, [hasUserSetMasterPassword, isUnlocked, isMasterPasswordLoading]);

  useEffect(() => {
    if (searchParams.get('extension') === 'installed') {
      setShowExtensionBanner(true);
      searchParams.delete('extension');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleMasterPasswordSet = async (password: string) => {
    if (isSettingUp) {
      const result = await setMasterPassword(password);
      if (result.success) {
        setShowMasterPasswordSetup(false);
        toast({ title: 'Master password set', description: 'Your passwords are now protected.' });
      } else {
        toast({
          title: 'Setup failed',
          description: result.errors?.join('. ') || 'Failed to set master password',
          variant: 'destructive',
        });
      }
    } else {
      const result = await unlockWithPassword(password);
      if (result.success) {
        setShowMasterPasswordSetup(false);
        toast({ title: 'Unlocked', description: 'Ray has your passwords ready.' });
      } else {
        toast({
          title: 'Unlock failed',
          description: result.error || 'Incorrect master password',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <AnimatePresence>
          {showExtensionBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
            >
              <Alert className="bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <AlertTitle className="text-foreground font-medium">Extension installed</AlertTitle>
                    <AlertDescription className="text-muted-foreground text-sm mt-1">
                      The Wrayth browser extension is ready. Ray will autofill from here.
                    </AlertDescription>
                  </div>
                  <button
                    onClick={() => setShowExtensionBanner(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showMasterPasswordSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto py-8"
            >
              <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 sm:p-8">
                <div className="mx-auto mb-6 h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <MasterPasswordSetup
                  isCreating={isSettingUp}
                  onMasterPasswordSet={handleMasterPasswordSet}
                  onCancel={() => {
                    if (!isSettingUp) setShowMasterPasswordSetup(false);
                  }}
                  title={isSettingUp ? 'Create your master password' : 'Welcome back'}
                  description={
                    isSettingUp
                      ? "Ray will use this to encrypt your passwords. It can't be recovered, so choose carefully."
                      : 'Enter your master password and Ray will unlock your passwords.'
                  }
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <PasswordsHeaderAndOnboarding />

              <RayConversationCard context="passwords" />

              <PasswordVault />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FeatureGate>
  );
}
