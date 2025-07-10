import { SafeScanDemo } from "@/components/demos/SafeScanDemo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
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
              <h1 className="text-4xl font-bold">SafeScan Demo</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience comprehensive security scanning for emails, documents, and URLs in one unified platform
            </p>
          </div>
        </div>

        <SafeScanDemo />
      </div>
    </div>
  );
};

export default SafeScanDemoPage;