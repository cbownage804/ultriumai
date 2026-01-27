import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton } from "@/components/demos/shared/DemoSkeleton";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

// Lazy load heavy demo component
const VanguardDemo = lazy(() => 
  import("@/components/demos/VanguardDemo").then(module => ({ 
    default: module.VanguardDemo 
  }))
);

const VanguardDemoPage = () => {
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
        <Suspense fallback={<DemoSkeleton variant="dashboard" />}>
          <VanguardDemo />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default VanguardDemoPage;
