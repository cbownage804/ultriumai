import { CreditCards } from '@/components/safepass/CreditCards';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { VaultTabs } from '@/components/safepass/VaultTabs';

const VaultCards = () => {
  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <VaultTabs />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
          <p className="text-muted-foreground">Store encrypted payment cards. Ray keeps everything encrypted on your device.</p>
        </div>
        <CreditCards />
      </div>
    </FeatureGate>
  );
};

export default VaultCards;

