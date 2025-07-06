import Navigation from "@/components/Navigation";
import { SafeMailDemo } from "@/components/demos/SafeMailDemo";
import Footer from "@/components/Footer";

const SafeEmailDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <SafeEmailDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeEmailDemoPage;