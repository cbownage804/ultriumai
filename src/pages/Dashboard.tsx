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
import { ConversationManager } from "@/components/ConversationManager";
import { GPTDeploymentCenter } from "@/components/deployment/GPTDeploymentCenter";
import { APIKeyManager } from "@/components/APIKeyManager";
import { TeamCollaboration } from "@/components/TeamCollaboration";
import KnowledgeBase from "@/components/KnowledgeBase";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

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
  const isCustomGPTBuildPage = location.pathname.includes('/custom-gpts/build');
  const isCustomGPTPersonalizePage = location.pathname.includes('/custom-gpts/personalize');
  const isCustomGPTActionsPage = location.pathname.includes('/custom-gpts/actions');
  const isCustomGPTAskPage = location.pathname.includes('/custom-gpts/ask');
  const isCustomGPTAnalyzePage = location.pathname.includes('/custom-gpts/analyze');
  const isCustomGPTDeployPage = location.pathname.includes('/custom-gpts/deploy');
  const isAnalyticsPage = location.pathname.includes('/analytics');
  const isTemplatesPage = location.pathname.includes('/templates');
  const isAPIManagementPage = location.pathname.includes('/api-management');
  const isWhiteLabelPage = location.pathname.includes('/white-label');
  const isTeamManagementPage = location.pathname.includes('/teams');
  const isTeamAnalyticsPage = location.pathname.includes('/team-analytics');
  const isSecurityPage = location.pathname.includes('/security');
  const isConversationsPage = location.pathname.includes('/conversations');
  const isDeploymentPage = location.pathname.includes('/deployment');
  const isAPIKeysPage = location.pathname.includes('/api-keys');
  const isTeamCollabPage = location.pathname.includes('/team-collaboration');
  const isKnowledgeBasePage = location.pathname.includes('/knowledge-base');
  const isChatPage = location.pathname === '/dashboard/chat';
  const isDashboardOverview = location.pathname === '/dashboard';
  
  const getPageTitle = () => {
    if (isDashboardOverview) return "Dashboard";
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
    return "Dashboard";
  };

  const renderContent = () => {
    if (isDashboardOverview) return <DashboardOverview />;
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