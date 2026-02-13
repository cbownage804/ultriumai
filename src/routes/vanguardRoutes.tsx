import { Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VanguardFeatureGate } from '@/components/vanguard/VanguardFeatureGate';

// Lazy load Vanguard pages for better performance
const VanguardProductPage = lazy(() => import('@/pages/products/VanguardProductPage'));
const VanguardHome = lazy(() => import('@/pages/vanguard/VanguardHome'));
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevicesPage = lazy(() => import('@/pages/VanguardDevices'));
const VanguardDeviceDetailPage = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardPiDetail = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
// VanguardAuthPage removed - unified auth at /auth
const VanguardReports = lazy(() => import('@/pages/vanguard/VanguardReports'));
const VanguardContracts = lazy(() => import('@/pages/vanguard/VanguardContracts'));
const VanguardAITagging = lazy(() => import('@/pages/vanguard/VanguardAITagging'));
const VanguardTrustCenter = lazy(() => import('@/pages/vanguard/VanguardTrustCenter'));

// New navigation pages
const VanguardTickets = lazy(() => import('@/pages/vanguard/VanguardTickets'));
const VanguardTicketDetail = lazy(() => import('@/pages/vanguard/VanguardTicketDetail'));
const VanguardCustomers = lazy(() => import('@/pages/vanguard/VanguardCustomers'));
const VanguardCustomerDetail = lazy(() => import('@/pages/vanguard/VanguardCustomerDetail'));
const VanguardAlerts = lazy(() => import('@/pages/vanguard/VanguardAlerts'));
const VanguardAppCenter = lazy(() => import('@/pages/vanguard/VanguardAppCenter'));
const VanguardKnowledge = lazy(() => import('@/pages/vanguard/VanguardKnowledge'));
const VanguardBilling = lazy(() => import('@/pages/vanguard/VanguardBilling'));
const VanguardAdmin = lazy(() => import('@/pages/vanguard/VanguardAdmin'));
const VanguardReferrals = lazy(() => import('@/pages/vanguard/VanguardReferrals'));

// Lazy load dedicated page components
const ThreatDetection = lazy(() => import('@/components/security/ThreatDetection').then(m => ({ default: m.ThreatDetection })));
const VanguardSOC = lazy(() => import('@/components/vanguard/VanguardSOC').then(m => ({ default: m.VanguardSOC })));
const VanguardPentest = lazy(() => import('@/components/vanguard/VanguardPentest').then(m => ({ default: m.VanguardPentest })));
const ComplianceAuditor = lazy(() => import('@/components/security/ComplianceAuditor').then(m => ({ default: m.ComplianceAuditor })));
const RemediationAutomation = lazy(() => import('@/components/vanguard/RemediationAutomation').then(m => ({ default: m.RemediationAutomation })));
const AlertingSettings = lazy(() => import('@/components/vanguard/AlertingSettings').then(m => ({ default: m.AlertingSettings })));
const AdvancedAlertingPanel = lazy(() => import('@/components/vanguard/AdvancedAlertingPanel').then(m => ({ default: m.AdvancedAlertingPanel })));
const AgentFleetAnalytics = lazy(() => import('@/components/vanguard/AgentFleetAnalytics').then(m => ({ default: m.AgentFleetAnalytics })));
const AgentReportGenerator = lazy(() => import('@/components/vanguard/AgentReportGenerator').then(m => ({ default: m.AgentReportGenerator })));

// New feature components
const ThreatIntelligence = lazy(() => import('@/components/vanguard/ThreatIntelligence').then(m => ({ default: m.ThreatIntelligence })));
const DarkWebMonitor = lazy(() => import('@/components/vanguard/DarkWebMonitor').then(m => ({ default: m.DarkWebMonitor })));
const UserBehaviorAnalytics = lazy(() => import('@/components/vanguard/UserBehaviorAnalytics').then(m => ({ default: m.UserBehaviorAnalytics })));
const SIEMDashboard = lazy(() => import('@/components/vanguard/SIEMDashboard').then(m => ({ default: m.SIEMDashboard })));
const PatchManagement = lazy(() => import('@/components/vanguard/PatchManagement').then(m => ({ default: m.PatchManagement })));
const BackupMonitoring = lazy(() => import('@/components/vanguard/BackupMonitoring').then(m => ({ default: m.BackupMonitoring })));
const NetworkTopologyMap = lazy(() => import('@/components/vanguard/NetworkTopologyMap').then(m => ({ default: m.NetworkTopologyMap })));
const AssetInventory = lazy(() => import('@/components/vanguard/AssetInventory').then(m => ({ default: m.AssetInventory })));
const ExecutiveDashboard = lazy(() => import('@/components/vanguard/ExecutiveDashboard').then(m => ({ default: m.ExecutiveDashboard })));
const NotificationHub = lazy(() => import('@/components/vanguard/notifications/NotificationHub').then(m => ({ default: m.NotificationHub })));
const AnalyticsHub = lazy(() => import('@/components/vanguard/analytics/AnalyticsHub').then(m => ({ default: m.AnalyticsHub })));
const ComplianceScorecard = lazy(() => import('@/components/vanguard/ComplianceScorecard').then(m => ({ default: m.ComplianceScorecard })));
const CustomReportBuilder = lazy(() => import('@/components/vanguard/CustomReportBuilder').then(m => ({ default: m.CustomReportBuilder })));
const MultiTenantManager = lazy(() => import('@/components/vanguard/MultiTenantManager').then(m => ({ default: m.MultiTenantManager })));
const APIMarketplace = lazy(() => import('@/components/vanguard/APIMarketplace').then(m => ({ default: m.APIMarketplace })));
const IncidentResponsePlaybooks = lazy(() => import('@/components/vanguard/IncidentResponsePlaybooks').then(m => ({ default: m.IncidentResponsePlaybooks })));
const VulnerabilityScanner = lazy(() => import('@/components/vanguard/VulnerabilityScanner').then(m => ({ default: m.VulnerabilityScanner })));
const VanguardSafePass = lazy(() => import('@/pages/vanguard/VanguardSafePass'));
const MSPSafePassProvisioning = lazy(() => import('@/components/safepass/MSPSafePassProvisioning'));
const VanguardSafeScan = lazy(() => import('@/pages/vanguard/VanguardSafeScan'));
const VanguardSuite = lazy(() => import('@/pages/vanguard/VanguardSuite'));
const VanguardSafeSuiteAdmin = lazy(() => import('@/pages/vanguard/VanguardSafeSuiteAdmin'));
const VanguardGettingStarted = lazy(() => import('@/pages/vanguard/VanguardGettingStarted'));
const VanguardHelpdesk = lazy(() => import('@/pages/vanguard/VanguardHelpdesk'));
const VanguardRMM = lazy(() => import('@/pages/vanguard/VanguardRMM'));
const VanguardPortalSettings = lazy(() => import('@/pages/vanguard/VanguardPortalSettings'));
const VanguardPortalDownload = lazy(() => import('@/pages/vanguard/VanguardPortalDownload'));
const VanguardAtlas = lazy(() => import('@/pages/vanguard/VanguardAtlas'));
const ReconProductPage = lazy(() => import('@/pages/vanguard/ReconProductPage'));
const ReconCheckoutPage = lazy(() => import('@/pages/vanguard/ReconCheckoutPage'));
const ReconOrderSuccessPage = lazy(() => import('@/pages/vanguard/ReconOrderSuccessPage'));

// AI Feature pages
const VanguardAIDashboard = lazy(() => import('@/pages/vanguard/VanguardAIDashboard'));
const VanguardAIKnowledge = lazy(() => import('@/pages/vanguard/VanguardAIKnowledge'));
const VanguardAISessions = lazy(() => import('@/pages/vanguard/VanguardAISessions'));
const VanguardAIAnalytics = lazy(() => import('@/pages/vanguard/VanguardAIAnalytics'));

// New module pages
const VanguardCortexHub = lazy(() => import('@/pages/vanguard/VanguardCortexHub'));
const VanguardMSPBilling = lazy(() => import('@/pages/vanguard/VanguardMSPBilling'));
const VanguardPartnerProgram = lazy(() => import('@/pages/vanguard/VanguardPartnerProgram'));
const WhiteLabelSettings = lazy(() => import('@/pages/vanguard/WhiteLabelSettings'));
const ResellerBillingPortal = lazy(() => import('@/pages/vanguard/ResellerBillingPortal'));
const MarketingKitGenerator = lazy(() => import('@/pages/vanguard/MarketingKitGenerator'));
const ClientProvisioning = lazy(() => import('@/pages/vanguard/ClientProvisioning'));

// Response module pages
const ResponseSLAPage = lazy(() => import('@/pages/vanguard/ResponseSLAPage'));
const ResponseWorkflowsPage = lazy(() => import('@/pages/vanguard/ResponseWorkflowsPage'));
const ResponseEmailPage = lazy(() => import('@/pages/vanguard/ResponseEmailPage'));
const ResponseTimeBillingPage = lazy(() => import('@/pages/vanguard/ResponseTimeBillingPage'));
const ResponseCSATPage = lazy(() => import('@/pages/vanguard/ResponseCSATPage'));

// Ledger module pages
const LedgerHelpdeskReportsPage = lazy(() => import('@/pages/vanguard/LedgerHelpdeskReportsPage'));
const LedgerSecurityPage = lazy(() => import('@/pages/vanguard/LedgerSecurityPage'));
const LedgerScheduledPage = lazy(() => import('@/pages/vanguard/LedgerScheduledPage'));
const LedgerCompliancePage = lazy(() => import('@/pages/vanguard/LedgerCompliancePage'));
const LedgerAttackPathsPage = lazy(() => import('@/pages/vanguard/LedgerAttackPathsPage'));

// Cortex module pages
const CortexSummarizerPage = lazy(() => import('@/pages/vanguard/CortexSummarizerPage'));
const CortexPatternsPage = lazy(() => import('@/pages/vanguard/CortexPatternsPage'));
const CortexKBGeneratorPage = lazy(() => import('@/pages/vanguard/CortexKBGeneratorPage'));
const CortexRouterPage = lazy(() => import('@/pages/vanguard/CortexRouterPage'));
const CortexAnalyticsPage = lazy(() => import('@/pages/vanguard/CortexAnalyticsPage'));
const CortexScreenToDocsPage = lazy(() => import('@/pages/vanguard/CortexScreenToDocsPage'));
const CortexAIToolsPage = lazy(() => import('@/pages/vanguard/CortexAIToolsPage'));
const VanguardSentinel = lazy(() => import('@/pages/vanguard/VanguardSentinel'));
const VanguardPursuitModule = lazy(() => import('@/pages/vanguard/VanguardPursuitModule'));
const VanguardComply = lazy(() => import('@/pages/vanguard/VanguardComply'));
const ReconPentestPage = lazy(() => import('@/pages/vanguard/ReconPentestPage'));
const ReconFindingsPage = lazy(() => import('@/pages/vanguard/ReconFindingsPage'));
const ReconSchedulesPage = lazy(() => import('@/pages/vanguard/ReconSchedulesPage'));
const VanguardAICommandCenter = lazy(() => import('@/pages/vanguard/VanguardAICommandCenter'));
const HorizonScriptsPage = lazy(() => import('@/pages/vanguard/HorizonScriptsPage'));
const HorizonAutomationPage = lazy(() => import('@/pages/vanguard/HorizonAutomationPage'));

// Advanced SLA and Automation pages
const ResponseSLAEnforcementPage = lazy(() => import('@/pages/vanguard/ResponseSLAEnforcementPage'));
const LedgerAdvancedAnalyticsPage = lazy(() => import('@/pages/vanguard/LedgerAdvancedAnalyticsPage'));
const CustomerPortalPreviewPage = lazy(() => import('@/pages/vanguard/CustomerPortalPreviewPage'));
const AITicketRoutingPage = lazy(() => import('@/pages/vanguard/AITicketRoutingPage'));
const EscalationEnginePage = lazy(() => import('@/pages/vanguard/EscalationEnginePage'));
const CSATSurveyPage = lazy(() => import('@/pages/vanguard/CSATSurveyPage'));
const ScheduledReportsPage = lazy(() => import('@/pages/vanguard/ScheduledReportsPage'));
const CortexSettingsPage = lazy(() => import('@/pages/vanguard/CortexSettingsPage'));

// New feature pages
const IntegrationsPage = lazy(() => import('@/pages/vanguard/IntegrationsPage'));
const ThemeEditorPage = lazy(() => import('@/pages/vanguard/ThemeEditorPage'));
const MobileInstallPage = lazy(() => import('@/pages/vanguard/MobileInstallPage'));
const KnowledgeBasePage = lazy(() => import('@/pages/vanguard/KnowledgeBasePage'));
const DispatchBoardPage = lazy(() => import('@/pages/vanguard/DispatchBoardPage'));
const OnCallSchedulePage = lazy(() => import('@/pages/vanguard/OnCallSchedulePage'));
const LiveChatConsolePage = lazy(() => import('@/pages/vanguard/LiveChatConsolePage'));
const VanguardSettingsPage = lazy(() => import('@/pages/vanguard/VanguardSettingsPage'));
const VanguardCoManagedPage = lazy(() => import('@/pages/vanguard/VanguardCoManagedPage'));

// Loading component for lazy-loaded pages
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Wrapper component for lazy loading with protection
const LazyProtectedPage = ({ component: Component }: { component: React.ComponentType }) => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ProtectedRoute>
);

// Lazy page without protection
const LazyPage = ({ component: Component }: { component: React.ComponentType }) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Gated page: requires subscription + optional addon
const GatedPage = ({ 
  component: Component, 
  requiredAddon, 
  featureName, 
  featureDescription 
}: { 
  component: React.ComponentType; 
  requiredAddon?: string; 
  featureName: string; 
  featureDescription?: string;
}) => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <VanguardFeatureGate 
        requiredAddon={requiredAddon} 
        featureName={featureName}
        featureDescription={featureDescription}
      >
        <Component />
      </VanguardFeatureGate>
    </Suspense>
  </ProtectedRoute>
);

// Export protected routes (for inside VanguardLayout)
export const getVanguardProtectedRoutes = () => [
  // VanguardDashboard (Command Center) is now the default landing page
  <Route key="vanguard-dashboard" index element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-dashboard-alias" path="dashboard" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-home" path="home" element={<LazyProtectedPage component={VanguardHome} />} />,
  <Route key="vanguard-devices" path="devices" element={<LazyProtectedPage component={VanguardDevicesPage} />} />,
  <Route key="vanguard-device-detail" path="devices/:deviceId" element={<LazyProtectedPage component={VanguardDeviceDetailPage} />} />,
  <Route key="vanguard-pi-detail" path="pi/:agentId" element={<LazyProtectedPage component={VanguardPiDetail} />} />,
  <Route key="vanguard-setup" path="setup" element={<LazyProtectedPage component={VanguardSetup} />} />,
  <Route key="vanguard-threats" path="threats" element={<GatedPage component={ThreatDetection} requiredAddon="pursuit-xdr" featureName="Threat Detection" featureDescription="Monitor, detect, and respond to security threats in real time across your managed fleet." />} />,
  <Route key="vanguard-soc" path="soc" element={<GatedPage component={VanguardSOC} requiredAddon="pursuit-xdr" featureName="SOC Dashboard" featureDescription="Unified security operations view for cross-client threat monitoring and incident response." />} />,
  <Route key="vanguard-pursuit-module" path="pursuit/:moduleId" element={<GatedPage component={VanguardPursuitModule} requiredAddon="pursuit-xdr" featureName="Pursuit XDR" featureDescription="Advanced extended detection and response capabilities for your security operations." />} />,
  <Route key="vanguard-pentest" path="pentest" element={<GatedPage component={VanguardPentest} requiredAddon="recon-pentest" featureName="Penetration Testing" featureDescription="Automated vulnerability assessment and penetration testing workflows." />} />,
  <Route key="vanguard-vulnscan" path="vulnscan" element={<GatedPage component={VulnerabilityScanner} requiredAddon="recon-pentest" featureName="Vulnerability Scanner" featureDescription="Continuous vulnerability scanning with compliance-ready remediation reporting." />} />,
  <Route key="vanguard-compliance" path="compliance" element={<LazyProtectedPage component={ComplianceAuditor} />} />,
  <Route key="vanguard-reports" path="reports" element={<LazyProtectedPage component={VanguardReports} />} />,
  <Route key="vanguard-remediation" path="remediation" element={<LazyProtectedPage component={RemediationAutomation} />} />,
  <Route key="vanguard-alerting" path="alerting" element={<LazyProtectedPage component={AlertingSettings} />} />,
  <Route key="vanguard-advanced-alerting" path="advanced-alerting" element={<LazyProtectedPage component={AdvancedAlertingPanel} />} />,
  <Route key="vanguard-agent-analytics" path="agent-analytics" element={<LazyProtectedPage component={AgentFleetAnalytics} />} />,
  <Route key="vanguard-scheduled-reports" path="scheduled-reports" element={<LazyProtectedPage component={AgentReportGenerator} />} />,
  // Navigation routes
  <Route key="vanguard-tickets" path="tickets" element={<LazyProtectedPage component={VanguardTickets} />} />,
  <Route key="vanguard-ticket-detail" path="tickets/:ticketId" element={<LazyProtectedPage component={VanguardTicketDetail} />} />,
  <Route key="vanguard-customers" path="customers" element={<LazyProtectedPage component={VanguardCustomers} />} />,
  <Route key="vanguard-customer-detail" path="customers/:customerId" element={<LazyProtectedPage component={VanguardCustomerDetail} />} />,
  <Route key="vanguard-alerts" path="alerts" element={<LazyProtectedPage component={VanguardAlerts} />} />,
  <Route key="vanguard-apps" path="apps" element={<LazyProtectedPage component={VanguardAppCenter} />} />,
  <Route key="vanguard-knowledge" path="knowledge" element={<LazyProtectedPage component={VanguardKnowledge} />} />,
  <Route key="vanguard-billing" path="billing" element={<LazyProtectedPage component={VanguardBilling} />} />,
  <Route key="vanguard-admin" path="admin" element={<LazyProtectedPage component={VanguardAdmin} />} />,
  <Route key="vanguard-referrals" path="referrals" element={<LazyProtectedPage component={VanguardReferrals} />} />,
  // PSA routes
  <Route key="vanguard-contracts" path="contracts" element={<LazyProtectedPage component={VanguardContracts} />} />,
  <Route key="vanguard-ai-tagging" path="ai-tagging" element={<LazyProtectedPage component={VanguardAITagging} />} />,
  // New feature routes
  <Route key="vanguard-threat-intel" path="threat-intel" element={<LazyProtectedPage component={ThreatIntelligence} />} />,
  <Route key="vanguard-dark-web" path="dark-web" element={<LazyProtectedPage component={DarkWebMonitor} />} />,
  <Route key="vanguard-uba" path="user-behavior" element={<LazyProtectedPage component={UserBehaviorAnalytics} />} />,
  <Route key="vanguard-siem" path="siem" element={<LazyProtectedPage component={SIEMDashboard} />} />,
  <Route key="vanguard-patches" path="patches" element={<LazyProtectedPage component={PatchManagement} />} />,
  <Route key="vanguard-backups" path="backups" element={<LazyProtectedPage component={BackupMonitoring} />} />,
  <Route key="vanguard-network" path="network" element={<LazyProtectedPage component={NetworkTopologyMap} />} />,
  <Route key="vanguard-assets" path="assets" element={<LazyProtectedPage component={AssetInventory} />} />,
  <Route key="vanguard-scripts" path="scripts" element={<LazyProtectedPage component={HorizonScriptsPage} />} />,
  <Route key="vanguard-automation" path="automation" element={<LazyProtectedPage component={HorizonAutomationPage} />} />,
  <Route key="vanguard-executive" path="executive" element={<LazyProtectedPage component={ExecutiveDashboard} />} />,
  <Route key="vanguard-analytics-hub" path="analytics" element={<LazyProtectedPage component={AnalyticsHub} />} />,
  <Route key="vanguard-scorecard" path="scorecard" element={<LazyProtectedPage component={ComplianceScorecard} />} />,
  <Route key="vanguard-report-builder" path="report-builder" element={<LazyProtectedPage component={CustomReportBuilder} />} />,
  <Route key="vanguard-tenants" path="tenants" element={<LazyProtectedPage component={MultiTenantManager} />} />,
  <Route key="vanguard-marketplace" path="marketplace" element={<LazyProtectedPage component={APIMarketplace} />} />,
  <Route key="vanguard-playbooks" path="playbooks" element={<LazyProtectedPage component={IncidentResponsePlaybooks} />} />,
  <Route key="vanguard-safepass" path="safepass" element={<LazyProtectedPage component={VanguardSafePass} />} />,
  <Route key="vanguard-safepass-admin" path="safepass-admin" element={<LazyProtectedPage component={MSPSafePassProvisioning} />} />,
  <Route key="vanguard-safescan" path="safescan" element={<LazyProtectedPage component={VanguardSafeScan} />} />,
  <Route key="vanguard-safesuite-admin" path="safesuite-admin" element={<LazyProtectedPage component={VanguardSafeSuiteAdmin} />} />,
  <Route key="vanguard-getting-started" path="getting-started" element={<LazyProtectedPage component={VanguardGettingStarted} />} />,
  <Route key="vanguard-helpdesk" path="helpdesk" element={<LazyProtectedPage component={VanguardHelpdesk} />} />,
  <Route key="vanguard-rmm" path="rmm" element={<LazyProtectedPage component={VanguardRMM} />} />,
  <Route key="vanguard-rmm-module" path="rmm/:moduleId" element={<LazyProtectedPage component={VanguardRMM} />} />,
  <Route key="vanguard-portal-settings" path="portal" element={<LazyProtectedPage component={VanguardPortalSettings} />} />,
  <Route key="vanguard-portal-download" path="portal/download" element={<LazyProtectedPage component={VanguardPortalDownload} />} />,
  <Route key="vanguard-atlas" path="atlas" element={<GatedPage component={VanguardAtlas} requiredAddon="atlas-docs" featureName="Atlas Documentation" featureDescription="Centralized IT documentation, runbooks, and knowledge management for your organization." />} />,
  // AI Feature routes
  <Route key="vanguard-ai-dashboard" path="ai-dashboard" element={<LazyProtectedPage component={VanguardAIDashboard} />} />,
  <Route key="vanguard-ai-knowledge" path="ai-knowledge" element={<LazyProtectedPage component={VanguardAIKnowledge} />} />,
  <Route key="vanguard-ai-sessions" path="ai-sessions" element={<LazyProtectedPage component={VanguardAISessions} />} />,
  <Route key="vanguard-ai-analytics" path="ai-analytics" element={<LazyProtectedPage component={VanguardAIAnalytics} />} />,
  <Route key="vanguard-ai-command" path="ai-command" element={<LazyProtectedPage component={VanguardAICommandCenter} />} />,
  // Cortex AI Hub (requires cortex-ai addon)
  <Route key="vanguard-cortex" path="cortex" element={<GatedPage component={VanguardCortexHub} requiredAddon="cortex-ai" featureName="Cortex AI Hub" featureDescription="AI-powered intelligence, automation, and decision support for IT operations." />} />,
  <Route key="vanguard-cortex-summarizer" path="cortex-summarizer" element={<GatedPage component={CortexSummarizerPage} requiredAddon="cortex-ai" featureName="AI Summarizer" featureDescription="Automatically summarize tickets, alerts, and operational data with AI." />} />,
  <Route key="vanguard-cortex-patterns" path="cortex-patterns" element={<GatedPage component={CortexPatternsPage} requiredAddon="cortex-ai" featureName="Pattern Detection" featureDescription="AI-driven pattern recognition across your operational data." />} />,
  <Route key="vanguard-cortex-kb" path="cortex-kb" element={<GatedPage component={CortexKBGeneratorPage} requiredAddon="cortex-ai" featureName="KB Generator" featureDescription="Automatically generate knowledge base articles from resolved tickets and incidents." />} />,
  <Route key="vanguard-cortex-router" path="cortex-router" element={<GatedPage component={CortexRouterPage} requiredAddon="cortex-ai" featureName="Smart Router" featureDescription="Intelligent ticket routing based on technician skills and workload." />} />,
  <Route key="vanguard-cortex-analytics" path="cortex-analytics" element={<GatedPage component={CortexAnalyticsPage} requiredAddon="cortex-ai" featureName="AI Analytics" featureDescription="AI-driven operational analytics and performance insights." />} />,
  <Route key="vanguard-cortex-screen-to-docs" path="cortex-screen-to-docs" element={<GatedPage component={CortexScreenToDocsPage} requiredAddon="cortex-ai" featureName="Screen to Docs" featureDescription="Convert screenshots and screen recordings into structured documentation." />} />,
  <Route key="vanguard-cortex-ai-tools" path="cortex-ai-tools" element={<GatedPage component={CortexAIToolsPage} requiredAddon="cortex-ai" featureName="AI Tools" featureDescription="Advanced AI utilities for IT operations and service delivery." />} />,
  <Route key="vanguard-cortex-settings" path="cortex-settings" element={<GatedPage component={CortexSettingsPage} requiredAddon="cortex-ai" featureName="Cortex Settings" featureDescription="Configure AI models, thresholds, and automation preferences." />} />,
  // Response module routes
  <Route key="vanguard-sla" path="sla" element={<LazyProtectedPage component={ResponseSLAPage} />} />,
  <Route key="vanguard-workflows" path="workflows" element={<LazyProtectedPage component={ResponseWorkflowsPage} />} />,
  <Route key="vanguard-email-integration" path="email-integration" element={<LazyProtectedPage component={ResponseEmailPage} />} />,
  <Route key="vanguard-time-billing" path="time-billing" element={<LazyProtectedPage component={ResponseTimeBillingPage} />} />,
  <Route key="vanguard-csat" path="csat" element={<LazyProtectedPage component={ResponseCSATPage} />} />,
  // Ledger module routes
  <Route key="vanguard-helpdesk-reports" path="helpdesk-reports" element={<LazyProtectedPage component={LedgerHelpdeskReportsPage} />} />,
  <Route key="vanguard-security-reports" path="security-reports" element={<LazyProtectedPage component={LedgerSecurityPage} />} />,
  <Route key="vanguard-scheduled-scans" path="scheduled-scans" element={<LazyProtectedPage component={LedgerScheduledPage} />} />,
  <Route key="vanguard-compliance-reports" path="compliance-reports" element={<LazyProtectedPage component={LedgerCompliancePage} />} />,
  <Route key="vanguard-attack-paths" path="attack-paths" element={<LazyProtectedPage component={LedgerAttackPathsPage} />} />,
  // MSP Billing Dashboard
  <Route key="vanguard-msp-billing" path="msp-billing" element={<LazyProtectedPage component={VanguardMSPBilling} />} />,
  <Route key="vanguard-partner-program" path="partner-program" element={<LazyProtectedPage component={VanguardPartnerProgram} />} />,
  // Reseller Program routes
  <Route key="vanguard-whitelabel" path="whitelabel" element={<LazyProtectedPage component={WhiteLabelSettings} />} />,
  <Route key="vanguard-reseller-billing" path="reseller-billing" element={<LazyProtectedPage component={ResellerBillingPortal} />} />,
  <Route key="vanguard-marketing-kit" path="marketing-kit" element={<LazyProtectedPage component={MarketingKitGenerator} />} />,
  <Route key="vanguard-client-provisioning" path="client-provisioning" element={<LazyProtectedPage component={ClientProvisioning} />} />,
  // Sentinel M365 Security Monitoring (requires sentinel-saas addon)
  <Route key="vanguard-sentinel" path="sentinel" element={<GatedPage component={VanguardSentinel} requiredAddon="sentinel-saas" featureName="Sentinel SaaS Security" featureDescription="Continuous security monitoring for Microsoft 365 and Google Workspace environments." />} />,
  <Route key="vanguard-sentinel-module" path="sentinel/:moduleId" element={<GatedPage component={VanguardSentinel} requiredAddon="sentinel-saas" featureName="Sentinel SaaS Security" featureDescription="Advanced SaaS security monitoring and threat intelligence." />} />,
  // Comply - Compliance & Audit Readiness (requires comply addon)
  <Route key="vanguard-comply" path="comply" element={<GatedPage component={VanguardComply} requiredAddon="comply" featureName="Comply" featureDescription="End-to-end compliance lifecycle management with automated evidence collection and audit-ready reporting." />} />,
  // Recon Pentest & Vulnerability Scanner (requires recon-pentest addon)
  <Route key="recon-pentest" path="pentest" element={<GatedPage component={ReconPentestPage} requiredAddon="recon-pentest" featureName="Recon Pentest" featureDescription="Automated vulnerability assessment and penetration testing workflows." />} />,
  <Route key="recon-findings" path="vuln-findings" element={<GatedPage component={ReconFindingsPage} requiredAddon="recon-pentest" featureName="Vulnerability Findings" featureDescription="Detailed vulnerability findings with severity scoring and remediation guidance." />} />,
  <Route key="recon-schedules" path="scan-schedules" element={<GatedPage component={ReconSchedulesPage} requiredAddon="recon-pentest" featureName="Scan Schedules" featureDescription="Schedule recurring vulnerability scans across your managed environments." />} />,
  // Advanced SLA, Analytics, Portal, and Automation routes
  <Route key="vanguard-sla-enforcement" path="sla-enforcement" element={<LazyProtectedPage component={ResponseSLAEnforcementPage} />} />,
  <Route key="vanguard-advanced-analytics" path="advanced-analytics" element={<LazyProtectedPage component={LedgerAdvancedAnalyticsPage} />} />,
  <Route key="vanguard-portal-preview" path="portal-preview" element={<LazyProtectedPage component={CustomerPortalPreviewPage} />} />,
  <Route key="vanguard-ai-routing" path="ai-routing" element={<LazyProtectedPage component={AITicketRoutingPage} />} />,
  <Route key="vanguard-escalation" path="escalation" element={<LazyProtectedPage component={EscalationEnginePage} />} />,
  <Route key="vanguard-csat-surveys" path="csat-surveys" element={<LazyProtectedPage component={CSATSurveyPage} />} />,
  <Route key="vanguard-scheduled-reports" path="report-scheduler" element={<LazyProtectedPage component={ScheduledReportsPage} />} />,
  // New feature routes
  <Route key="vanguard-integrations" path="integrations" element={<LazyProtectedPage component={IntegrationsPage} />} />,
  <Route key="vanguard-theme-editor" path="theme-editor" element={<LazyProtectedPage component={ThemeEditorPage} />} />,
  <Route key="vanguard-mobile-install" path="mobile-install" element={<LazyProtectedPage component={MobileInstallPage} />} />,
  <Route key="vanguard-kb-manager" path="kb-manager" element={<LazyProtectedPage component={KnowledgeBasePage} />} />,
  <Route key="vanguard-dispatch" path="dispatch" element={<LazyProtectedPage component={DispatchBoardPage} />} />,
  <Route key="vanguard-oncall" path="oncall" element={<LazyProtectedPage component={OnCallSchedulePage} />} />,
  <Route key="vanguard-live-chat" path="live-chat" element={<LazyProtectedPage component={LiveChatConsolePage} />} />,
  // Co-Managed IT Portal
  <Route key="vanguard-comanaged" path="comanaged" element={<LazyProtectedPage component={VanguardCoManagedPage} />} />,
  // Notification Hub
  <Route key="vanguard-notifications" path="notifications" element={<LazyProtectedPage component={NotificationHub} />} />,
  // Settings
  <Route key="vanguard-settings" path="settings" element={<LazyProtectedPage component={VanguardSettingsPage} />} />,
  // Recon Product routes (public - no auth required for purchasing)
  <Route key="vanguard-recon" path="recon" element={<LazyPage component={ReconProductPage} />} />,
  <Route key="vanguard-recon-checkout" path="recon/checkout" element={<LazyPage component={ReconCheckoutPage} />} />,
  <Route key="vanguard-recon-success" path="recon/success" element={<LazyPage component={ReconOrderSuccessPage} />} />,
  <Route key="vanguard-catchall" path="*" element={<Navigate to="/vanguard" replace />} />,
];

// Export public routes (landing, auth - outside VanguardLayout)
export const getVanguardPublicRoutes = () => [
  <Route key="vanguard-landing" path="/" element={<LazyPage component={VanguardProductPage} />} />,
  <Route key="vanguard-auth" path="/auth" element={<Navigate to="/auth?return=vanguard" replace />} />,
  <Route key="vanguard-suite" path="/suite" element={<LazyPage component={VanguardSuite} />} />,
  <Route key="vanguard-trust" path="/trust" element={<LazyPage component={VanguardTrustCenter} />} />,
];

// Legacy export for backwards compatibility
export const getVanguardRoutes = getVanguardProtectedRoutes;
