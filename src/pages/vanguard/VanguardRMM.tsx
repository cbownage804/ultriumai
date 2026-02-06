import { useEffect, useState } from 'react';
import { HorizonDashboard } from '@/components/vanguard/HorizonDashboard';
import { HorizonSidebar, HorizonSidebarGroup } from '@/components/vanguard/horizon/HorizonSidebar';
import {
  LayoutDashboard, Bell, Package, Shield, Link2, Upload, Power,
  Key, BarChart3, Search, Bug, ShieldCheck, BookOpen, Users,
  ClipboardList, Calendar, FileText, Clock,
} from 'lucide-react';

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

const sidebarGroups: HorizonSidebarGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    defaultOpen: false,
    items: [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'alerting',
    label: 'Alerting',
    icon: Bell,
    badge: '!',
    defaultOpen: false,
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'escalation', label: 'Escalation Rules', icon: ClipboardList },
      { id: 'oncall', label: 'On-Call Schedule', icon: Calendar },
      { id: 'suppression', label: 'Suppression Windows', icon: Clock },
    ],
  },
  {
    id: 'patching',
    label: 'Patching',
    icon: Package,
    defaultOpen: false,
    items: [
      { id: 'scheduling', label: 'Automated Scheduling', icon: Calendar },
      { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
      { id: 'rollback', label: 'Rollback Support', icon: Clock },
      { id: 'thirdparty', label: 'Third-Party Apps', icon: Package },
    ],
  },
  {
    id: 'security',
    label: 'Security / EDR',
    icon: Shield,
    badge: 'EDR',
    defaultOpen: false,
    items: [
      { id: 'threats', label: 'Threat Hunting', icon: Search },
      { id: 'vulnerabilities', label: 'Vulnerability Scanner', icon: Bug },
      { id: 'baselines', label: 'Security Baselines', icon: ShieldCheck },
      { id: 'playbooks', label: 'Incident Playbooks', icon: BookOpen },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    defaultOpen: false,
    items: [
      { id: 'psa', label: 'PSA Sync', icon: Link2 },
      { id: 'documentation', label: 'Documentation', icon: FileText },
      { id: 'backup', label: 'Backup Monitoring', icon: Shield },
      { id: 'discovery', label: 'Network Discovery', icon: Search },
    ],
  },
  {
    id: 'remote',
    label: 'Remote Access',
    icon: Upload,
    defaultOpen: false,
    items: [
      { id: 'filetransfer', label: 'File Transfer', icon: Upload },
      { id: 'wakeonlan', label: 'Wake-on-LAN', icon: Power },
    ],
  },
  {
    id: 'access',
    label: 'Access Control',
    icon: Key,
    defaultOpen: false,
    items: [
      { id: 'tenants', label: 'Multi-Tenant', icon: Users },
      { id: 'rbac', label: 'Role-Based Access', icon: Key },
      { id: 'activitylogs', label: 'Activity Logs', icon: ClipboardList },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { id: 'executive', label: 'Executive Dashboard', icon: BarChart3 },
      { id: 'scheduled', label: 'Scheduled Reports', icon: Calendar },
      { id: 'whitelabel', label: 'White-Label', icon: FileText },
      { id: 'sla', label: 'SLA Tracking', icon: Clock },
    ],
  },
];

const moduleComponents: Record<string, React.ReactNode> = {
  notifications: <AlertNotificationManager />,
  escalation: <AlertEscalationRules />,
  oncall: <OnCallScheduleManager />,
  suppression: <AlertSuppressionWindows />,
  scheduling: <AutomatedPatchScheduling />,
  compliance: <PatchComplianceDashboard />,
  rollback: <PatchRollbackSupport />,
  thirdparty: <ThirdPartyAppPatching />,
  threats: <ThreatHuntingDashboard />,
  vulnerabilities: <VulnerabilityScanner />,
  baselines: <SecurityBaselineEnforcement />,
  playbooks: <IncidentResponsePlaybooks />,
  psa: <PSASyncIntegration />,
  documentation: <DocumentationPlatformIntegration />,
  backup: <BackupMonitoringIntegration />,
  discovery: <NetworkDiscoveryScanner />,
  filetransfer: <FileTransferManager />,
  wakeonlan: <WakeOnLanManager />,
  tenants: <MultiTenantManager />,
  rbac: <RoleBasedAccessControl />,
  activitylogs: <TechnicianActivityLogs />,
  executive: <ExecutiveDashboard />,
  scheduled: <ScheduledReportDelivery />,
  whitelabel: <WhiteLabelReports />,
  sla: <SLATrackingDashboard />,
};

export default function VanguardRMM() {
  const [activeItem, setActiveItem] = useState('overview');

  useEffect(() => {
    document.title = 'Vanguard Horizon | Ultrium Vanguard';
  }, []);

  return (
    <div className="flex min-h-screen">
      <HorizonSidebar
        groups={sidebarGroups}
        activeItem={activeItem}
        onSelect={setActiveItem}
      />
      <main className="flex-1 min-w-0 p-6">
        {activeItem === 'overview' ? (
          <HorizonDashboard />
        ) : (
          moduleComponents[activeItem] || (
            <div className="text-white/60 text-center py-12">Module not found</div>
          )
        )}
      </main>
    </div>
  );
}
