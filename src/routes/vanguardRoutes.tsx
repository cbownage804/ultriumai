import { Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load Vanguard pages for better performance
const VanguardLanding = lazy(() => import('@/pages/vanguard/VanguardLanding'));
const VanguardHome = lazy(() => import('@/pages/vanguard/VanguardHome'));
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevicesPage = lazy(() => import('@/pages/VanguardDevicesPage'));
const VanguardDeviceDetailPage = lazy(() => import('@/pages/VanguardDeviceDetailPage'));
const VanguardPiDetail = lazy(() => import('@/pages/VanguardPiDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
const VanguardAuthPage = lazy(() => import('@/pages/vanguard/VanguardAuthPage'));
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
const VanguardSentinel = lazy(() => import('@/pages/vanguard/VanguardSentinel'));
const VanguardAICommandCenter = lazy(() => import('@/pages/vanguard/VanguardAICommandCenter'));
const HorizonScriptsPage = lazy(() => import('@/pages/vanguard/HorizonScriptsPage'));
const HorizonAutomationPage = lazy(() => import('@/pages/vanguard/HorizonAutomationPage'));

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
  <Route key="vanguard-threats" path="threats" element={<LazyProtectedPage component={ThreatDetection} />} />,
  <Route key="vanguard-soc" path="soc" element={<LazyProtectedPage component={VanguardSOC} />} />,
  <Route key="vanguard-pentest" path="pentest" element={<LazyProtectedPage component={VanguardPentest} />} />,
  <Route key="vanguard-vulnscan" path="vulnscan" element={<LazyProtectedPage component={VulnerabilityScanner} />} />,
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
  <Route key="vanguard-portal-settings" path="portal" element={<LazyProtectedPage component={VanguardPortalSettings} />} />,
  <Route key="vanguard-portal-download" path="portal/download" element={<LazyProtectedPage component={VanguardPortalDownload} />} />,
  <Route key="vanguard-atlas" path="atlas" element={<LazyProtectedPage component={VanguardAtlas} />} />,
  // AI Feature routes
  <Route key="vanguard-ai-dashboard" path="ai-dashboard" element={<LazyProtectedPage component={VanguardAIDashboard} />} />,
  <Route key="vanguard-ai-knowledge" path="ai-knowledge" element={<LazyProtectedPage component={VanguardAIKnowledge} />} />,
  <Route key="vanguard-ai-sessions" path="ai-sessions" element={<LazyProtectedPage component={VanguardAISessions} />} />,
  <Route key="vanguard-ai-analytics" path="ai-analytics" element={<LazyProtectedPage component={VanguardAIAnalytics} />} />,
  <Route key="vanguard-ai-command" path="ai-command" element={<LazyProtectedPage component={VanguardAICommandCenter} />} />,
  // Cortex AI Hub
  <Route key="vanguard-cortex" path="cortex" element={<LazyProtectedPage component={VanguardCortexHub} />} />,
  <Route key="vanguard-cortex-summarizer" path="cortex-summarizer" element={<LazyProtectedPage component={CortexSummarizerPage} />} />,
  <Route key="vanguard-cortex-patterns" path="cortex-patterns" element={<LazyProtectedPage component={CortexPatternsPage} />} />,
  <Route key="vanguard-cortex-kb" path="cortex-kb" element={<LazyProtectedPage component={CortexKBGeneratorPage} />} />,
  <Route key="vanguard-cortex-router" path="cortex-router" element={<LazyProtectedPage component={CortexRouterPage} />} />,
  <Route key="vanguard-cortex-analytics" path="cortex-analytics" element={<LazyProtectedPage component={CortexAnalyticsPage} />} />,
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
  // Sentinel M365 Security Monitoring
  <Route key="vanguard-sentinel" path="sentinel" element={<LazyProtectedPage component={VanguardSentinel} />} />,
  // Recon Product routes (public - no auth required for purchasing)
  <Route key="vanguard-recon" path="recon" element={<LazyPage component={ReconProductPage} />} />,
  <Route key="vanguard-recon-checkout" path="recon/checkout" element={<LazyPage component={ReconCheckoutPage} />} />,
  <Route key="vanguard-recon-success" path="recon/success" element={<LazyPage component={ReconOrderSuccessPage} />} />,
  <Route key="vanguard-catchall" path="*" element={<Navigate to="/vanguard" replace />} />,
];

// Export public routes (landing, auth - outside VanguardLayout)
export const getVanguardPublicRoutes = () => [
  <Route key="vanguard-landing" index element={<LazyPage component={VanguardLanding} />} />,
  <Route key="vanguard-auth" path="auth" element={<LazyPage component={VanguardAuthPage} />} />,
  <Route key="vanguard-suite" path="suite" element={<LazyPage component={VanguardSuite} />} />,
  <Route key="vanguard-trust" path="trust" element={<LazyPage component={VanguardTrustCenter} />} />,
];

// Legacy export for backwards compatibility
export const getVanguardRoutes = getVanguardProtectedRoutes;
