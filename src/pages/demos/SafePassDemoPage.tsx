import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton, DemoErrorBoundary } from "@/components/demos/shared";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { useWebVitals } from "@/hooks/useWebVitals";

// Lazy load heavy demo component
const SafePassDemo = lazy(() => 
  import("@/components/demos/SafePassDemo").then(module => ({ 
    default: module.SafePassDemo 
  }))
);

const SafePassDemoPage = () => {
  // Monitor Core Web Vitals
  useWebVitals({ 
    enableLogging: import.meta.env.DEV,
    sendToAnalytics: true 
  });

  return (
    <div className="min-h-screen bg-background">
      <ProductJsonLd
        name="SafePass Password Manager"
        description="Enterprise-grade password management with zero-knowledge encryption, breach monitoring, and team collaboration for businesses and MSPs."
        applicationCategory="SecurityApplication"
        category="Password Manager"
        offers={{
          price: "0",
          priceCurrency: "USD",
          availability: "InStock"
        }}
        aggregateRating={{
          ratingValue: 4.8,
          reviewCount: 150
        }}
      />
      <Navigation />
      <main className="pt-20" role="main" aria-label="SafePass Demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DemoErrorBoundary demoName="SafePass">
            <Suspense fallback={<DemoSkeleton variant="cards" />}>
              <SafePassDemo />
            </Suspense>
          </DemoErrorBoundary>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SafePassDemoPage;
