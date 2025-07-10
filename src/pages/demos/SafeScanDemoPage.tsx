import { SafeScanDemo } from "@/components/demos/SafeScanDemo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Bot, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SafeScanDemoPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold">SafeScan AI Platform</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-6">
              Revolutionary AI-powered security scanning that unifies email, document, and URL analysis with advanced threat intelligence and behavioral detection
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Threat Detection</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full">
                <Bot className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Behavioral Analysis</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-info/10 rounded-full">
                <Activity className="h-4 w-4 text-info" />
                <span className="text-sm font-medium">Real-Time Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        <SafeScanDemo />
      </div>
    </div>
  );
};

export default SafeScanDemoPage;