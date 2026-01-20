import { IdentityProfiles } from '@/components/safepass/IdentityProfiles';

const SafePassIdentity = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Identity Profiles</h1>
        <p className="text-muted-foreground">Save personal information for quick form filling across websites.</p>
      </div>
      <IdentityProfiles />
    </div>
  );
};

export default SafePassIdentity;
