import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { SentinelDashboard } from '@/components/vanguard/sentinel';
import { SecurityAlertsFeed } from '@/components/vanguard/sentinel/SecurityAlertsFeed';
import { M365TenantManager } from '@/components/vanguard/sentinel/M365TenantManager';
import { GWSTenantManager } from '@/components/vanguard/sentinel/GWSTenantManager';
import { AITriageQueue } from '@/components/vanguard/sentinel/AITriageQueue';
import { AlertRulesConfig } from '@/components/vanguard/sentinel/AlertRulesConfig';

const moduleComponents: Record<string, React.ReactNode> = {
  'alerts': <SecurityAlertsFeed />,
  'tenants': <M365TenantManager />,
  'gws': <GWSTenantManager />,
  'ai-triage': <AITriageQueue />,
  'rules': <AlertRulesConfig />,
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
