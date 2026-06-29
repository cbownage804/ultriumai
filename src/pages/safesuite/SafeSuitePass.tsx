/**
 * Wrayth Pass - Password Manager within Wrayth
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeatureGate, TierLimitInfo } from '@/components/safesuite/SafeSuitePaywall';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { MFARecommendationBanner } from '@/components/safepass/MFARecommendationBanner';

import { SecurityTipsModal } from '@/components/safepass/SecurityTipsModal';
import { SecurityArchitectureBadge } from '@/components/safepass/SecurityArchitectureBadge';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, X, Lock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedHeader, GlowContainer, SAFESUITE_THEMES } from '@/components/safesuite/SafeSuiteEffects';
import safepassLogo from '@/assets/safepass-logo.png';
import heroSafepassBg from '@/assets/hero-safepass-bg.jpg';

export default function WraythPass() {
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
    unlockWithPassword
  } = useMasterPassword();

  useEffect(() => {
    // Wait until master password state is loaded before deciding setup vs unlock
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
        toast({
          title: "Master password set",
          description: "Your vault is now protected and unlocked.",
        });
      } else {
        toast({
          title: "Setup failed",
          description: result.errors?.join('. ') || "Failed to set master password",
          variant: "destructive",
        });
      }
    } else {
      const result = await unlockWithPassword(password);
      if (result.success) {
        setShowMasterPasswordSetup(false);
        toast({
          title: "Vault unlocked",
          description: "You can now access your passwords.",
        });
      } else {
        toast({
          title: "Unlock failed",
          description: result.error || "Incorrect master password",
          variant: "destructive",
        });
      }
    }
  };

  return (
    
    <FeatureGate feature="safepass">
      <div 
        className="min-h-screen space-y-4 sm:space-y-6 p-4 sm:p-6 -m-4 sm:-m-6 relative safe-area-inset-bottom"
        style={{
          backgroundImage: `url(${heroSafepassBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll'
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Content wrapper */}
        <div className="relative z-10 space-y-4 sm:space-y-6">
        <AnimatePresence>
          {showExtensionBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
            >
              <Alert className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent" />
                <div className="relative flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <AlertTitle className="text-amber-400 font-semibold">Extension Installed!</AlertTitle>
                    <AlertDescription className="text-amber-400/80 text-sm mt-1">
                      The Vault browser extension is ready to use. Click the extension icon in your toolbar to start autofilling passwords.
                    </AlertDescription>
                  </div>
                  <button 
                    onClick={() => setShowExtensionBanner(false)}
                    className="text-amber-400/60 hover:text-amber-400 transition-colors p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Master Password Setup/Unlock Screen */}
        <AnimatePresence mode="wait">
          {showMasterPasswordSetup ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto py-6 sm:py-12 px-2 sm:px-0"
            >
              <GlowContainer theme="safepass" className="p-4 sm:p-8">
                {/* Vault Logo - Horizontal Layout */}
                <motion.div 
                  className="mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center px-4 sm:px-8 py-3 sm:py-4"
                  animate={{ 
                    boxShadow: ['0 0 20px rgba(245,158,11,0.2)', '0 0 40px rgba(245,158,11,0.3)', '0 0 20px rgba(245,158,11,0.2)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <img src={safepassLogo} alt="Vault" className="h-10 sm:h-12 w-auto object-contain" />
                </motion.div>
                
                <MasterPasswordSetup
                  isCreating={isSettingUp}
                  onMasterPasswordSet={handleMasterPasswordSet}
                  onCancel={() => {
                    if (!isSettingUp) {
                      setShowMasterPasswordSetup(false);
                    }
                  }}
                  title={isSettingUp ? 'Create Master Password' : 'Unlock Your Vault'}
                  description={
                    isSettingUp
                      ? 'Create a strong master password to encrypt your vault. This password cannot be recovered.'
                      : 'Enter your master password to access your passwords.'
                  }
                />
              </GlowContainer>
            </motion.div>
          ) : (
            <motion.div
              key="vault"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <AnimatedHeader
                logo={safepassLogo}
                logoAlt="Vault"
                tagline="Securely store and manage your passwords with military-grade encryption"
                theme="safepass"
                badge="Encrypted"
              />
              
              {/* Tier Limit Info - Always visible for upselling */}
              <TierLimitInfo feature="safepass" />
              
              {/* Security Badge - shows architecture on click */}
              <div className="flex justify-center">
                <SecurityArchitectureBadge />
              </div>
              
              {/* MFA Recommendation Banner */}
              <MFARecommendationBanner />
              
              {/* Security Tips Modal - shows on first visit */}
              <SecurityTipsModal />
              
              <PasswordVault />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </FeatureGate>
    
  );
}
