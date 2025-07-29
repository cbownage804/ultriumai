import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

const AnalyticsPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <AnalyticsDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default AnalyticsPage;