import { useEffect } from 'react';
import { BackupIntegrationHub } from '@/components/vanguard/horizon/BackupIntegrationHub';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function HorizonBackupsPage() {
  useEffect(() => {
    document.title = 'Backups | Vanguard Horizon';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="horizon" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            Backup Integration
          </h1>
          <p className="text-muted-foreground">Monitor Veeam, Acronis, and other backup solutions</p>
        </div>
      </div>

      <BackupIntegrationHub />
    </div>
  );
}
