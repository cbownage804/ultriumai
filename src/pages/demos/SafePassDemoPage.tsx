import Navigation from "@/components/Navigation";
import { SafePassDemo } from "@/components/demos/SafePassDemo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const SafePassDemoPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        {/* Navigation Header */}
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/demos')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Demos
              </Button>
            </div>
          </div>
        </div>
        
        <SafePassDemo />
      </div>
      <Footer />
    </div>
  );
};

export default SafePassDemoPage;