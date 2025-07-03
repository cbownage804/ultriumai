import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import DemoSection from "@/components/DemoSection";
import Integrations from "@/components/Integrations";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <DemoSection />
        <Integrations />
        <ContactSection />
      </main>
    </div>
  );
};

export default Index;
