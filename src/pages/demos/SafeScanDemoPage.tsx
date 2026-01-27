import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton, DemoErrorBoundary } from "@/components/demos/shared";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { useWebVitals } from "@/hooks/useWebVitals";

// Lazy load heavy demo component
const SafeScanDemo = lazy(() => 
  import("@/components/demos/SafeScanDemo").then(module => ({ 
    default: module.SafeScanDemo 
  }))
);

const SafeScanDemoPage = () => {
  // Monitor Core Web Vitals
  useWebVitals({ 
    enableLogging: import.meta.env.DEV,
    sendToAnalytics: true 
  });

  return (
    <div className="min-h-screen bg-background">
      <ProductJsonLd
        name="SafeScan Vulnerability Scanner"
        description="AI-powered vulnerability scanning and threat detection for networks, endpoints, and cloud infrastructure."
        applicationCategory="SecurityApplication"
        category="Vulnerability Scanner"
        offers={{
          price: "0",
          priceCurrency: "USD",
          availability: "InStock"
        }}
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 200
        }}
      />
      <Navigation />
      <main className="pt-20" role="main" aria-label="SafeScan Demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DemoErrorBoundary demoName="SafeScan">
            <Suspense fallback={<DemoSkeleton variant="dashboard" />}>
              <SafeScanDemo />
            </Suspense>
          </DemoErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SafeScanDemoPage;
