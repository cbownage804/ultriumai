import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ChatInterface from "@/components/ChatInterface";
import SettingsPage from "@/pages/SettingsPage";
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
  
  const getPageTitle = () => {
    if (isSettingsPage) return "Settings";
    if (isProfilePage) return "Profile"; 
    if (isHistoryPage) return "History";
    return "Chat";
  };

  const renderContent = () => {
    if (isSettingsPage) return <SettingsPage />;
    if (isProfilePage) return <div className="p-6">Profile page coming soon...</div>;
    if (isHistoryPage) return <div className="p-6">History page coming soon...</div>;
    return <ChatInterface />;
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