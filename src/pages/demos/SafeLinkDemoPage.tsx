import Navigation from "@/components/Navigation";
import { SafeLinkDemo } from "@/components/demos/SafeLinkDemo";
import Footer from "@/components/Footer";

const SafeLinkDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeLinkDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeLinkDemoPage;