import Navigation from "@/components/Navigation";
import { AIStudioDashboardHub } from "@/components/ai-studio/AIStudioDashboardHub";
import { AIStudioSubNav } from "@/components/ai-studio/AIStudioSubNav";
import { AIStudioCommandPaletteGlobal } from "@/components/ai-studio/AIStudioCommandPaletteGlobal";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Navigate, useSearchParams } from "react-router-dom";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { toast } from "sonner";

const AIStudio = () => {
  const { user, loading: authLoading } = useAuth();
  const { totalRemaining, isLoading: creditsLoading } = useUserCredits();
  const [searchParams] = useSearchParams();

  // Handle checkout success
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Subscription activated! Your credits are now available.');
    }
  }, [searchParams]);

  // Loading
  if (authLoading || creditsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth?redirect=/ai-studio" replace />;
  }

  // Credits warning is now shown inline on the dashboard, not as a blocker

  return (
    <div className="min-h-screen bg-background pt-16">
      <Navigation />
      <AIStudioSubNav />
      <AIStudioCommandPaletteGlobal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <AIStudioDashboardHub />
      </div>
    </div>
  );
};

export default AIStudio;
