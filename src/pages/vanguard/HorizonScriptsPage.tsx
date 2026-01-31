import { useEffect } from 'react';
import { FleetScriptLibrary } from '@/components/vanguard/horizon/FleetScriptLibrary';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function HorizonScriptsPage() {
  useEffect(() => {
    document.title = 'Scripts | Vanguard Horizon';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <ModuleLogo module="horizon" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent">
            Script Library
          </h1>
          <p className="text-muted-foreground">Manage and deploy scripts across your fleet</p>
        </div>
      </div>

      <FleetScriptLibrary />
    </div>
  );
}
