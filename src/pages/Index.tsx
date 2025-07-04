import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AboutSection from "@/components/AboutSection";
import WhoWeHelp from "@/components/WhoWeHelp";
import SecurityAppsSection from "@/components/SecurityAppsSection";
import DemoSection from "@/components/DemoSection";
import Integrations from "@/components/Integrations";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Remove automatic redirect to dashboard - let users view marketing page even when logged in

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <AboutSection />
        <WhoWeHelp />
        <Features />
        <SecurityAppsSection />
        <DemoSection />
        <Integrations />
        <ContactSection />
      </main>
    </div>
  );
};

export default Index;
