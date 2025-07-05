import { Shield, Lock, Eye, Server, Users, AlertTriangle, CheckCircle, Globe, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Security = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Security Policy</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Comprehensive security measures protecting your data and privacy
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 5, 2025
            </p>
          </div>

          {/* Security Commitment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Our Security Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                At UltriumAI, security is not an afterthought—it's built into every aspect of our platform. As a veteran-owned company serving MSPs and businesses with sensitive data, we understand the critical importance of maintaining the highest security standards.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Security-First Design</h4>
                  <p className="text-sm text-muted-foreground">Built from the ground up with security in mind</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Veteran-Owned</h4>
                  <p className="text-sm text-muted-foreground">Military-grade discipline and standards</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">Compliance Ready</h4>
                  <p className="text-sm text-muted-foreground">SOC 2, GDPR, and industry standards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Protection & Encryption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary">In Transit</Badge>
                    Data Transmission
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>TLS 1.3 encryption for all data transmission</li>
                    <li>Perfect Forward Secrecy (PFS) implementation</li>
                    <li>Certificate pinning and HSTS enforcement</li>
                    <li>Encrypted API communications</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="secondary">At Rest</Badge>
                    Data Storage
                  </h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>AES-256 encryption for all stored data</li>
                    <li>Encrypted database and file storage</li>
                    <li>Secure key management (HSM)</li>
                    <li>Regular key rotation protocols</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Zero-Knowledge Architecture
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your sensitive business data is encrypted before it reaches our servers. We cannot access your unencrypted data, ensuring complete privacy and confidentiality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure & Network Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Cloud Infrastructure</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>SOC 2 Type II compliant hosting</li>
                    <li>Multi-region data replication</li>
                    <li>99.9% uptime SLA guarantee</li>
                    <li>Automated disaster recovery</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Network Protection</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Web Application Firewall (WAF)</li>
                    <li>DDoS protection and mitigation</li>
                    <li>Intrusion Detection Systems (IDS)</li>
                    <li>Network segmentation and isolation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Monitoring & Alerting</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>24/7 security monitoring (SIEM)</li>
                    <li>Real-time threat detection</li>
                    <li>Automated incident response</li>
                    <li>Comprehensive audit logging</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Access Controls</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Zero-trust network architecture</li>
                    <li>Multi-factor authentication (MFA)</li>
                    <li>Role-based access controls (RBAC)</li>
                    <li>Privileged access management</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Application Security & Development
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Secure Development</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Security-by-design methodology</li>
                    <li>Regular code security reviews</li>
                    <li>Automated vulnerability scanning</li>
                    <li>Dependency security monitoring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Testing & Validation</h4>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Regular penetration testing</li>
                    <li>Static and dynamic code analysis</li>
                    <li>Security testing automation</li>
                    <li>Third-party security audits</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Vulnerability Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  We maintain a responsible disclosure program and respond to security vulnerabilities within 24 hours. Critical issues are addressed immediately with patches deployed within hours.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Certifications */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Compliance & Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">SOC 2 Type II</h4>
                  <p className="text-xs text-muted-foreground">Security & Availability</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">GDPR</h4>
                  <p className="text-xs text-muted-foreground">Privacy Regulation</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">CCPA</h4>
                  <p className="text-xs text-muted-foreground">California Privacy</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium">HIPAA Ready</h4>
                  <p className="text-xs text-muted-foreground">Healthcare Compliance</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Our security practices are regularly audited by independent third parties to ensure compliance with industry standards and regulations.
              </p>
            </CardContent>
          </Card>

          {/* Incident Response */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Incident Response & Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time monitoring and automated alerting systems
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Response</h4>
                  <p className="text-sm text-muted-foreground">
                    24/7 security team with defined escalation procedures
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Recovery</h4>
                  <p className="text-sm text-muted-foreground">
                    Automated backup systems and disaster recovery plans
                  </p>
                </div>
              </div>
              
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-medium">Communication Promise</h4>
                <p className="text-sm text-muted-foreground">
                  In the unlikely event of a security incident affecting your data, we will notify you within 24 hours and provide regular updates throughout the resolution process.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Best Practices */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Your Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                While we secure our platform, here are recommendations to maximize your account security:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Account Security</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Enable two-factor authentication (2FA)</li>
                    <li>Use strong, unique passwords</li>
                    <li>Regularly review account activity</li>
                    <li>Limit user access to necessary features</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Management</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Classify and label sensitive data</li>
                    <li>Implement data retention policies</li>
                    <li>Regular security training for team members</li>
                    <li>Monitor and audit data access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Contact */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Security Contact & Reporting</CardTitle>
              <CardDescription>
                Found a security issue? We take all reports seriously.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Security Team</h4>
                  <p className="text-sm text-muted-foreground">
                    Email: security@ultriumai.com<br />
                    Phone: (804) 821-1410<br />
                    Response Time: Within 24 hours
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Responsible Disclosure</h4>
                  <p className="text-sm text-muted-foreground">
                    We appreciate security researchers who report vulnerabilities responsibly. We commit to working with you to resolve issues promptly.
                  </p>
                </div>
              </div>
              
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">Bug Bounty Program</h4>
                <p className="text-sm text-muted-foreground">
                  We offer rewards for qualifying security vulnerabilities. Contact our security team for program details and submission guidelines.
                </p>
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

export default Security;