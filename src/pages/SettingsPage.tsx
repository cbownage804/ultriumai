/**
 * Global Settings Page
 */

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { GlobalSettingsHub } from '@/components/settings/GlobalSettingsHub';
import { HeroSection } from '@/components/ui/hero-section';
import { Settings } from 'lucide-react';
import heroSettingsImage from '@/assets/hero-settings.jpg';

const SettingsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <HeroSection 
        imageSrc={heroSettingsImage}
        imageAlt="Settings Hub"
        overlayOpacity={0.85}
        className="min-h-[40vh] pt-20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 backdrop-blur-sm mb-6 animate-fade-in">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 animate-fade-in">
              Platform Settings
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in">
              Configure branding, defaults, integrations, and security preferences for your entire platform.
            </p>
          </div>
        </div>
      </HeroSection>
      
      <main className="flex-1 py-10 -mt-16 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalSettingsHub />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
