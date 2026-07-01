import { Shield, Eye, Lock, Database, Users, Globe, FileText, AlertTriangle, Bot, Server, Cookie } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

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
            <p className="text-xs text-muted-foreground mt-1">
              Effective Date: January 30, 2026
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
                At UltriumAI ("we," "us," or "our"), a division of Ultrium LLC, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered business platform and related services.
              </p>
              <p className="text-muted-foreground">
                This policy applies to all UltriumAI products and services, including:
              </p>
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">AI Studio</h4>
                  <p className="text-xs text-muted-foreground">Custom AI agent creation and deployment</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Vanguard</h4>
                  <p className="text-xs text-muted-foreground">MSP/MSSP security operations platform</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Wrayth</h4>
                  <p className="text-xs text-muted-foreground">Vault, Scan, and Watch, SafeAssist</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Business Tools</h4>
                  <p className="text-xs text-muted-foreground">Helpdesk, RMM, Documentation, and Billing</p>
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
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
                  <li>Account registration information (name, email address, phone number)</li>
                  <li>Organization and company details for business accounts</li>
                  <li>Billing information and payment details (processed securely via Stripe)</li>
                  <li>Profile information and preferences you choose to provide</li>
                  <li>Authentication data including OAuth tokens for Google Sign-In</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Usage & Technical Information</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Platform usage patterns, feature interactions, and session data</li>
                  <li>Device information (browser type, operating system, device identifiers)</li>
                  <li>IP address and approximate geographic location</li>
                  <li>Error logs, performance data, and diagnostic information</li>
                  <li>Cookies and similar tracking technologies (see Cookie Policy below)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">AI & Content Data</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Conversations with AI agents and chatbots you create or interact with</li>
                  <li>Documents, files, and knowledge base content you upload</li>
                  <li>Custom AI agent configurations, prompts, and training data</li>
                  <li>Generated responses and AI interaction history</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Security & Compliance Data</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Security scan results and vulnerability assessments (Vanguard, Scan)</li>
                  <li>Password vault data (encrypted with zero-knowledge architecture in Vault)</li>
                  <li>Endpoint monitoring data and RMM agent telemetry</li>
                  <li>Compliance audit logs and security event data</li>
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
                  <h4 className="font-medium mb-2">Service Provision & Operations</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Provide, maintain, and improve our AI platform and security services</li>
                    <li>Process transactions and manage your subscription and billing</li>
                    <li>Authenticate your identity and manage account access</li>
                    <li>Provide customer support, respond to inquiries, and resolve issues</li>
                    <li>Send service-related communications (updates, security alerts, billing notices)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Model Training & Improvement</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Train and improve AI models using anonymized and aggregated data</li>
                    <li>Enhance AI agent responses and accuracy</li>
                    <li>Develop new AI features and capabilities</li>
                    <li><strong>Note:</strong> Your private data is never used to train models for other customers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Security & Fraud Prevention</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Detect, prevent, and respond to security threats and attacks</li>
                    <li>Monitor for fraudulent activity and abuse of our services</li>
                    <li>Maintain platform integrity and enforce acceptable use policies</li>
                    <li>Conduct security audits and vulnerability assessments</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Legal & Compliance</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Comply with applicable laws, regulations, and legal processes</li>
                    <li>Respond to lawful requests from law enforcement and government agencies</li>
                    <li>Protect our legal rights and enforce our Terms of Service</li>
                    <li>Support regulatory compliance requirements (SOC 2, GDPR, HIPAA where applicable)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI-Specific Privacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI-Specific Privacy Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Your AI Data Stays Yours</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Custom AI agents you create in AI Studio and the data you provide to train them remain your intellectual property. We do not use your proprietary training data to improve AI services for other customers.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">AI Conversation Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Conversations with AI agents are stored securely and associated with your account. You can delete conversation history at any time. We may use anonymized conversation patterns to improve AI performance, but never your identifiable content.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Third-Party AI Providers</h4>
                  <p className="text-sm text-muted-foreground">
                    We partner with leading AI providers (OpenAI, Anthropic, and others) to power certain features. Data sent to these providers is subject to their privacy policies, and we select providers with strong privacy commitments. We do not share your personal information with these providers beyond what is necessary to process your requests.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Voice & Audio Data</h4>
                  <p className="text-sm text-muted-foreground">
                    If you use voice features powered by ElevenLabs or similar providers, audio data is processed in accordance with their privacy policies. We do not store voice recordings beyond what is necessary for transcription and response generation.
                  </p>
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
                  <h4 className="font-medium mb-2">Service Providers & Partners</h4>
                  <p className="text-sm text-muted-foreground">
                    We share information with trusted service providers who assist in platform operations:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li><strong>Supabase:</strong> Database hosting and authentication</li>
                    <li><strong>Stripe:</strong> Payment processing and billing</li>
                    <li><strong>OpenAI/Anthropic:</strong> AI model inference</li>
                    <li><strong>ElevenLabs:</strong> Voice synthesis features</li>
                    <li><strong>Resend:</strong> Transactional email delivery</li>
                    <li><strong>Google Analytics/Microsoft Clarity:</strong> Usage analytics (anonymized)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">MSP/MSSP Customers (Vanguard)</h4>
                  <p className="text-sm text-muted-foreground">
                    If you are a managed service provider (MSP) or MSSP using Vanguard, you may have access to data from your end-client organizations as part of service delivery. You are responsible for maintaining appropriate data processing agreements with your clients.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Legal Requirements</h4>
                  <p className="text-sm text-muted-foreground">
                    We may disclose information when required by law, court order, subpoena, or to protect the rights, property, or safety of our users, ourselves, or others.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Business Transfers</h4>
                  <p className="text-sm text-muted-foreground">
                    In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the business transaction. We will notify you of any such change and the choices you may have regarding your information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Data Security & Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Encryption & Security Measures</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Technical Safeguards</h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>TLS 1.3 encryption for all data in transit</li>
                      <li>AES-256 encryption for data at rest</li>
                      <li>Zero-knowledge encryption for Vault vault</li>
                      <li>Multi-factor authentication (MFA) support</li>
                      <li>Regular security audits and penetration testing</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Administrative Controls</h5>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      <li>Role-based access control (RBAC)</li>
                      <li>Employee background checks and training</li>
                      <li>Limited access on need-to-know basis</li>
                      <li>Comprehensive audit logging</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Retention</h4>
                <p className="text-sm text-muted-foreground">
                  We retain personal information only as long as necessary to provide services and comply with legal obligations:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Active account data:</strong> Retained while your account is active</li>
                  <li><strong>Conversation history:</strong> Retained until you delete it or close your account</li>
                  <li><strong>Billing records:</strong> 7 years for tax and legal compliance</li>
                  <li><strong>Security logs:</strong> 90 days for operational purposes, 1 year for compliance</li>
                  <li><strong>Deleted account data:</strong> Purged within 30 days, except as required by law</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                Cookies & Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Essential Cookies</h4>
                  <p className="text-xs text-muted-foreground">Required for authentication, security, and basic platform functionality. Cannot be disabled.</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Analytics Cookies</h4>
                  <p className="text-xs text-muted-foreground">Help us understand how you use our platform (Google Analytics, Microsoft Clarity). Can be disabled via cookie preferences.</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Preference Cookies</h4>
                  <p className="text-xs text-muted-foreground">Remember your settings, theme preferences, and language choices.</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                You can manage cookie preferences through your browser settings or our cookie consent banner.
              </p>
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
              <p className="text-sm text-muted-foreground">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Access & Portability</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Request a copy of your personal data</li>
                    <li>Export your content, AI agents, and configurations</li>
                    <li>Receive data in a machine-readable format</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Control & Deletion</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Delete your account and associated data</li>
                    <li>Restrict or object to certain processing activities</li>
                  </ul>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <h4 className="font-medium mb-2">California Residents (CCPA/CPRA)</h4>
                <p className="text-sm text-muted-foreground">
                  California residents have additional rights including the right to know what personal information is collected, the right to delete, and the right to opt-out of the sale of personal information. We do not sell personal information.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">EU/UK Residents (GDPR)</h4>
                <p className="text-sm text-muted-foreground">
                  If you are in the European Economic Area or United Kingdom, you have rights under GDPR including access, rectification, erasure, restriction, portability, and objection. Our legal basis for processing includes contract performance, legitimate interests, and consent where applicable.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To exercise your privacy rights, contact us at <strong>privacy@ultriumai.com</strong>. We will respond within 30 days and may require identity verification.
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
                UltriumAI is headquartered in the United States. If you access our services from outside the US, your information will be transferred to and processed in the United States and potentially other countries where our service providers operate.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transfer Safeguards</h4>
                <p className="text-sm text-muted-foreground">
                  For transfers from the EU/UK, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission and UK authorities. We also implement supplementary measures where necessary to ensure adequate protection.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                UltriumAI services are not intended for children under 16 years of age. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will take steps to delete such information promptly.
              </p>
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
                    General: support@ultriumai.com<br />
                    Phone: (804) 821-1410
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mailing Address</h4>
                  <p className="text-sm text-muted-foreground">
                    Ultrium LLC<br />
                    Attn: Privacy Officer<br />
                    Richmond, Virginia 23220<br />
                    United States
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Data Protection Officer</h4>
                <p className="text-sm text-muted-foreground">
                  For GDPR-related inquiries, you may also contact our Data Protection Officer at dpo@ultriumai.com.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. For significant changes, we will provide additional notice via email or in-app notification at least 30 days before the changes take effect. Your continued use of our services after changes become effective constitutes acceptance of the revised policy.
              </p>
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
