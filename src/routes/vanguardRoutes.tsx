import { Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Lazy load Vanguard pages for better performance
const VanguardLanding = lazy(() => import('@/pages/vanguard/VanguardLanding'));
const VanguardHome = lazy(() => import('@/pages/vanguard/VanguardHome'));
const VanguardDashboard = lazy(() => import('@/pages/VanguardDashboard'));
const VanguardDevices = lazy(() => import('@/pages/VanguardDevices'));
const VanguardDeviceDetail = lazy(() => import('@/pages/VanguardDeviceDetail'));
const VanguardSetup = lazy(() => import('@/pages/VanguardSetup'));
const VanguardAuthPage = lazy(() => import('@/pages/vanguard/VanguardAuthPage'));
const VanguardReports = lazy(() => import('@/pages/vanguard/VanguardReports'));

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
  <Route key="vanguard-home" index element={<LazyProtectedPage component={VanguardHome} />} />,
  <Route key="vanguard-dashboard" path="dashboard" element={<LazyProtectedPage component={VanguardDashboard} />} />,
  <Route key="vanguard-devices" path="devices" element={<LazyProtectedPage component={VanguardDevices} />} />,
  <Route key="vanguard-device-detail" path="devices/:deviceId" element={<LazyProtectedPage component={VanguardDeviceDetail} />} />,
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
  // New feature routes
  <Route key="vanguard-threat-intel" path="threat-intel" element={<LazyProtectedPage component={ThreatIntelligence} />} />,
  <Route key="vanguard-dark-web" path="dark-web" element={<LazyProtectedPage component={DarkWebMonitor} />} />,
  <Route key="vanguard-uba" path="user-behavior" element={<LazyProtectedPage component={UserBehaviorAnalytics} />} />,
  <Route key="vanguard-siem" path="siem" element={<LazyProtectedPage component={SIEMDashboard} />} />,
  <Route key="vanguard-patches" path="patches" element={<LazyProtectedPage component={PatchManagement} />} />,
  <Route key="vanguard-backups" path="backups" element={<LazyProtectedPage component={BackupMonitoring} />} />,
  <Route key="vanguard-network" path="network" element={<LazyProtectedPage component={NetworkTopologyMap} />} />,
  <Route key="vanguard-assets" path="assets" element={<LazyProtectedPage component={AssetInventory} />} />,
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
  <Route key="vanguard-catchall" path="*" element={<Navigate to="/vanguard" replace />} />,
];

// Export public routes (landing, auth - outside VanguardLayout)
export const getVanguardPublicRoutes = () => [
  <Route key="vanguard-landing" index element={<LazyPage component={VanguardLanding} />} />,
  <Route key="vanguard-auth" path="auth" element={<LazyPage component={VanguardAuthPage} />} />,
  <Route key="vanguard-suite" path="suite" element={<LazyPage component={VanguardSuite} />} />,
];

// Legacy export for backwards compatibility
export const getVanguardRoutes = getVanguardProtectedRoutes;
