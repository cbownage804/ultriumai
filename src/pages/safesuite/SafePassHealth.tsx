import { PasswordHealthDashboard } from '@/components/safepass/PasswordHealthDashboard';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { VaultTabs } from '@/components/safepass/VaultTabs';
import { VaultLockedCard } from '@/components/ray/VaultLockedCard';
import { useMasterPassword } from '@/hooks/useMasterPassword';

const VaultHealth = () => {
  const { isUnlocked } = useMasterPassword();

  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <VaultTabs />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Health</h1>
          <p className="text-muted-foreground">
            {isUnlocked
              ? "A quick read on your vault — what's strong, what's weak, and what I'd fix next."
              : "The vault is Ray's blind spot until you unlock it here. Once open, this becomes your security dashboard."}
          </p>
        </div>
        {isUnlocked ? (
          <PasswordHealthDashboard />
        ) : (
          <VaultLockedCard rayNote="Unlock the vault and I'll grade every password, flag reuse, check breach exposure, and tell you exactly what to fix first." />
        )}
      </div>
    </FeatureGate>
  );
};

export default VaultHealth;
