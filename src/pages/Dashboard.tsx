import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TrialBanner } from '@/components/TrialBanner';
import { SubscriptionRenewalNotice } from '@/components/SubscriptionRenewalNotice';
import { GracePeriodManager } from '@/components/GracePeriodManager';

import ProfilePage from "@/pages/ProfilePage";
import CustomGPTBuild from "@/components/CustomGPTBuild";
import CustomGPTPersonalize from "@/components/CustomGPTPersonalize";
import CustomGPTDeploy from "@/components/CustomGPTDeploy";
import CustomGPTAsk from "@/components/CustomGPTAsk";
import CustomGPTActions from "@/components/CustomGPTActions";
import CustomGPTAnalyze from "@/components/CustomGPTAnalyze";
import GPTWhiteLabel from "@/components/gpt/GPTWhiteLabel";
import APIManager from "@/components/APIManager";
import ConversationHistory from "@/components/ConversationHistory";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import GPTTemplatesMarketplace from "@/components/GPTTemplatesMarketplace";
import TeamManagement from "@/components/TeamManagement";
import TeamAnalytics from "@/components/TeamAnalytics";
import SecuritySettings from "@/components/SecuritySettings";
import { DashboardOverview } from "@/components/DashboardOverview";
import { GPTDashboard } from "@/components/dashboards/GPTDashboard";
import { ConversationManager } from "@/components/ConversationManager";
import { GPTDeploymentCenter } from "@/components/deployment/GPTDeploymentCenter";
import { APIKeyManager } from "@/components/APIKeyManager";
import { TeamCollaboration } from "@/components/TeamCollaboration";
import KnowledgeBase from "@/components/KnowledgeBase";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { StudioAssistant } from "@/components/StudioAssistant";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { CreditIndicator } from "@/components/credits/CreditIndicator";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding();

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
  const isChatPage = location.pathname === '/dashboard/chat' || location.pathname.includes('/gpt/chat');
  const isGPTDashboard = location.pathname === '/dashboard/gpt';
  const isDashboardOverview = location.pathname === '/dashboard';
  const isUltriumGPTPage = location.pathname === '/dashboard/ultrium-gpt';
  
  const getPageTitle = () => {
    if (isDashboardOverview) return "Dashboard";
    if (isUltriumGPTPage) return "UltriumGPT";
    if (isChatPage) return "Chat";
    if (isGPTDashboard) return "GPT Dashboard";
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
    if (isSecuritySettingsPage) return "Security Settings";
    if (isConversationsPage) return "Conversation Manager";
    if (isDeploymentPage) return "GPT Deployment";
    if (isAPIKeysPage) return "API Keys";
    if (isTeamCollabPage) return "Team Collaboration";
    if (isKnowledgeBasePage) return "Knowledge Base";
    
    return "Dashboard";
  };

  const renderContent = () => {
    if (isDashboardOverview) return <DashboardOverview />;
    if (isUltriumGPTPage) return <div className="p-6"><StudioAssistant /></div>;
    if (isGPTDashboard) return <GPTDashboard />;
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
    if (isWhiteLabelPage) return <div className="p-6"><GPTWhiteLabel /></div>;
    if (isTeamManagementPage) return <div className="p-6"><TeamManagement /></div>;
    if (isTeamAnalyticsPage) return <div className="p-6"><TeamAnalytics /></div>;
    if (isSecuritySettingsPage) return <div className="p-6"><SecuritySettings /></div>;
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
        <SidebarInset className="animate-fade-in">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 animate-slide-in-left backdrop-blur-xl bg-background/80">
            <SidebarTrigger className="-ml-1 hover-scale" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent animate-glow">{getPageTitle()}</h1>
            </div>
            <CreditIndicator variant="compact" />
            <NotificationCenter />
          </header>
          <div className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
            <div className="space-y-4 p-4 animate-fade-in-up stagger-1">
              <TrialBanner />
              <SubscriptionRenewalNotice />
              <GracePeriodManager />
            </div>
            <div className="animate-scale-in stagger-2">
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
