import Navigation from "@/components/Navigation";
import { SafePassDemo } from "@/components/demos/SafePassDemo";
import Footer from "@/components/Footer";

const SafePassDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <SafePassDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafePassDemoPage;