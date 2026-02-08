import { useState } from "react";
import Navigation from "@/components/Navigation";
import { AIStudioDashboardHub } from "@/components/ai-studio/AIStudioDashboardHub";
import { AIStudioOnboardingWizard } from "@/components/ai-studio/AIStudioOnboardingWizard";
import { AIStudioSubNav } from "@/components/ai-studio/AIStudioSubNav";

const AIStudio = () => {
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("ai-studio-onboarding-dismissed");
  });

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("ai-studio-onboarding-dismissed", "true");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <AIStudioSubNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showOnboarding && (
          <AIStudioOnboardingWizard onDismiss={handleDismissOnboarding} />
        )}
        <AIStudioDashboardHub />
      </div>
    </div>
  );
};

export default AIStudio;
