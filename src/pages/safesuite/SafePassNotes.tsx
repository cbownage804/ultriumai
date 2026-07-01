import { SecureNotes } from '@/components/safepass/SecureNotes';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';
import { VaultTabs } from '@/components/safepass/VaultTabs';

const VaultNotes = () => {
  return (
    <FeatureGate feature="vault">
      <div className="space-y-6">
        <VaultTabs />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Notes</h1>
          <p className="text-muted-foreground">Store encrypted notes, documents, and sensitive information securely.</p>
        </div>
        <SecureNotes />
      </div>
    </FeatureGate>
  );
};

export default VaultNotes;

