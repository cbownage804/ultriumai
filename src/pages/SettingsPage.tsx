/**
 * Global Settings Page
 */

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { GlobalSettingsHub } from '@/components/settings/GlobalSettingsHub';

const SettingsPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-20 pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <GlobalSettingsHub />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage;
