import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BillingDashboard } from '@/components/billing/BillingDashboard';

const BillingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <BillingDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default BillingPage;