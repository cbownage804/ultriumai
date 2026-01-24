/**
 * SafeSuite Pass - Password Manager within SafeSuite
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, X } from 'lucide-react';
import safepassLogo from '@/assets/safepass-logo.png';

export default function SafeSuitePass() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showExtensionBanner, setShowExtensionBanner] = useState(false);
  const [showMasterPasswordSetup, setShowMasterPasswordSetup] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const {
    isUnlocked,
    hasUserSetMasterPassword,
    setMasterPassword,
    unlockWithPassword
  } = useMasterPassword();

  // Check if user needs to set up or unlock master password
  useEffect(() => {
    if (!hasUserSetMasterPassword()) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(true);
    } else if (!isUnlocked) {
      setShowMasterPasswordSetup(true);
      setIsSettingUp(false);
    }
  }, [hasUserSetMasterPassword, isUnlocked]);

  // Handle extension banner URL param
  useEffect(() => {
    if (searchParams.get('extension') === 'installed') {
      setShowExtensionBanner(true);
      searchParams.delete('extension');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleMasterPasswordSet = async (password: string) => {
    if (isSettingUp) {
      const success = await setMasterPassword(password);
      if (success) {
        setShowMasterPasswordSetup(false);
      }
    } else {
      const result = await unlockWithPassword(password);
      if (result.success) {
        setShowMasterPasswordSetup(false);
      }
    }
  };

  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6 bg-[#0a0a0a] min-h-full p-6 -m-6 rounded-lg">
        {showExtensionBanner && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Extension Installed!</AlertTitle>
            <AlertDescription className="text-amber-400/80">
              The SafePass browser extension is ready to use. Click the extension icon in your toolbar to start autofilling passwords.
            </AlertDescription>
            <button 
              onClick={() => setShowExtensionBanner(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}
        
        {/* Master Password Setup/Unlock Screen */}
        {showMasterPasswordSetup ? (
          <div className="max-w-md mx-auto py-12">
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
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <img src={safepassLogo} alt="SafePass" className="h-10 w-auto" />
                <p className="text-gray-400 mt-1">
                  Securely store and manage your passwords with military-grade encryption
                </p>
              </div>
            </div>
            
            <PasswordVault />
          </>
        )}
      </div>
    </FeatureGate>
  );
}
