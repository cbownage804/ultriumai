import Navigation from "@/components/Navigation";
import { UltriumGPTDemo } from "@/components/demos/UltriumGPTDemo";

const UltriumGPTDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <UltriumGPTDemo />
      </div>
    </div>
  );
};

export default UltriumGPTDemoPage;