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
                    <li>SafeShield™ security platform</li>
                    <li>SafeScan™ threat detection</li>
                    <li>SafePass™ password security</li>
                    <li>Additional security tools</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <p className="text-sm text-muted-foreground">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Acceptable Use</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Use services only for lawful purposes</li>
                    <li>Do not attempt to breach security or access unauthorized systems</li>
                    <li>Do not transmit harmful, offensive, or illegal content</li>
                    <li>Respect intellectual property rights</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Accuracy</h4>
                  <p className="text-sm text-muted-foreground">
                    You warrant that all information provided is accurate and that you have the right to upload any content to our platform.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitations & Disclaimers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Limitations & Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-200">Service Availability</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  While we strive for 99.9% uptime, services are provided "as is" without guarantee of uninterrupted access. Scheduled maintenance will be announced in advance.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">AI-Generated Content</h4>
                  <p className="text-sm text-muted-foreground">
                    AI responses are generated based on training data and user inputs. While we implement safeguards, users should verify important information independently.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security Tools</h4>
                  <p className="text-sm text-muted-foreground">
                    Our security applications provide analysis and recommendations but do not guarantee complete threat prevention. Users remain responsible for their overall security posture.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Limitation of Liability</h4>
                  <p className="text-sm text-muted-foreground">
                    To the maximum extent permitted by law, Ultrium LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from use of our services.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">By You</h4>
                  <p className="text-sm text-muted-foreground">
                    You may terminate your account at any time through your account settings or by contacting support. Upon termination, you will retain access until the end of your billing period.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">By Us</h4>
                  <p className="text-sm text-muted-foreground">
                    We may suspend or terminate accounts for violations of these Terms, illegal activity, or non-payment. We will provide 30 days notice for non-breach terminations.
                  </p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Data Export: You have 30 days after termination to export your data. After this period, data may be permanently deleted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Governing Law & Disputes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Jurisdiction</h4>
                <p className="text-sm text-muted-foreground">
                  These Terms are governed by the laws of the Commonwealth of Virginia, United States, without regard to conflict of law principles.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Dispute Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  Any disputes arising from these Terms will be resolved through binding arbitration in Richmond, Virginia, except for injunctive relief which may be sought in court.
                </p>
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