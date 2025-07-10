import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ChatInterface from "@/components/ChatInterface";
import SettingsPage from "@/pages/SettingsPage";
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
import { SafeWebDashboard } from "@/components/SafeWebDashboard";
import { SafePassDashboard } from "@/components/shield/SafePassDashboard";
import { SafeMailDashboard } from "@/components/shield/SafeMailDashboard";
import { SafeNetDashboard } from "@/components/shield/SafeNetDashboard";
import { SecurityDashboard } from "@/components/shield/SecurityDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { UltriumGPTAssistant } from "@/components/UltriumGPTAssistant";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  // Determine which page to show based on the path
  const isSettingsPage = location.pathname.includes('/settings');
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
  const isSafeWebPage = location.pathname.includes('/safeweb');
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
  
  const getPageTitle = () => {
    if (isDashboardOverview) return "Dashboard";
    if (isUltriumGPTPage) return "UltriumGPT";
    if (isChatPage) return "Chat";
    if (isSettingsPage) return "Settings";
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
    if (isSafeWebPage) return "SafeWeb Dark Web Monitoring";
    if (isSafePassDashboard) return "SafePass";
    if (isSafeMailDashboard) return "SafeMail";
    if (isSafeNetDashboard) return "SafeNet";
    return "Dashboard";
  };

  const renderContent = () => {
    if (isDashboardOverview) return <DashboardOverview />;
    if (isUltriumGPTPage) return <div className="p-6"><UltriumGPTAssistant /></div>;
    if (isGPTDashboard) return <GPTDashboard />;
    if (isRMMPage) return <RMMDashboard />;
    if (isHelpdeskPage) return <HelpdeskDashboard />;
    if (isChatPage) return <ChatInterface />;
    if (isSettingsPage) return <SettingsPage />;
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
    if (isSafeWebPage) return <div className="p-6"><SafeWebDashboard /></div>;
    if (isSafePassDashboard) return <div className="p-6"><SafePassDashboard /></div>;
    if (isSafeMailDashboard) return <div className="p-6"><SafeMailDashboard /></div>;
    if (isSafeNetDashboard) return <div className="p-6"><SafeNetDashboard /></div>;
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
          <div className={`flex flex-1 flex-col ${!isSettingsPage ? 'h-[calc(100vh-4rem)]' : ''}`}>
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;