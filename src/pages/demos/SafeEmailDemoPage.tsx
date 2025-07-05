import Navigation from "@/components/Navigation";
import { SafeEmailDemo } from "@/components/demos/SafeEmailDemo";
import Footer from "@/components/Footer";

const SafeEmailDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeEmailDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafeEmailDemoPage;