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
      <div className="space-y-6">
        {showExtensionBanner && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600">Extension Installed!</AlertTitle>
            <AlertDescription className="text-green-600/80">
              The SafePass browser extension is ready to use. Click the extension icon in your toolbar to start autofilling passwords.
            </AlertDescription>
            <button 
              onClick={() => setShowExtensionBanner(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SafePass</h1>
            <p className="text-muted-foreground">
              Securely store and manage your passwords with military-grade encryption
            </p>
          </div>
        </div>
        
        <PasswordVault />
      </div>
    </FeatureGate>
  );
}
