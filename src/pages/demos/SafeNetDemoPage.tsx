import Navigation from "@/components/Navigation";
import { SafeNetDemo } from "@/components/demos/SafeNetDemo";
import Footer from "@/components/Footer";

const SafeNetDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeNetDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeNetDemoPage;