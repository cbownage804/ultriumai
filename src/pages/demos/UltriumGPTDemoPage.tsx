import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton, DemoErrorBoundary } from "@/components/demos/shared";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { useWebVitals } from "@/hooks/useWebVitals";

// Lazy load heavy demo component
const UltriumGPTFullDemo = lazy(() => 
  import("@/components/demos/UltriumGPTFullDemo")
);

const UltriumGPTDemoPage = () => {
  // Monitor Core Web Vitals
  useWebVitals({ 
    enableLogging: import.meta.env.DEV,
    sendToAnalytics: true 
  });

  return (
    <div className="min-h-screen bg-background">
      <ProductJsonLd
        name="AI Studio"
        description="Enterprise AI platform with custom GPT builders, multi-model orchestration, and governance controls for businesses and MSPs."
        applicationCategory="BusinessApplication"
        category="AI Platform"
        offers={{
          price: "0",
          priceCurrency: "USD",
          availability: "InStock"
        }}
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 320
        }}
      />
      <Navigation />
      <main className="pt-20" role="main" aria-label="AI Studio Demo">
        <DemoErrorBoundary demoName="AI Studio">
          <Suspense fallback={<DemoSkeleton variant="cards" />}>
            <UltriumGPTFullDemo />
          </Suspense>
        </DemoErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default UltriumGPTDemoPage;
