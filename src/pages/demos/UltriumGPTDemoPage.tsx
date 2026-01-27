import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton } from "@/components/demos/shared/DemoSkeleton";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

// Lazy load heavy demo component
const UltriumGPTFullDemo = lazy(() => 
  import("@/components/demos/UltriumGPTFullDemo")
);

const UltriumGPTDemoPage = () => {
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
        <Suspense fallback={<DemoSkeleton variant="cards" />}>
          <UltriumGPTFullDemo />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default UltriumGPTDemoPage;
