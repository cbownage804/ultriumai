import { IdentityProfiles } from '@/components/safepass/IdentityProfiles';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { VaultTabs } from '@/components/safepass/VaultTabs';

const VaultIdentity = () => {
  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <VaultTabs />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identity</h1>
          <p className="text-muted-foreground">Save your passport, SSN, driver's license, or insurance card. Ray keeps everything encrypted.</p>
        </div>
        <IdentityProfiles />
      </div>
    </FeatureGate>
  );
};

export default VaultIdentity;

