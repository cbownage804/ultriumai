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
              Last updated: January 30, 2026
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

          {/* How We Use Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Service Provision</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Provide and maintain our AI platform and security services</li>
                    <li>Process and respond to your requests and communications</li>
                    <li>Manage your account and billing</li>
                    <li>Provide customer support and technical assistance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Improvement & Development</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Improve our AI models and platform functionality (using anonymized data)</li>
                    <li>Develop new features and security capabilities</li>
                    <li>Conduct research and analytics to enhance user experience</li>
                    <li>Monitor and analyze usage patterns for optimization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security & Compliance</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Detect and prevent security threats and fraudulent activity</li>
                    <li>Comply with legal obligations and law enforcement requests</li>
                    <li>Enforce our Terms of Service and platform policies</li>
                    <li>Protect the rights and safety of our users and platform</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Data Sharing & Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  <Shield className="h-4 w-4 inline mr-2" />
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Service Providers</h4>
                  <p className="text-sm text-muted-foreground">
                    We may share information with trusted service providers who assist in platform operations, such as cloud hosting, payment processing, and email services. These providers are bound by strict confidentiality agreements.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Legal Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    We may disclose information when required by law, court order, or to protect the rights, property, or safety of our users and platform.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Transfers</h4>
                  <p className="text-sm text-muted-foreground">
                    In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business transaction, subject to equivalent privacy protections.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Security & Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Security Measures</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Technical Safeguards</h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>End-to-end encryption for data in transit</li>
                      <li>AES-256 encryption for data at rest</li>
                      <li>Multi-factor authentication</li>
                      <li>Regular security audits and penetration testing</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Administrative Controls</h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Employee background checks</li>
                      <li>Limited access on need-to-know basis</li>
                      <li>Regular security training</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Retention</h4>
                <p className="text-sm text-muted-foreground">
                  We retain personal information only as long as necessary to provide services and comply with legal obligations. Account data is typically retained for 7 years after account closure for business and legal purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Access & Portability</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Request a copy of your personal data</li>
                    <li>Export your content and configurations</li>
                    <li>Review data processing activities</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Control & Deletion</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Opt out of non-essential communications</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To exercise your privacy rights, contact us at privacy@ultriumai.com. We will respond within 30 days and may require identity verification.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Our services are hosted in the United States. If you are accessing our platform from outside the US, your information will be transferred to and processed in the United States, which may have different privacy laws than your jurisdiction.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">EU/UK Users</h4>
                <p className="text-sm text-muted-foreground">
                  For users in the European Union and United Kingdom, we ensure adequate protection through approved transfer mechanisms and maintain compliance with GDPR requirements.
                </p>
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