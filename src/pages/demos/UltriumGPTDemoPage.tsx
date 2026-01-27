import Navigation from "@/components/Navigation";
import UltriumGPTFullDemo from "@/components/demos/UltriumGPTFullDemo";
import Footer from "@/components/Footer";

const UltriumGPTDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <UltriumGPTFullDemo />
      </div>
      <Footer />
    </div>
  );
};

export default UltriumGPTDemoPage;
