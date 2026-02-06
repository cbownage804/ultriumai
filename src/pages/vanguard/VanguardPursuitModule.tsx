import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ThreatHuntingPanel } from '@/components/vanguard/pursuit/ThreatHuntingPanel';
import { IOCManagement } from '@/components/vanguard/pursuit/IOCManagement';
import { YaraRulesPanel } from '@/components/vanguard/pursuit/YaraRulesPanel';
import { AttackChainVisualization } from '@/components/vanguard/pursuit/AttackChainVisualization';
import { RansomwareDefensePanel } from '@/components/vanguard/pursuit/RansomwareDefensePanel';
import { QuarantineManager } from '@/components/vanguard/pursuit/QuarantineManager';
import { NetworkSecurityPanel } from '@/components/vanguard/pursuit/NetworkSecurityPanel';
import { ThreatIntelligencePanel } from '@/components/vanguard/pursuit/ThreatIntelligencePanel';
import { ForensicsPanel } from '@/components/vanguard/pursuit/ForensicsPanel';
import { ThreatReportsExport } from '@/components/vanguard/pursuit/ThreatReportsExport';
import { AutomationPoliciesPanel } from '@/components/vanguard/pursuit/AutomationPoliciesPanel';
import { ResponseActionsPanel } from '@/components/vanguard/pursuit/ResponseActionsPanel';
import { AgentTestingPanel } from '@/components/vanguard/pursuit/AgentTestingPanel';
import { PursuitDashboard } from '@/components/vanguard/pursuit/PursuitDashboard';
import { CrossClientCorrelation } from '@/components/vanguard/pursuit/CrossClientCorrelation';

const moduleComponents: Record<string, React.ReactNode> = {
  'threat-hunting': <ThreatHuntingPanel />,
  'ioc': <IOCManagement />,
  'yara': <YaraRulesPanel />,
  'attack-chains': <AttackChainVisualization />,
  'ransomware': <RansomwareDefensePanel />,
  'quarantine': <QuarantineManager />,
  'network': <NetworkSecurityPanel />,
  'intel': <ThreatIntelligencePanel />,
  'cross-client': <CrossClientCorrelation />,
  'forensics': <ForensicsPanel />,
  'reports': <ThreatReportsExport />,
  'automation': <AutomationPoliciesPanel />,
  'response-actions': <ResponseActionsPanel />,
  'agent-testing': <AgentTestingPanel />,
};

export default function VanguardPursuitModule() {
  const { moduleId } = useParams<{ moduleId: string }>();

  useEffect(() => {
    document.title = 'Vanguard Pursuit | Ultrium Vanguard';
  }, []);

  const content = moduleId ? moduleComponents[moduleId] : null;

  return (
    <main className="flex-1 min-w-0 p-6">
      {content || <PursuitDashboard />}
    </main>
  );
}
