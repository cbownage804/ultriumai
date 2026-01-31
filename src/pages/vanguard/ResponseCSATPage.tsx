import { useEffect } from 'react';
import { CSATSurveyManager } from '@/components/vanguard/helpdesk';
import { ModuleLogo } from '@/components/vanguard/ModuleLogo';

export default function ResponseCSATPage() {
  useEffect(() => {
    document.title = 'CSAT Surveys | Vanguard Response';
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <ModuleLogo module="response" size="lg" glow />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            CSAT Surveys
          </h1>
          <p className="text-muted-foreground">Customer satisfaction surveys and NPS tracking</p>
        </div>
      </div>

      <CSATSurveyManager />
    </div>
  );
}
