import Navigation from "@/components/Navigation";
import { SafeNetDemo } from "@/components/demos/SafeNetDemo";

const SafeNetDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeNetDemo />
      </div>
    </div>
  );
};

export default SafeNetDemoPage;