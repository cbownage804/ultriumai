import Navigation from "@/components/Navigation";
import { SafeCompDemo } from "@/components/demos/SafeCompDemo";
import Footer from "@/components/Footer";

const SafeCompDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeCompDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeCompDemoPage;