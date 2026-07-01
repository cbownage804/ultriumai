import { FileText, Scale, Shield, AlertTriangle, Users, Zap, Lock, Gavel, CreditCard, Bot, Ban, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

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
              Last updated: January 30, 2026
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Effective Date: January 30, 2026
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
                By accessing or using UltriumAI services ("Services"), operated by Ultrium LLC ("Company," "we," "us," or "our"), you ("User," "you," or "your") agree to be bound by these Terms of Service ("Terms"). If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
              </p>
              <p className="text-muted-foreground">
                If you do not agree to these Terms, you may not access or use our Services.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium text-primary">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  These Terms constitute a legally binding agreement between you and Ultrium LLC. Please read them carefully.
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
                UltriumAI provides an AI-powered business platform including knowledge management, custom AI agent development, cybersecurity solutions, and business operations tools:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI Studio</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Custom AI agent creation and deployment</li>
                    <li>Knowledge base integration and RAG</li>
                    <li>API access and third-party integrations</li>
                    <li>Voice AI and conversational interfaces</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Vanguard (MSP/MSSP)</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Security operations center (SOC) platform</li>
                    <li>Remote monitoring and management (RMM)</li>
                    <li>Endpoint detection and response</li>
                    <li>Multi-tenant client management</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Wrayth Applications</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Vault – Password vault and management</li>
                    <li>Scan – Threat detection and scanning</li>
                    <li>Watch – Browser security and monitoring</li>
                    <li>Ray – Your AI security teammate</li>

                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Business Tools</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Helpdesk and ticketing system</li>
                    <li>Documentation and knowledge management</li>
                    <li>Billing and invoicing</li>
                    <li>Analytics and reporting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Registration */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Account Registration & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Account Creation</h4>
                <p className="text-sm text-muted-foreground">
                  To use our Services, you must create an account by providing accurate, complete, and current information. You may register using email/password or through OAuth providers (e.g., Google Sign-In). You must be at least 16 years old to create an account.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Account Security</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access or security breach</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>We strongly recommend enabling multi-factor authentication (MFA)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Organization Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  If you create an organization account, you may invite team members and assign roles. Organization administrators are responsible for managing user access and ensuring compliance with these Terms by all organization members.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Permitted Uses</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Use Services for lawful business and personal purposes</li>
                  <li>Create AI agents for legitimate customer service, productivity, and automation</li>
                  <li>Upload content you own or have rights to use</li>
                  <li>Integrate with third-party services via our APIs</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  Prohibited Uses
                </h4>
                <p className="text-sm text-muted-foreground mb-2">You agree NOT to use our Services to:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Violate any applicable laws, regulations, or third-party rights</li>
                  <li>Create AI agents that generate harmful, misleading, or illegal content</li>
                  <li>Impersonate individuals, organizations, or AI systems</li>
                  <li>Distribute malware, spam, or conduct phishing attacks</li>
                  <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                  <li>Circumvent security measures, rate limits, or usage restrictions</li>
                  <li>Use automated systems to scrape or extract data without permission</li>
                  <li>Engage in cryptocurrency mining or other resource-intensive activities</li>
                  <li>Generate content that exploits or harms minors</li>
                  <li>Create deepfakes or deceptive synthetic media without disclosure</li>
                </ul>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Violation of this Acceptable Use Policy may result in immediate suspension or termination of your account without refund.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI-Specific Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI-Specific Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">AI-Generated Content</h4>
                <p className="text-sm text-muted-foreground">
                  AI responses are generated based on training data and user inputs. While we implement safeguards, you acknowledge that:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>AI outputs may contain inaccuracies and should be verified independently</li>
                  <li>AI should not be used as a substitute for professional advice (legal, medical, financial)</li>
                  <li>You are responsible for reviewing and approving any AI-generated content before use</li>
                  <li>AI outputs may occasionally be unexpected, offensive, or inappropriate despite filters</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Custom AI Agents</h4>
                <p className="text-sm text-muted-foreground">
                  When you create custom AI agents using AI Studio, you retain ownership of your training data and configurations. However, you are responsible for ensuring your AI agents:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Comply with all applicable laws and these Terms</li>
                  <li>Do not infringe on third-party intellectual property rights</li>
                  <li>Include appropriate disclosures when interacting with end users</li>
                  <li>Are monitored for misuse and updated as needed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">AI Usage Limits</h4>
                <p className="text-sm text-muted-foreground">
                  AI features are subject to usage limits based on your subscription plan. Exceeding limits may result in reduced functionality, additional charges, or temporary throttling.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Subscription Plans</h4>
                <p className="text-sm text-muted-foreground">
                  We offer various subscription plans including free tiers and paid plans. Plan details, pricing, and features are available on our pricing page. Prices are subject to change with 30 days' notice for existing subscribers.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Billing & Payments</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Payments are processed securely through Stripe</li>
                  <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                  <li>You authorize us to charge your payment method on file for recurring fees</li>
                  <li>Failed payments may result in service suspension after a grace period</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Refunds</h4>
                <p className="text-sm text-muted-foreground">
                  We offer refunds in accordance with applicable law. For annual subscriptions, pro-rata refunds may be available within 30 days of purchase. Monthly subscriptions are generally non-refundable but may be cancelled at any time. Contact support@ultriumai.com for refund requests.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Taxes</h4>
                <p className="text-sm text-muted-foreground">
                  Prices do not include applicable taxes (sales tax, VAT, GST). You are responsible for any taxes associated with your use of the Services, except for taxes based on our net income.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Our Intellectual Property</h4>
                <p className="text-sm text-muted-foreground">
                  UltriumAI, our logos, and all software, content, and materials provided through the Services are owned by or licensed to Ultrium LLC. You may not copy, modify, distribute, or create derivative works without our written permission.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Your Content</h4>
                <p className="text-sm text-muted-foreground">
                  You retain ownership of content you upload to the Services. By uploading content, you grant us a limited, non-exclusive license to use, process, and store your content solely to provide the Services to you. This license terminates when you delete your content or close your account.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  If you provide suggestions, ideas, or feedback about our Services, we may use such feedback without restriction or compensation to you.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitations & Disclaimers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Disclaimers & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-amber-800 dark:text-amber-200">Disclaimer of Warranties</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Service Availability</h4>
                  <p className="text-sm text-muted-foreground">
                    While we strive for 99.9% uptime, we do not guarantee uninterrupted access to the Services. Scheduled maintenance will be announced in advance when possible. We are not liable for downtime, data loss, or interruptions.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security Tools Disclaimer</h4>
                  <p className="text-sm text-muted-foreground">
                    Our security tools (Vanguard, Wrayth) provide analysis, monitoring, and recommendations but do not guarantee complete threat prevention. No security solution can prevent all attacks. You remain responsible for your overall security posture.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Limitation of Liability</h4>
                  <p className="text-sm text-muted-foreground">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, ULTRIUM LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
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
                  <h4 className="font-medium mb-2">Termination by You</h4>
                  <p className="text-sm text-muted-foreground">
                    You may terminate your account at any time through your account settings or by contacting support. Upon termination, you will retain access until the end of your current billing period.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Termination by Us</h4>
                  <p className="text-sm text-muted-foreground">
                    We may suspend or terminate your account for violations of these Terms, illegal activity, non-payment, or if required by law. For non-breach terminations, we will provide 30 days' notice when possible.
                  </p>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <Lock className="h-4 w-4 inline mr-2" />
                  <strong>Data Export:</strong> You have 30 days after termination to export your data. After this period, data may be permanently deleted in accordance with our data retention policies.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Effect of Termination</h4>
                <p className="text-sm text-muted-foreground">
                  Upon termination: (1) your right to access the Services ends immediately; (2) we may delete your data after the export period; (3) provisions that by their nature should survive termination will survive (including intellectual property, disclaimers, limitations of liability, and dispute resolution).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dispute Resolution */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Governing Law & Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Governing Law</h4>
                <p className="text-sm text-muted-foreground">
                  These Terms are governed by the laws of the Commonwealth of Virginia, United States, without regard to conflict of law principles.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Informal Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  Before initiating formal proceedings, you agree to contact us at legal@ultriumai.com to attempt to resolve disputes informally. We will work in good faith to resolve issues within 30 days.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Binding Arbitration</h4>
                <p className="text-sm text-muted-foreground">
                  Any disputes that cannot be resolved informally shall be settled by binding arbitration in Richmond, Virginia, under the rules of the American Arbitration Association. You waive the right to participate in class actions or class-wide arbitration.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Exceptions</h4>
                <p className="text-sm text-muted-foreground">
                  Either party may seek injunctive relief in court for intellectual property infringement or unauthorized access to Services. Small claims court actions are also permitted.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Changes to These Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We may modify these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. For significant changes, we will provide additional notice via email or in-app notification at least 30 days before the changes take effect.
              </p>
              <p className="text-sm text-muted-foreground">
                Your continued use of the Services after the effective date of changes constitutes acceptance of the revised Terms. If you do not agree to the changes, you must stop using the Services and close your account.
              </p>
            </CardContent>
          </Card>

          {/* Contact & Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Legal Inquiries</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: legal@ultriumai.com<br />
                    General: support@ultriumai.com<br />
                    Phone: (804) 821-1410
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mailing Address</h4>
                  <p className="text-sm text-muted-foreground">
                    Ultrium LLC<br />
                    Attn: Legal Department<br />
                    Richmond, Virginia 23220<br />
                    United States
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Miscellaneous */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy and any service-specific terms, constitute the entire agreement between you and Ultrium LLC.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Severability:</strong> If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Waiver:</strong> Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Assignment:</strong> You may not assign or transfer these Terms without our consent. We may assign our rights and obligations without restriction.
              </p>
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
