import { Shield, Eye, Lock, Database, Users, Globe, FileText, AlertTriangle, Bot, Server, Cookie, KeyRound } from "lucide-react";
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
              Your privacy and data security are fundamental to Wrayth
            </p>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 30, 2026</p>
            <p className="text-xs text-muted-foreground mt-1">Effective Date: January 30, 2026</p>
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
                Wrayth ("we," "us," or "our"), a product operated by Ultrium LLC, is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use Wrayth.
              </p>
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Vault</h4>
                  <p className="text-xs text-muted-foreground">Zero-knowledge encrypted password vault</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Scan</h4>
                  <p className="text-xs text-muted-foreground">Phishing, malware and URL analysis</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Watch</h4>
                  <p className="text-xs text-muted-foreground">Continuous breach and identity monitoring</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Ray AI</h4>
                  <p className="text-xs text-muted-foreground">Your AI security teammate</p>
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

          {/* Zero-Knowledge Vault */}
          <Card className="mb-8 border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Your Vault Stays Private
              </CardTitle>
              <CardDescription>
                Wrayth is built on a zero-knowledge architecture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When your Vault is locked:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Passwords remain encrypted using AES-256-GCM</li>
                <li>Wrayth cannot read your passwords</li>
                <li>Ray cannot inspect your credentials</li>
                <li>Passwords never leave your device in decrypted form</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Only after you unlock your Vault locally can Ray analyze password strength, reuse, and breach exposure — and that analysis happens on data derived on your device, not on your plaintext credentials.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Because we never see your master password, we cannot recover it. Losing your master password means losing access to your Vault contents.
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
                <h3 className="font-semibold mb-2">Account Information</h3>
                <p className="text-sm text-muted-foreground">Name, email, and authentication data used to sign in to Wrayth.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Identity Monitoring</h3>
                <p className="text-sm text-muted-foreground">Email addresses, usernames, and other identifiers you ask Watch to monitor for exposure in known breaches.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Vault Data</h3>
                <p className="text-sm text-muted-foreground">Encrypted password entries, metadata (titles, URLs), and vault settings. Ciphertext is stored on our infrastructure; plaintext contents never are.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Threat Scan Data</h3>
                <p className="text-sm text-muted-foreground">URLs, file hashes, or message excerpts you submit to Scan, plus the results returned by our threat intelligence providers.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Watch Monitoring</h3>
                <p className="text-sm text-muted-foreground">Alerts, exposure records, and monitoring history associated with the identifiers you have added.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Ray Conversations</h3>
                <p className="text-sm text-muted-foreground">Messages you send to Ray and the responses Ray returns. Used to power the conversation and, in anonymized form, to improve Ray's usefulness.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Device Information</h3>
                <p className="text-sm text-muted-foreground">Browser, operating system, device identifiers, IP address, and diagnostic data used for security and reliability.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Billing Information</h3>
                <p className="text-sm text-muted-foreground">Subscription plan, billing address, and payment metadata. Full card details are processed by Stripe; we do not store them.</p>
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
              <div>
                <h4 className="font-medium mb-2">Service Provision & Operations</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Provide, maintain, and improve Wrayth</li>
                  <li>Authenticate your identity and manage account access</li>
                  <li>Process transactions and manage your subscription</li>
                  <li>Send service-related communications (updates, security alerts, billing notices)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Ray & Threat Intelligence</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Deliver personalized security insights derived from your usage of Wrayth</li>
                  <li>Improve Ray using anonymized and aggregated interaction patterns</li>
                  <li><strong>Note:</strong> your Vault plaintext is never used to train models</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Security & Fraud Prevention</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Detect, prevent, and respond to threats and abuse</li>
                  <li>Maintain platform integrity and enforce acceptable use</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Legal & Compliance</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Comply with applicable laws, regulations, and legal processes</li>
                  <li>Respond to lawful requests from law enforcement</li>
                  <li>Protect our legal rights and enforce our Terms of Service</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Ray AI Privacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Ray AI Privacy Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Your Security Insights Stay Yours</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The security insights Ray generates about your posture belong to you. We do not share them with other customers or use them for advertising.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Ray Conversations</h4>
                <p className="text-sm text-muted-foreground">
                  Ray conversations are stored securely and associated with your account. You can delete conversation history at any time.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Third-Party AI Providers</h4>
                <p className="text-sm text-muted-foreground">
                  Ray uses leading AI providers to power certain features. Data sent to these providers is subject to their privacy policies; we select providers with strong privacy commitments and send only what is necessary to process your request.
                </p>
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
              <div>
                <h4 className="font-medium mb-2">Service Providers</h4>
                <p className="text-sm text-muted-foreground">
                  We share information with trusted service providers who help operate Wrayth:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Supabase:</strong> Database hosting and authentication</li>
                  <li><strong>Stripe:</strong> Payment processing and billing</li>
                  <li><strong>AI providers:</strong> Powering Ray's responses</li>
                  <li><strong>Threat intelligence providers:</strong> Powering Scan and Watch</li>
                  <li><strong>Resend:</strong> Transactional email delivery</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Legal Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  We may disclose information when required by law, court order, or to protect the rights, property, or safety of our users, ourselves, or others.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Business Transfers</h4>
                <p className="text-sm text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, information may be transferred as part of the transaction. We will notify you of any such change.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Data Security & Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Technical Safeguards</h5>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    <li>TLS 1.3 encryption for data in transit</li>
                    <li>AES-256-GCM encryption for Vault contents</li>
                    <li>Zero-knowledge architecture for the Vault</li>
                    <li>Multi-factor authentication (MFA) support</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Administrative Controls</h5>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                    <li>Role-based access control (RBAC)</li>
                    <li>Access on a need-to-know basis</li>
                    <li>Comprehensive audit logging</li>
                    <li>Incident response procedures</li>
                  </ul>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Retention</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><strong>Active account data:</strong> Retained while your account is active</li>
                  <li><strong>Ray conversations:</strong> Retained until you delete them or close your account</li>
                  <li><strong>Billing records:</strong> 7 years for tax and legal compliance</li>
                  <li><strong>Security logs:</strong> 90 days operational, up to 1 year for compliance</li>
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
              <div className="space-y-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Essential Cookies</h4>
                  <p className="text-xs text-muted-foreground">Required for authentication, security, and basic Wrayth functionality. Cannot be disabled.</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Analytics Cookies</h4>
                  <p className="text-xs text-muted-foreground">Help us understand how Wrayth is used. Can be disabled via cookie preferences.</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Preference Cookies</h4>
                  <p className="text-xs text-muted-foreground">Remember your settings, theme, and language choices.</p>
                </div>
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
              <p className="text-sm text-muted-foreground">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Access & Portability</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Request a copy of your personal data</li>
                    <li>Export your Vault and account data</li>
                    <li>Receive data in a machine-readable format</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Control & Deletion</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Delete your account and associated data</li>
                    <li>Restrict or object to certain processing</li>
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
                  If you are in the European Economic Area or United Kingdom, you have rights under GDPR including access, rectification, erasure, restriction, portability, and objection.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To exercise your privacy rights, contact us at <strong>privacy@wrayth.com</strong>. We will respond within 30 days and may require identity verification.
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
                Wrayth is operated from the United States. If you access Wrayth from outside the US, your information will be transferred to and processed in the United States and potentially other countries where our service providers operate. For EU/UK transfers we rely on Standard Contractual Clauses.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Wrayth is not intended for children under 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected data from a child under 16, we will take steps to delete such information promptly.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Questions about this Privacy Policy or our data practices?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Privacy Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Privacy: privacy@wrayth.com<br />
                    General: support@wrayth.com
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Legal Entity</h4>
                  <p className="text-sm text-muted-foreground">
                    Wrayth is a product operated by Ultrium LLC.<br />
                    Attn: Privacy Officer<br />
                    Richmond, Virginia 23220<br />
                    United States
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Data Protection Officer</h4>
                <p className="text-sm text-muted-foreground">
                  For GDPR-related inquiries, you may also contact our Data Protection Officer at dpo@wrayth.com.
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
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date.
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
