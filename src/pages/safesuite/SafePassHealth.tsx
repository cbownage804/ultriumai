import { PasswordHealthDashboard } from '@/components/safepass/PasswordHealthDashboard';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';

const VaultHealth = () => {
  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health</h1>
          <p className="text-muted-foreground">A quick read on your vault — what's strong, what's weak, and what I'd fix next.</p>
        </div>
        <PasswordHealthDashboard />
      </div>
    </FeatureGate>
  );
};

export default VaultHealth;
