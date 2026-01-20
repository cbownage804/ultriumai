import { PasswordHealthDashboard } from '@/components/safepass/PasswordHealthDashboard';

const SafePassHealth = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Password Health</h1>
        <p className="text-muted-foreground">Analyze your passwords for security issues and get recommendations.</p>
      </div>
      <PasswordHealthDashboard />
    </div>
  );
};

export default SafePassHealth;
