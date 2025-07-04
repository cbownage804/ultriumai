import Navigation from "@/components/Navigation";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";

const DarkWebDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <DarkWebDemo />
      </div>
    </div>
  );
};

export default DarkWebDemoPage;