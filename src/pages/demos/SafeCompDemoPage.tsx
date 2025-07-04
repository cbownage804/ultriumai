import Navigation from "@/components/Navigation";
import { SafeCompDemo } from "@/components/demos/SafeCompDemo";

const SafeCompDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeCompDemo />
      </div>
    </div>
  );
};

export default SafeCompDemoPage;