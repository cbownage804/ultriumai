import Navigation from "@/components/Navigation";
import { SafeLinkDemo } from "@/components/demos/SafeLinkDemo";

const SafeLinkDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeLinkDemo />
      </div>
    </div>
  );
};

export default SafeLinkDemoPage;