import Navigation from "@/components/Navigation";
import { UltriumGPTDemo } from "@/components/demos/UltriumGPTDemo";
import Footer from "@/components/Footer";

const UltriumGPTDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <UltriumGPTDemo />
      </div>
      <Footer />
    </div>
  );
};

export default UltriumGPTDemoPage;