import Navigation from "@/components/Navigation";
import { CustomGPTBuilderDemo } from "@/components/demos/CustomGPTBuilderDemo";
import Footer from "@/components/Footer";

const CustomGPTBuilderDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <CustomGPTBuilderDemo />
      </div>
      <Footer />
    </div>
  );
};

export default CustomGPTBuilderDemoPage;
