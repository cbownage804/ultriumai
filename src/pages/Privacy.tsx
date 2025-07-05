import { Shield, Eye, Lock, Database, Users, Globe, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Your privacy and data security are fundamental to our mission
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 5, 2025
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Our Commitment to Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                At UltriumAI, a division of Ultrium LLC, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered knowledge management platform and related services.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Key Principle: We never sell your personal data or use it for advertising purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Account registration information (name, email address, company details)</li>
                  <li>Contact information for support and billing purposes</li>
                  <li>Profile information you choose to provide</li>
                  <li>Communication preferences and subscription settings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Usage Information</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Platform usage patterns and feature interactions</li>
                  <li>Chat conversations and AI interactions (anonymized for improvement)</li>
                  <li>System performance and error logs</li>
                  <li>Device and browser information</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Business Data</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Documents and files uploaded to your knowledge base</li>
                  <li>Custom GPT configurations and training data</li>
                  <li>Team collaboration and sharing preferences</li>
                  <li>API usage and integration data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Questions about this Privacy Policy or our data practices?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Privacy Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: privacy@ultriumai.com<br />
                    Phone: (804) 821-1410<br />
                    Response Time: 48 hours
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mailing Address</h4>
                  <p className="text-sm text-muted-foreground">
                    Ultrium LLC<br />
                    Privacy Officer<br />
                    Richmond, Virginia<br />
                    United States
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button onClick={() => navigate('/')} variant="outline" className="mr-4">
              Back to Home
            </Button>
            <Button onClick={() => navigate('/terms')} variant="hero">
              Terms of Service
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;