import Navigation from "@/components/Navigation";
import { SafeDocDemo } from "@/components/demos/SafeDocDemo";

const SafeDocDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeDocDemo />
      </div>
    </div>
  );
};

export default SafeDocDemoPage;