import { lazy, Suspense } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DemoSkeleton } from "@/components/demos/shared/DemoSkeleton";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

// Lazy load heavy demo component
const DarkWebDemo = lazy(() => 
  import("@/components/demos/DarkWebDemo").then(module => ({ 
    default: module.DarkWebDemo 
  }))
);

const DarkWebDemoPage = () => {
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
        <Suspense fallback={<DemoSkeleton variant="table" />}>
          <DarkWebDemo />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default DarkWebDemoPage;
