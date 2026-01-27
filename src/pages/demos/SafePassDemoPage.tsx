import Navigation from "@/components/Navigation";
import { SafePassDemo } from "@/components/demos/SafePassDemo";
import Footer from "@/components/Footer";

const SafePassDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SafePassDemo />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SafePassDemoPage;
