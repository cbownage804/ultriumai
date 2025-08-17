import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle, Globe, Lock, Server, Eye } from "lucide-react";

const SecurityPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Security Policy</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive security measures protecting your data and privacy
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Last updated: January 5, 2025
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Security Commitment */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Our Security Commitment</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              At CyberGuard AI, security is not an afterthought—it's built into every aspect of our platform. 
              As a trusted cybersecurity solution serving businesses with sensitive data, we understand the critical 
              importance of maintaining the highest security standards.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center p-6 rounded-lg bg-primary/5 border">
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Security-First Design</h3>
                <p className="text-sm text-muted-foreground">
                  Built from the ground up with security in mind
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-primary/5 border">
                <Eye className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Continuous Monitoring</h3>
                <p className="text-sm text-muted-foreground">
                  24/7 threat detection and response capabilities
                </p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-primary/5 border">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Compliance Ready</h3>
                <p className="text-sm text-muted-foreground">
                  SOC 2, GDPR, and industry standards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Protection & Encryption */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Data Protection & Encryption</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="text-primary">In Transit</span>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">Data Transmission</span>
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    TLS 1.3 encryption for all data transmission
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Perfect Forward Secrecy (PFS) implementation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Certificate pinning and HSTS enforcement
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Encrypted API communications
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="text-primary">At Rest</span>
                  <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">Data Storage</span>
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    AES-256 encryption for all stored data
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Encrypted database and file storage
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Secure key management (HSM)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Regular key rotation protocols
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary mb-1">Zero-Knowledge Architecture</h4>
                  <p className="text-sm text-muted-foreground">
                    Your sensitive business data is encrypted before it reaches our servers. We cannot access your unencrypted 
                    data, ensuring complete privacy and confidentiality.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure & Network Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Server className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Infrastructure & Network Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-4">Cloud Infrastructure</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    SOC 2 Type II compliant hosting
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Multi-region data replication
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Automated backup and disaster recovery
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    99.9% uptime SLA guarantee
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-4">Network Protection</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Web Application Firewall (WAF)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    DDoS protection and mitigation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Network segmentation and isolation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    Intrusion detection and prevention
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance & Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Compliance & Certifications</CardTitle>
            <CardDescription>
              We maintain compliance with industry standards and regulations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">SOC 2 Type II</h4>
                <p className="text-xs text-muted-foreground">Security, availability, and confidentiality controls</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">GDPR Compliant</h4>
                <p className="text-xs text-muted-foreground">EU data protection regulation adherence</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-1">ISO 27001</h4>
                <p className="text-xs text-muted-foreground">Information security management standards</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPolicy;