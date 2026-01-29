import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { UserBillingDashboard } from '@/components/billing/UserBillingDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

const BillingPage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?redirect=/billing" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground mb-8">Manage your subscription, view usage, and update payment methods.</p>
          <UserBillingDashboard product="safesuite" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BillingPage;