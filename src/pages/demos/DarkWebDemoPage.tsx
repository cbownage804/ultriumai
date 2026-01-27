import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton, DemoErrorBoundary } from "@/components/demos/shared";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { useWebVitals } from "@/hooks/useWebVitals";

// Lazy load heavy demo component
const DarkWebDemo = lazy(() => 
  import("@/components/demos/DarkWebDemo").then(module => ({ 
    default: module.DarkWebDemo 
  }))
);

const DarkWebDemoPage = () => {
  // Monitor Core Web Vitals
  useWebVitals({ 
    enableLogging: import.meta.env.DEV,
    sendToAnalytics: true 
  });

  return (
    <div className="min-h-screen bg-background">
      <ProductJsonLd
        name="Dark Web Monitoring"
        description="Continuous dark web surveillance and breach detection to protect your organization from credential exposure and data leaks."
        applicationCategory="SecurityApplication"
        category="Threat Intelligence"
        offers={{
          price: "0",
          priceCurrency: "USD",
          availability: "InStock"
        }}
        aggregateRating={{
          ratingValue: 4.8,
          reviewCount: 95
        }}
      />
      <Navigation />
      <main className="pt-20" role="main" aria-label="Dark Web Monitoring Demo">
        <DemoErrorBoundary demoName="Dark Web Monitor">
          <Suspense fallback={<DemoSkeleton variant="table" />}>
            <DarkWebDemo />
          </Suspense>
        </DemoErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default DarkWebDemoPage;
