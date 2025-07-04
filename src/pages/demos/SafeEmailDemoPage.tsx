import Navigation from "@/components/Navigation";
import { SafeEmailDemo } from "@/components/demos/SafeEmailDemo";

const SafeEmailDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <SafeEmailDemo />
      </div>
    </div>
  );
};

export default SafeEmailDemoPage;