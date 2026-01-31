import { CortexSettingsHub } from '@/components/vanguard/cortex/CortexSettingsHub';

export default function CortexSettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cortex AI Settings</h1>
        <p className="text-muted-foreground">
          Configure all AI tools, system prompts, and usage limits
        </p>
      </div>
      <CortexSettingsHub />
    </div>
  );
}
