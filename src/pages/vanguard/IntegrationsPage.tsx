import { PSARMMIntegrations } from '@/components/vanguard/integrations/PSARMMIntegrations';

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">External Integrations</h1>
        <p className="text-muted-foreground">
          Connect your PSA and RMM tools for seamless data synchronization
        </p>
      </div>
      <PSARMMIntegrations />
    </div>
  );
}
