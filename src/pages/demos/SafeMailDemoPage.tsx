import Navigation from "@/components/Navigation";
import { SafeMailDemo } from "@/components/demos/SafeMailDemo";
import Footer from "@/components/Footer";

const SafeMailDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <SafeMailDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeMailDemoPage;