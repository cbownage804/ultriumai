import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Shield,
  Package,
  Link2,
  Upload,
  Power,
  Search,
  Bug,
  ShieldCheck,
  BookOpen,
  Users,
  Key,
  ClipboardList,
  BarChart3,
  Calendar,
  FileText,
  Clock,
} from "lucide-react";

// Alerting
import { AlertNotificationManager } from "./AlertNotificationManager";
import { AlertEscalationRules } from "./AlertEscalationRules";
import { OnCallScheduleManager } from "./OnCallScheduleManager";
import { AlertSuppressionWindows } from "./AlertSuppressionWindows";

// Patch Management
import { AutomatedPatchScheduling } from "./AutomatedPatchScheduling";
import { PatchComplianceDashboard } from "./PatchComplianceDashboard";
import { PatchRollbackSupport } from "./PatchRollbackSupport";
import { ThirdPartyAppPatching } from "./ThirdPartyAppPatching";

// Integrations
import { PSASyncIntegration } from "./PSASyncIntegration";
import { DocumentationPlatformIntegration } from "./DocumentationPlatformIntegration";
import { BackupMonitoringIntegration } from "./BackupMonitoringIntegration";
import { NetworkDiscoveryScanner } from "./NetworkDiscoveryScanner";

// Remote Access
import { FileTransferManager } from "./FileTransferManager";
import { WakeOnLanManager } from "./WakeOnLanManager";

// Security/EDR
import { ThreatHuntingDashboard } from "./ThreatHuntingDashboard";
import { VulnerabilityScanner } from "./VulnerabilityScanner";
import { SecurityBaselineEnforcement } from "./SecurityBaselineEnforcement";
import { IncidentResponsePlaybooks } from "./IncidentResponsePlaybooks";

// Access Control
import { MultiTenantManager } from "./MultiTenantManager";
import { RoleBasedAccessControl } from "./RoleBasedAccessControl";
import { TechnicianActivityLogs } from "./TechnicianActivityLogs";

// Reporting
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { ScheduledReportDelivery } from "./ScheduledReportDelivery";
import { WhiteLabelReports } from "./WhiteLabelReports";
import { SLATrackingDashboard } from "./SLATrackingDashboard";

interface ModuleSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  modules: {
    id: string;
    label: string;
    icon: React.ReactNode;
    component: React.ReactNode;
  }[];
}

export function HorizonOperationsCenter() {
  const [activeSection, setActiveSection] = useState("alerting");
  const [activeModule, setActiveModule] = useState("notifications");

  const sections: ModuleSection[] = [
    {
      id: "alerting",
      label: "Alerting",
      icon: <Bell className="h-4 w-4" />,
      badge: "4",
      modules: [
        {
          id: "notifications",
          label: "Notifications",
          icon: <Bell className="h-4 w-4" />,
          component: <AlertNotificationManager />,
        },
        {
          id: "escalation",
          label: "Escalation Rules",
          icon: <ClipboardList className="h-4 w-4" />,
          component: <AlertEscalationRules />,
        },
        {
          id: "oncall",
          label: "On-Call Schedule",
          icon: <Calendar className="h-4 w-4" />,
          component: <OnCallScheduleManager />,
        },
        {
          id: "suppression",
          label: "Suppression Windows",
          icon: <Clock className="h-4 w-4" />,
          component: <AlertSuppressionWindows />,
        },
      ],
    },
    {
      id: "patching",
      label: "Patching",
      icon: <Package className="h-4 w-4" />,
      modules: [
        {
          id: "scheduling",
          label: "Automated Scheduling",
          icon: <Calendar className="h-4 w-4" />,
          component: <AutomatedPatchScheduling />,
        },
        {
          id: "compliance",
          label: "Compliance Dashboard",
          icon: <ShieldCheck className="h-4 w-4" />,
          component: <PatchComplianceDashboard />,
        },
        {
          id: "rollback",
          label: "Rollback Support",
          icon: <Clock className="h-4 w-4" />,
          component: <PatchRollbackSupport />,
        },
        {
          id: "thirdparty",
          label: "Third-Party Apps",
          icon: <Package className="h-4 w-4" />,
          component: <ThirdPartyAppPatching />,
        },
      ],
    },
    {
      id: "security",
      label: "Security/EDR",
      icon: <Shield className="h-4 w-4" />,
      badge: "EDR",
      modules: [
        {
          id: "threats",
          label: "Threat Hunting",
          icon: <Search className="h-4 w-4" />,
          component: <ThreatHuntingDashboard />,
        },
        {
          id: "vulnerabilities",
          label: "Vulnerability Scanner",
          icon: <Bug className="h-4 w-4" />,
          component: <VulnerabilityScanner />,
        },
        {
          id: "baselines",
          label: "Security Baselines",
          icon: <ShieldCheck className="h-4 w-4" />,
          component: <SecurityBaselineEnforcement />,
        },
        {
          id: "playbooks",
          label: "Incident Playbooks",
          icon: <BookOpen className="h-4 w-4" />,
          component: <IncidentResponsePlaybooks />,
        },
      ],
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: <Link2 className="h-4 w-4" />,
      modules: [
        {
          id: "psa",
          label: "PSA Sync",
          icon: <Link2 className="h-4 w-4" />,
          component: <PSASyncIntegration />,
        },
        {
          id: "documentation",
          label: "Documentation",
          icon: <FileText className="h-4 w-4" />,
          component: <DocumentationPlatformIntegration />,
        },
        {
          id: "backup",
          label: "Backup Monitoring",
          icon: <Shield className="h-4 w-4" />,
          component: <BackupMonitoringIntegration />,
        },
        {
          id: "discovery",
          label: "Network Discovery",
          icon: <Search className="h-4 w-4" />,
          component: <NetworkDiscoveryScanner />,
        },
      ],
    },
    {
      id: "remote",
      label: "Remote Access",
      icon: <Upload className="h-4 w-4" />,
      modules: [
        {
          id: "filetransfer",
          label: "File Transfer",
          icon: <Upload className="h-4 w-4" />,
          component: <FileTransferManager />,
        },
        {
          id: "wakeonlan",
          label: "Wake-on-LAN",
          icon: <Power className="h-4 w-4" />,
          component: <WakeOnLanManager />,
        },
      ],
    },
    {
      id: "access",
      label: "Access Control",
      icon: <Key className="h-4 w-4" />,
      modules: [
        {
          id: "tenants",
          label: "Multi-Tenant",
          icon: <Users className="h-4 w-4" />,
          component: <MultiTenantManager />,
        },
        {
          id: "rbac",
          label: "Role-Based Access",
          icon: <Key className="h-4 w-4" />,
          component: <RoleBasedAccessControl />,
        },
        {
          id: "activitylogs",
          label: "Activity Logs",
          icon: <ClipboardList className="h-4 w-4" />,
          component: <TechnicianActivityLogs />,
        },
      ],
    },
    {
      id: "reporting",
      label: "Reporting",
      icon: <BarChart3 className="h-4 w-4" />,
      modules: [
        {
          id: "executive",
          label: "Executive Dashboard",
          icon: <BarChart3 className="h-4 w-4" />,
          component: <ExecutiveDashboard />,
        },
        {
          id: "scheduled",
          label: "Scheduled Reports",
          icon: <Calendar className="h-4 w-4" />,
          component: <ScheduledReportDelivery />,
        },
        {
          id: "whitelabel",
          label: "White-Label",
          icon: <FileText className="h-4 w-4" />,
          component: <WhiteLabelReports />,
        },
        {
          id: "sla",
          label: "SLA Tracking",
          icon: <Clock className="h-4 w-4" />,
          component: <SLATrackingDashboard />,
        },
      ],
    },
  ];

  const currentSection = sections.find((s) => s.id === activeSection);
  const currentModule = currentSection?.modules.find((m) => m.id === activeModule);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = sections.find((s) => s.id === sectionId);
    if (section && section.modules.length > 0) {
      setActiveModule(section.modules[0].id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Tabs */}
      <div className="relative overflow-hidden rounded-xl bg-black/60 backdrop-blur-xl border border-cyan-500/20 p-4">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Operations Center</h2>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                      : "bg-black/40 hover:bg-white/5 text-white/60 hover:text-white/80 border border-white/10"
                  }`}
                >
                  {section.icon}
                  <span>{section.label}</span>
                  {section.badge && (
                    <Badge 
                      variant="secondary" 
                      className={`ml-1 h-5 px-1.5 text-xs ${
                        activeSection === section.id 
                          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" 
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {section.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Module Tabs */}
      {currentSection && (
        <Tabs value={activeModule} onValueChange={setActiveModule} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-auto min-w-full bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-lg">
              {currentSection.modules.map((module) => (
                <TabsTrigger
                  key={module.id}
                  value={module.id}
                  className="text-xs gap-1.5 text-white/60 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30 transition-all duration-200"
                >
                  {module.icon}
                  {module.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="mt-4">
            {currentSection.modules.map((module) => (
              <TabsContent key={module.id} value={module.id} className="mt-0">
                {module.component}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      )}
    </div>
  );
}
