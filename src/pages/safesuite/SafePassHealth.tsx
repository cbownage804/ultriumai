import { PasswordHealthDashboard } from '@/components/safepass/PasswordHealthDashboard';
import { FeatureGate } from '@/components/safesuite/WraythPaywall';

const SafePassHealth = () => {
  return (
    <FeatureGate feature="safepass">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Password Health</h1>
          <p className="text-muted-foreground">Analyze your passwords for security issues and get recommendations.</p>
        </div>
        <PasswordHealthDashboard />
      </div>
    </FeatureGate>
  );
};

export default SafePassHealth;
