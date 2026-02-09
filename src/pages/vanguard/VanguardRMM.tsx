import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HorizonDashboard } from '@/components/vanguard/HorizonDashboard';

// Lazy-loaded operations modules
import { AlertNotificationManager } from '@/components/vanguard/horizon/AlertNotificationManager';
import { AlertEscalationRules } from '@/components/vanguard/horizon/AlertEscalationRules';
import { OnCallScheduleManager } from '@/components/vanguard/horizon/OnCallScheduleManager';
import { AlertSuppressionWindows } from '@/components/vanguard/horizon/AlertSuppressionWindows';
import { AutomatedPatchScheduling } from '@/components/vanguard/horizon/AutomatedPatchScheduling';
import { PatchComplianceDashboard } from '@/components/vanguard/horizon/PatchComplianceDashboard';
import { PatchRollbackSupport } from '@/components/vanguard/horizon/PatchRollbackSupport';
import { ThirdPartyAppPatching } from '@/components/vanguard/horizon/ThirdPartyAppPatching';
import { ThreatHuntingDashboard } from '@/components/vanguard/horizon/ThreatHuntingDashboard';
import { VulnerabilityScanner } from '@/components/vanguard/horizon/VulnerabilityScanner';
import { SecurityBaselineEnforcement } from '@/components/vanguard/horizon/SecurityBaselineEnforcement';
import { IncidentResponsePlaybooks } from '@/components/vanguard/horizon/IncidentResponsePlaybooks';
import { PSASyncIntegration } from '@/components/vanguard/horizon/PSASyncIntegration';
import { DocumentationPlatformIntegration } from '@/components/vanguard/horizon/DocumentationPlatformIntegration';
import { BackupMonitoringIntegration } from '@/components/vanguard/horizon/BackupMonitoringIntegration';
import { NetworkDiscoveryScanner } from '@/components/vanguard/horizon/NetworkDiscoveryScanner';
import { FileTransferManager } from '@/components/vanguard/horizon/FileTransferManager';
import { WakeOnLanManager } from '@/components/vanguard/horizon/WakeOnLanManager';
import { MultiTenantManager } from '@/components/vanguard/horizon/MultiTenantManager';
import { RoleBasedAccessControl } from '@/components/vanguard/horizon/RoleBasedAccessControl';
import { TechnicianActivityLogs } from '@/components/vanguard/horizon/TechnicianActivityLogs';
import { ExecutiveDashboard } from '@/components/vanguard/horizon/ExecutiveDashboard';
import { ScheduledReportDelivery } from '@/components/vanguard/horizon/ScheduledReportDelivery';
import { WhiteLabelReports } from '@/components/vanguard/horizon/WhiteLabelReports';
import { SLATrackingDashboard } from '@/components/vanguard/horizon/SLATrackingDashboard';
import { ComplianceDriftDetector } from '@/components/vanguard/horizon/ComplianceDriftDetector';
import { VulnerabilityTrending } from '@/components/vanguard/horizon/VulnerabilityTrending';
import { ThreatCorrelationEngine } from '@/components/vanguard/horizon/ThreatCorrelationEngine';
import { PredictiveMaintenancePanel } from '@/components/vanguard/horizon/PredictiveMaintenancePanel';
import { RunbookAlertTrigger } from '@/components/vanguard/horizon/RunbookAlertTrigger';

const moduleComponents: Record<string, React.ReactNode> = {
  notifications: <AlertNotificationManager />,
  'escalation-rules': <AlertEscalationRules />,
  'oncall-schedule': <OnCallScheduleManager />,
  'suppression-windows': <AlertSuppressionWindows />,
  'patch-scheduling': <AutomatedPatchScheduling />,
  'patch-compliance': <PatchComplianceDashboard />,
  'patch-rollback': <PatchRollbackSupport />,
  'thirdparty-patching': <ThirdPartyAppPatching />,
  'threat-hunting': <ThreatHuntingDashboard />,
  'vuln-scanner': <VulnerabilityScanner />,
  'security-baselines': <SecurityBaselineEnforcement />,
  'incident-playbooks': <IncidentResponsePlaybooks />,
  'psa-sync': <PSASyncIntegration />,
  'doc-integration': <DocumentationPlatformIntegration />,
  'backup-monitoring': <BackupMonitoringIntegration />,
  'network-discovery': <NetworkDiscoveryScanner />,
  'file-transfer': <FileTransferManager />,
  'wake-on-lan': <WakeOnLanManager />,
  'multi-tenant': <MultiTenantManager />,
  rbac: <RoleBasedAccessControl />,
  'activity-logs': <TechnicianActivityLogs />,
  'executive-dashboard': <ExecutiveDashboard />,
  'scheduled-reports': <ScheduledReportDelivery />,
  'white-label': <WhiteLabelReports />,
  'sla-tracking': <SLATrackingDashboard />,
  'compliance-drift': <ComplianceDriftDetector />,
  'vuln-trending': <VulnerabilityTrending />,
  'threat-correlation': <ThreatCorrelationEngine />,
  'predictive-maintenance': <PredictiveMaintenancePanel />,
  'runbook-triggers': <RunbookAlertTrigger />,
};

export default function VanguardRMM() {
  const { moduleId } = useParams<{ moduleId: string }>();

  useEffect(() => {
    document.title = 'Horizon RMM | Vanguard';
  }, []);

  const content = moduleId ? moduleComponents[moduleId] : null;

  return (
    <main className="flex-1 min-w-0 p-6">
      {content || <HorizonDashboard />}
    </main>
  );
}
