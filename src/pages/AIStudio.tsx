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

  // No credits — show upgrade prompt (free users with 0 remaining)
  if (totalRemaining <= 0) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Navigation />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Out of Credits</CardTitle>
              <CardDescription>
                You've used all your available credits. Upgrade your plan or purchase a credit pack to continue building.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => window.location.href = '/pricing/ai-studio'}>
                View Plans & Pricing
              </Button>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
