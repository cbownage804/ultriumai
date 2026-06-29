import { IdentityProfiles } from '@/components/safepass/IdentityProfiles';
import { FeatureGate } from '@/components/safesuite/SafeSuitePaywall';

const SafePassIdentity = () => {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Identity Profiles</h1>
          <p className="text-muted-foreground">Save personal information for quick form filling across websites.</p>
        </div>
        <IdentityProfiles />
      </div>
    </FeatureGate>
  );
};

export default SafePassIdentity;
