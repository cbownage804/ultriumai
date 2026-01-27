import Navigation from "@/components/Navigation";
import { VanguardDemo } from "@/components/demos/VanguardDemo";
import Footer from "@/components/Footer";

const VanguardDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <VanguardDemo />
      </div>
      <Footer />
    </div>
  );
};

export default VanguardDemoPage;
