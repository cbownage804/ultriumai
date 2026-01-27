import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton, DemoErrorBoundary } from "@/components/demos/shared";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { useWebVitals } from "@/hooks/useWebVitals";

// Lazy load heavy demo component
const VanguardDemo = lazy(() => 
  import("@/components/demos/VanguardDemo").then(module => ({ 
    default: module.VanguardDemo 
  }))
);

const VanguardDemoPage = () => {
  // Monitor Core Web Vitals
  useWebVitals({ 
    enableLogging: import.meta.env.DEV,
    sendToAnalytics: true 
  });

  return (
    <div className="min-h-screen bg-background">
      <ProductJsonLd
        name="Vanguard MSP Platform"
        description="All-in-one MSP platform with RMM, PSA, SOC, compliance management, and AI-powered security operations for managed service providers."
        applicationCategory="BusinessApplication"
        category="MSP Platform"
        offers={{
          price: "0",
          priceCurrency: "USD",
          availability: "InStock"
        }}
        aggregateRating={{
          ratingValue: 4.7,
          reviewCount: 85
        }}
      />
      <Navigation />
      <main className="pt-20" role="main" aria-label="Vanguard Demo">
        <DemoErrorBoundary demoName="Vanguard">
          <Suspense fallback={<DemoSkeleton variant="dashboard" />}>
            <VanguardDemo />
          </Suspense>
        </DemoErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default VanguardDemoPage;
