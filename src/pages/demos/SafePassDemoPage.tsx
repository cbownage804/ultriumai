import Navigation from "@/components/Navigation";
import { SafePassDemo } from "@/components/demos/SafePassDemo";

const SafePassDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafePassDemo />
      </div>
    </div>
  );
};

export default SafePassDemoPage;