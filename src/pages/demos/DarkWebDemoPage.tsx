import Navigation from "@/components/Navigation";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";
import Footer from "@/components/Footer";

const DarkWebDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <DarkWebDemo />
      </div>
      <Footer />
    </div>
  );
};

export default DarkWebDemoPage;
