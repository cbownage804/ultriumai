import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ChatInterface from "@/components/ChatInterface";
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionRenewalNotice } from '@/components/SubscriptionRenewalNotice';
import { GracePeriodManager } from '@/components/GracePeriodManager';


import ProfilePage from "@/pages/ProfilePage";
import CustomGPTBuild from "@/components/CustomGPTBuild";
import APIAccessConfig from "@/components/APIAccessConfig";
import CustomGPTPersonalize from "@/components/CustomGPTPersonalize";
import CustomGPTDeploy from "@/components/CustomGPTDeploy";
import CustomGPTAsk from "@/components/CustomGPTAsk";
import CustomGPTActions from "@/components/CustomGPTActions";
import CustomGPTAnalyze from "@/components/CustomGPTAnalyze";
import WhiteLabelCustomization from "@/components/WhiteLabelCustomization";
import APIManager from "@/components/APIManager";
import ConversationHistory from "@/components/ConversationHistory";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import GPTTemplatesMarketplace from "@/components/GPTTemplatesMarketplace";
import TeamManagement from "@/components/TeamManagement";
import TeamAnalytics from "@/components/TeamAnalytics";
import SecuritySettings from "@/components/SecuritySettings";
import { MSPNotifications } from "@/components/MSPNotifications";
import { MSPWorkflowAutomation } from "@/components/MSPWorkflowAutomation";
import { MSPQuickBooksIntegration } from "@/components/MSPQuickBooksIntegration";
import { MSPAPIManagement } from "@/components/MSPAPIManagement";
import { MSPClientPortal } from "@/components/MSPClientPortal";
import { MSPRealTimeEvents } from "@/components/MSPRealTimeEvents";
import { MSPSecurityHub } from "@/components/MSPSecurityHub";
import { MSPAssetManagement } from "@/components/MSPAssetManagement";
import { MSPIntegrationsHub } from "@/components/MSPIntegrationsHub";
import { DashboardOverview } from "@/components/DashboardOverview";
import { GPTDashboard } from "@/components/dashboards/GPTDashboard";
import { RMMDashboard } from "@/components/dashboards/RMMDashboard";
import { AntivirusDashboard } from "@/components/dashboards/AntivirusDashboard";
import { SafeMDRDashboard } from "@/components/dashboards/SafeMDRDashboard";
import { HelpdeskDashboard } from "@/components/dashboards/HelpdeskDashboard";
import { ConversationManager } from "@/components/ConversationManager";
import { GPTDeploymentCenter } from "@/components/deployment/GPTDeploymentCenter";
import { APIKeyManager } from "@/components/APIKeyManager";
import { TeamCollaboration } from "@/components/TeamCollaboration";
import KnowledgeBase from "@/components/KnowledgeBase";
import SecurityAppsMarketplace from "@/components/SecurityAppsMarketplace";
import { VideoUploadManager } from "@/components/VideoUploadManager";
import { SafePassApp } from "@/components/apps/SafePassApp";
import { SafeMailApp } from "@/components/apps/SafeMailApp";
import { SafeKBApp } from "@/components/apps/SafeKBApp";
import { SafeLinkApp } from "@/components/apps/SafeLinkApp";
import { SafeNetApp } from "@/components/apps/SafeNetApp";
import { SafeScanApp } from "@/components/apps/SafeScanApp";
import { SafeWebDashboard } from "@/components/SafeWebDashboard";
import { SafePassDashboard } from "@/components/shield/SafePassDashboard";
import { SafeMailDashboard } from "@/components/shield/SafeMailDashboard";
import { SafeNetDashboard } from "@/components/shield/SafeNetDashboard";
import { SecurityDashboard } from "@/components/shield/SecurityDashboard";
import { MSPRoleManagement } from "@/components/MSPRoleManagement";
import { MSPBusinessOperations } from "@/components/MSPBusinessOperations";
import { MSPAdvancedAnalytics } from "@/components/MSPAdvancedAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useRoleBasedRedirect } from "@/hooks/useRoleBasedRedirect";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { UltriumGPTAssistant } from "@/components/UltriumGPTAssistant";
import { AIIntelligenceHub } from "@/components/AIIntelligenceHub";
import { AIVoiceInterface } from "@/components/AIVoiceInterface";
import { AIVisionAnalyzer } from "@/components/AIVisionAnalyzer";


const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMSP, isMSSP, shouldRedirectToRole, getRedirectPath } = useRoleBasedRedirect();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Redirect MSP/MSSP users to their proper dashboards if they land on /dashboard
  useEffect(() => {
    if (!loading && user && shouldRedirectToRole() && location.pathname === '/dashboard') {
      if (isMSP || isMSSP) {
        const redirectPath = getRedirectPath();
        navigate(redirectPath);
      }
    }
  }, [loading, user, isMSP, isMSSP, shouldRedirectToRole, getRedirectPath, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show onboarding flow if needed
  if (!onboardingLoading && needsOnboarding && location.pathname === '/dashboard') {
    return <OnboardingFlow onComplete={completeOnboarding} />;
  }

  // Determine which page to show based on the path
  
  const isProfilePage = location.pathname.includes('/profile');
  const isHistoryPage = location.pathname.includes('/history');
  const isCustomGPTBuildPage = location.pathname.includes('/gpt/build');
  const isCustomGPTPersonalizePage = location.pathname.includes('/gpt/personalize');
  const isCustomGPTActionsPage = location.pathname.includes('/gpt/actions');
  const isCustomGPTAskPage = location.pathname.includes('/gpt/ask');
  const isCustomGPTAnalyzePage = location.pathname.includes('/gpt/analyze');
  const isCustomGPTDeployPage = location.pathname.includes('/gpt/deploy');
  const isAnalyticsPage = location.pathname.includes('/analytics');
  const isTemplatesPage = location.pathname.includes('/templates');
  const isAPIManagementPage = location.pathname.includes('/api-management');
  const isWhiteLabelPage = location.pathname.includes('/white-label');
  const isTeamManagementPage = location.pathname.includes('/teams');
  const isTeamAnalyticsPage = location.pathname.includes('/team-analytics');
  const isSecuritySettingsPage = location.pathname.includes('/security');
  const isConversationsPage = location.pathname.includes('/conversations');
  const isDeploymentPage = location.pathname.includes('/deployment');
  const isAPIKeysPage = location.pathname.includes('/api-keys');
  const isTeamCollabPage = location.pathname.includes('/team-collaboration');
  const isKnowledgeBasePage = location.pathname.includes('/knowledge-base');
  const isSecurityAppsPage = location.pathname.includes('/security-apps');
  const isVideoManagerPage = location.pathname.includes('/video-manager');
  const isSafePassPage = location.pathname.includes('/safepass');
  const isSafeMailPage = location.pathname.includes('/safemail');
  const isSafeKBPage = location.pathname.includes('/safekb');
  const isSafeDocPage = location.pathname.includes('/safedoc');
  const isSafeLinkPage = location.pathname.includes('/safelink');
  const isSafeNetPage = location.pathname.includes('/safenet');
  const isSafeIntelPage = location.pathname.includes('/safeintel');
  const isSafeScanEmbedPage = location.pathname.includes('/safescan-embed');
  const isChatPage = location.pathname === '/dashboard/chat';
  const isGPTDashboard = location.pathname === '/dashboard/gpt';
  const isRMMPage = location.pathname.includes('/rmm');
  const isHelpdeskPage = location.pathname.includes('/helpdesk');
  const isDashboardOverview = location.pathname === '/dashboard';
  const isUltriumGPTPage = location.pathname === '/dashboard/ultrium-gpt';
  const isSecurityPage = location.pathname === '/dashboard/security';
  const isSafePassDashboard = location.pathname.includes('/safepass') && !location.pathname.includes('/app');
  const isSafeMailDashboard = location.pathname.includes('/safemail') && !location.pathname.includes('/app');
  const isSafeNetDashboard = location.pathname.includes('/safenet') && !location.pathname.includes('/app');
  const isSafeScanPage = location.pathname.includes('/safescan');
  
  // MSP Feature Pages
  const isMSPNotificationsPage = location.pathname.includes('/msp/notifications');
  const isMSPWorkflowPage = location.pathname.includes('/msp/workflow');
  const isMSPQuickBooksPage = location.pathname.includes('/msp/quickbooks');
  const isMSPAPIManagementPage = location.pathname.includes('/msp/api-management');
  const isMSPClientPortalPage = location.pathname.includes('/msp/client-portal');
  const isMSPRoleManagementPage = location.pathname.includes('/msp/roles');
  const isMSPBusinessOpsPage = location.pathname.includes('/msp/business');
  const isMSPAdvancedAnalyticsPage = location.pathname.includes('/msp/analytics');
  const isAIIntelligenceHubPage = location.pathname.includes('/ai/intelligence');
  const isAIVoiceInterfacePage = location.pathname.includes('/ai/voice');
  const isAIVisionAnalyzerPage = location.pathname.includes('/ai/vision');
  
  const getPageTitle = () => {
    if (isDashboardOverview) return "Dashboard";
    if (isUltriumGPTPage) return "UltriumGPT";
    if (isChatPage) return "Chat";
    
    if (isProfilePage) return "Profile"; 
    if (isHistoryPage) return "History";
    if (isCustomGPTBuildPage) return "Build Custom GPT";
    if (isCustomGPTPersonalizePage) return "Personalize";
    if (isCustomGPTActionsPage) return "Actions";
    if (isCustomGPTAskPage) return "Ask";
    if (isCustomGPTDeployPage) return "Deploy";
    if (isCustomGPTAnalyzePage) return "Analyze";
    if (isAnalyticsPage) return "Analytics";
    if (isTemplatesPage) return "GPT Templates";
    if (isAPIManagementPage) return "API Management";
    if (isWhiteLabelPage) return "White-label Customization";
    if (isTeamManagementPage) return "Team Management";
    if (isTeamAnalyticsPage) return "Team Analytics";
    if (isSecurityPage) return "Security Settings";
    if (isConversationsPage) return "Conversation Manager";
    if (isDeploymentPage) return "GPT Deployment";
    if (isAPIKeysPage) return "API Keys";
    if (isTeamCollabPage) return "Team Collaboration";
    if (isKnowledgeBasePage) return "Knowledge Base";
    if (isSecurityAppsPage) return "Security Apps";
    if (isVideoManagerPage) return "Video Manager";
    if (isSafePassPage) return "SafePass Password Manager";
    if (isSafeMailPage) return "SafeMail Email Security";
    if (isSafeKBPage) return "SafeKB Knowledge Base";
    if (isSafeDocPage) return "SafeDoc Document Scanner";
    if (isSafeLinkPage) return "SafeLink URL Security";
    if (isSafeNetPage) return "SafeNet Network Security";
    if (isSafeIntelPage) return "SafeIntel Dark Web Monitoring";
    if (isSafeScanPage) return "SafeScan Security Scanner";
    if (isSafePassDashboard) return "SafePass";
    if (isSafeMailDashboard) return "SafeMail";
    if (isSafeNetDashboard) return "SafeNet";
    
    // MSP Feature Page Titles
    if (isMSPNotificationsPage) return "MSP Notifications";
    if (isMSPWorkflowPage) return "MSP Workflow Automation";
    if (isMSPQuickBooksPage) return "QuickBooks Integration";
    if (isMSPAPIManagementPage) return "MSP API Management";
    if (isMSPClientPortalPage) return "Client Portal Management";
    if (isMSPRoleManagementPage) return "Role Management";
    if (isMSPBusinessOpsPage) return "Business Operations";
    if (isMSPAdvancedAnalyticsPage) return "Advanced Analytics";
    if (isAIIntelligenceHubPage) return "AI Intelligence Hub";
    if (isAIVoiceInterfacePage) return "AI Voice Interface";
    if (isAIVisionAnalyzerPage) return "AI Vision Analyzer";
    
    return "Dashboard";
  };

  const renderContent = () => {
    if (isDashboardOverview) return <DashboardOverview />;
    if (isUltriumGPTPage) return <div className="p-6"><UltriumGPTAssistant /></div>;
    if (isGPTDashboard) return <GPTDashboard />;
    if (isRMMPage) return <RMMDashboard />;
    if (isHelpdeskPage) return <HelpdeskDashboard />;
    if (isChatPage) return <ChatInterface />;
    
    if (isProfilePage) return <ProfilePage />;
    if (isHistoryPage) return <ConversationHistory />;
    if (isCustomGPTBuildPage) return <div className="p-6"><CustomGPTBuild /></div>;
    if (isCustomGPTPersonalizePage) return <div className="p-6"><CustomGPTPersonalize /></div>;
    if (isCustomGPTActionsPage) return <div className="p-6"><CustomGPTActions /></div>;
    if (isCustomGPTAskPage) return <div className="p-6"><CustomGPTAsk /></div>;
    if (isCustomGPTDeployPage) return <div className="p-6"><CustomGPTDeploy /></div>;
    if (isCustomGPTAnalyzePage) return <div className="p-6"><CustomGPTAnalyze /></div>;
    if (isAnalyticsPage) return <div className="p-6"><AnalyticsDashboard /></div>;
    if (isTemplatesPage) return <div className="p-6"><GPTTemplatesMarketplace /></div>;
    if (isAPIManagementPage) return <div className="p-6"><APIManager /></div>;
    if (isWhiteLabelPage) return <div className="p-6"><WhiteLabelCustomization /></div>;
    if (isTeamManagementPage) return <div className="p-6"><TeamManagement /></div>;
    if (isTeamAnalyticsPage) return <div className="p-6"><TeamAnalytics /></div>;
    if (isSecurityPage) return <div className="p-6"><SecuritySettings /></div>;
    if (isConversationsPage) return <div className="p-6"><ConversationManager /></div>;
    if (isDeploymentPage) return <div className="p-6"><GPTDeploymentCenter /></div>;
    if (isAPIKeysPage) return <div className="p-6"><APIKeyManager /></div>;
    if (isTeamCollabPage) return <div className="p-6"><TeamCollaboration /></div>;
    if (isKnowledgeBasePage) return <div className="p-6"><KnowledgeBase /></div>;
    if (isSecurityAppsPage) return <div className="p-6"><SecurityAppsMarketplace /></div>;
    if (isVideoManagerPage) return <div className="p-6 flex justify-center"><VideoUploadManager /></div>;
    if (isSafePassPage) return <SafePassApp />;
    if (isSafeMailPage) return <SafeMailApp />;
    if (isSafeKBPage) return <SafeKBApp />;
    if (isSafeDocPage) return <SafeKBApp />;
    if (isSafeLinkPage) return <SafeLinkApp />;
    if (isSafeNetPage) return <SafeNetApp />;
    if (isSafeIntelPage) return <div className="p-6"><SafeWebDashboard /></div>;
    if (isSafeScanPage) return <SafeScanApp />;
    if (isSafeScanEmbedPage) return <SafeScanApp isWhiteLabeled={true} brandName="Security Scanner" />;
    if (isSafePassDashboard) return <div className="p-6"><SafePassDashboard /></div>;
    if (isSafeMailDashboard) return <div className="p-6"><SafeMailDashboard /></div>;
    if (isSafeNetDashboard) return <div className="p-6"><SafeNetApp /></div>;
    
    // MSP Feature Pages
    if (isMSPNotificationsPage) return <div className="p-6"><MSPNotifications mspId="temp-msp-id" /></div>;
    if (isMSPWorkflowPage) return <div className="p-6"><MSPWorkflowAutomation mspId="temp-msp-id" /></div>;
    if (isMSPQuickBooksPage) return <div className="p-6"><MSPQuickBooksIntegration mspId="temp-msp-id" /></div>;
    if (isMSPAPIManagementPage) return <div className="p-6"><MSPAPIManagement mspId="temp-msp-id" /></div>;
    if (isMSPClientPortalPage) return <div className="p-6"><MSPClientPortal /></div>;
    if (isMSPRoleManagementPage) return <div className="p-6"><MSPRoleManagement /></div>;
    if (isMSPBusinessOpsPage) return <div className="p-6"><MSPBusinessOperations /></div>;
    if (isMSPAdvancedAnalyticsPage) return <div className="p-6"><MSPAdvancedAnalytics /></div>;
    if (isAIIntelligenceHubPage) return <div className="p-6"><AIIntelligenceHub /></div>;
    if (isAIVoiceInterfacePage) return <div className="p-6"><AIVoiceInterface /></div>;
    if (isAIVisionAnalyzerPage) return <div className="p-6"><AIVisionAnalyzer /></div>;
    
    return <DashboardOverview />;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
            <div className="space-y-4 p-4">
              <TrialBanner />
              <SubscriptionRenewalNotice />
              <GracePeriodManager />
            </div>
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;