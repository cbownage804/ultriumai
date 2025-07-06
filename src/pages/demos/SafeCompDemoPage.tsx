import { SafeCompDemo } from "@/components/demos/SafeCompDemo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SafeCompDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SafeCompDemo />
      <Footer />
    </div>
  );
};

export default SafeCompDemoPage;