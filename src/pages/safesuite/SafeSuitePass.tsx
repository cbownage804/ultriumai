/**
 * SafeSuite Pass - Password Manager within SafeSuite
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { PasswordVault } from '@/components/safepass/PasswordVault';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, X } from 'lucide-react';

export default function SafeSuitePass() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showExtensionBanner, setShowExtensionBanner] = useState(false);

  useEffect(() => {
    if (searchParams.get('extension') === 'installed') {
      setShowExtensionBanner(true);
      // Clean up the URL
      searchParams.delete('extension');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">SafePass</h1>
            <p className="text-gray-400">
              Securely store and manage your passwords with military-grade encryption
            </p>
          </div>
        </div>
        
        <PasswordVault />
      </div>
    </FeatureGate>
  );
}
