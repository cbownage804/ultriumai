import { CreditCards } from '@/components/safepass/CreditCards';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';

const VaultCards = () => {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-muted-foreground">Securely store and manage your payment cards for quick autofill.</p>
        </div>
        <CreditCards />
      </div>
    </FeatureGate>
  );
};

export default VaultCards;
