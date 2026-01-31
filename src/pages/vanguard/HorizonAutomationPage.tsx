import { useEffect } from 'react';
import { FleetPerformanceGrid } from '@/components/vanguard/horizon/FleetPerformanceGrid';
import { MaintenanceWindowManager } from '@/components/vanguard/horizon/MaintenanceWindowManager';
import { RunbookAutomation } from '@/components/vanguard/horizon/RunbookAutomation';
import { AlertThresholdManager } from '@/components/vanguard/horizon/AlertThresholdManager';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function HorizonAutomationPage() {
  useEffect(() => {
    document.title = 'Automation | Vanguard Horizon';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="horizon" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            Automation Center
          </h1>
          <p className="text-muted-foreground">Runbooks, thresholds, maintenance windows, and fleet automation</p>
        </div>
      </div>

      <FleetPerformanceGrid />
      <RunbookAutomation />
      <AlertThresholdManager />
      <MaintenanceWindowManager />
    </div>
  );
}
