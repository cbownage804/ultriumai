import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Chat</h1>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Welcome to UltriumGPT</h3>
                  <p className="text-muted-foreground">Start a conversation with AI</p>
                </div>
              </div>
              <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Chat History</h3>
                  <p className="text-muted-foreground">View previous conversations</p>
                </div>
              </div>
              <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Settings</h3>
                  <p className="text-muted-foreground">Customize your experience</p>
                </div>
              </div>
            </div>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-4">Ready to Chat</h2>
                  <p className="text-muted-foreground mb-6">
                    This is where your AI chat interface will be. You can start building 
                    your GPT functionality here.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Chat with AI assistants</p>
                    <p>• Save conversation history</p>
                    <p>• Customize AI personalities</p>
                    <p>• Manage your preferences</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;