import { FileText, Scale, Shield, AlertTriangle, Users, Zap, Lock, Gavel } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Scale className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Legal agreement governing your use of UltriumAI services
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 5, 2025
            </p>
          </div>

          {/* Acceptance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                By accessing or using UltriumAI services, operated by Ultrium LLC, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use our services.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  These Terms constitute a legally binding agreement between you and Ultrium LLC.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services Description */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Description of Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                UltriumAI provides AI-powered knowledge management, custom GPT development, and cybersecurity solutions including:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Core Platform</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Custom GPT creation and management</li>
                    <li>Knowledge base integration</li>
                    <li>Team collaboration tools</li>
                    <li>API access and integrations</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Security Applications</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>SafeEmail™ threat detection</li>
                    <li>SafeLink™ URL scanning</li>
                    <li>SafeDoc™ document analysis</li>
                    <li>Additional security tools</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact & Terms Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Legal Contact</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: legal@ultriumai.com<br />
                    Phone: (804) 821-1410<br />
                    Address: Richmond, Virginia
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Terms Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    We may update these Terms periodically. Material changes will be communicated via email or platform notification 30 days in advance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="text-center">
            <Button onClick={() => navigate('/')} variant="outline" className="mr-4">
              Back to Home
            </Button>
            <Button onClick={() => navigate('/privacy')} variant="hero">
              Privacy Policy
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;