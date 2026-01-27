import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TicketingDemo from "@/components/demos/TicketingDemo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TicketingDemoPage = () => {
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
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
        
        <main className="pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TicketingDemo />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default TicketingDemoPage;