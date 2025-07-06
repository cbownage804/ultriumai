import { SafeScoreDemo } from "@/components/demos/SafeScoreDemo";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SafeScoreDemoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SafeScoreDemo />
      <Footer />
    </div>
  );
};

export default SafeScoreDemoPage;