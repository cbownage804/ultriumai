import Navigation from "@/components/Navigation";
import { SafeDocDemo } from "@/components/demos/SafeDocDemo";
import Footer from "@/components/Footer";

const SafeDocDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeDocDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeDocDemoPage;