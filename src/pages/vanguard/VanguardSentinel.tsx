import { useEffect, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { SentinelDashboard } from '@/components/vanguard/sentinel';
import { SecurityAlertsFeed } from '@/components/vanguard/sentinel/SecurityAlertsFeed';
import { M365TenantManager } from '@/components/vanguard/sentinel/M365TenantManager';
import { GWSTenantManager } from '@/components/vanguard/sentinel/GWSTenantManager';
import { AITriageQueue } from '@/components/vanguard/sentinel/AITriageQueue';
import { AlertRulesConfig } from '@/components/vanguard/sentinel/AlertRulesConfig';
import { CortexGatedSection } from '@/components/vanguard/CortexGatedSection';
import { Brain, Loader2 } from 'lucide-react';

const AITicketSummarizer = lazy(() => import('@/components/vanguard/cortex/AITicketSummarizer').then(m => ({ default: m.AITicketSummarizer })));

const moduleComponents: Record<string, React.ReactNode> = {
  'alerts': <SecurityAlertsFeed />,
  'tenants': <M365TenantManager />,
  'gws': <GWSTenantManager />,
  'ai-triage': <AITriageQueue />,
  'rules': <AlertRulesConfig />,
  'ai-summarizer': (
    <CortexGatedSection
      featureName="AI Alert Summarizer"
      description="Summarize complex security alert chains into concise briefings for faster triage and response."
      icon={<Brain className="h-5 w-5 text-violet-400" />}
    >
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-400" /></div>}>
        <AITicketSummarizer />
      </Suspense>
    </CortexGatedSection>
  ),
};

export default function VanguardSentinel() {
  const { moduleId } = useParams<{ moduleId: string }>();

  useEffect(() => {
    document.title = 'Sentinel | Vanguard';
  }, []);

  const content = moduleId ? moduleComponents[moduleId] : null;

  return (
    <main className="flex-1 min-w-0 p-6">
      {content || <SentinelDashboard />}
    </main>
  );
}
