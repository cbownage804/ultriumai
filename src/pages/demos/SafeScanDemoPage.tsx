import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton } from "@/components/demos/shared/DemoSkeleton";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

// Lazy load heavy demo component
const SafeScanDemo = lazy(() => 
  import("@/components/demos/SafeScanDemo").then(module => ({ 
    default: module.SafeScanDemo 
  }))
);

const SafeScanDemoPage = () => {
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
          <Suspense fallback={<DemoSkeleton variant="dashboard" />}>
            <SafeScanDemo />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SafeScanDemoPage;
