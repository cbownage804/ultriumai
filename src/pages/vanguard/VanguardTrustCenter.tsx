/**
 * Vanguard Trust Center
 * Security, compliance, and transparency page modeled after Atera's Trust Center
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Server, 
  Eye, 
  Key,
  FileText,
  Globe,
  Mail,
  ExternalLink,
  ChevronRight,
  Bell,
  Search,
  Cloud,
  Database,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Scan,
  Bug,
  Network,
  Users,
  Building2,
  AlertTriangle,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";

// Compliance certifications
const COMPLIANCE_CERTIFICATIONS = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'Annual audit of security, availability, and confidentiality controls',
    icon: ShieldCheck,
    status: 'certified',
    color: 'bg-emerald-500',
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    description: 'Information security management system certification',
    icon: Shield,
    status: 'in-progress',
    color: 'bg-amber-500',
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Healthcare data protection compliance with BAA available',
    icon: FileText,
    status: 'available',
    color: 'bg-cyan-500',
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'European data protection regulation compliance',
    icon: Globe,
    status: 'compliant',
    color: 'bg-purple-500',
  },
  {
    id: 'ccpa',
    name: 'CCPA',
    description: 'California Consumer Privacy Act compliance',
    icon: Users,
    status: 'compliant',
    color: 'bg-blue-500',
  },
];

// Security controls by category
const SECURITY_CONTROLS = {
  dataSecurity: {
    title: 'Data Security',
    icon: Database,
    controls: [
      { name: 'Data Encrypted At-Rest', description: 'AES-256 encryption for all stored data', enabled: true },
      { name: 'Data Encrypted In-Transit', description: 'TLS 1.3 for all data transmission', enabled: true },
      { name: 'Password Encryption', description: 'PBKDF2 with 600,000 iterations for password hashing', enabled: true },
      { name: 'Zero-Knowledge Architecture', description: 'SafePass uses client-side encryption - we never see your passwords', enabled: true },
      { name: 'Database Isolation', description: 'Row-level security (RLS) for complete data isolation', enabled: true },
    ],
  },
  infrastructureSecurity: {
    title: 'Infrastructure Security',
    icon: Server,
    controls: [
      { name: 'Cloud Infrastructure', description: 'Hosted on Supabase with enterprise-grade security', enabled: true },
      { name: 'Multi-tenant Architecture', description: 'Strict isolation between customer environments', enabled: true },
      { name: 'Availability & Redundancy', description: '99.9% uptime SLA with automatic failover', enabled: true },
      { name: 'DDoS Protection', description: 'Enterprise-grade DDoS mitigation', enabled: true },
      { name: 'Geographic Redundancy', description: 'Data replicated across multiple regions', enabled: true },
    ],
  },
  applicationSecurity: {
    title: 'Application Security',
    icon: ShieldAlert,
    controls: [
      { name: 'Secure SDLC', description: 'Security integrated into development lifecycle', enabled: true },
      { name: 'Penetration Testing', description: 'Regular third-party security assessments', enabled: true },
      { name: 'Vulnerability Scanning', description: 'Continuous automated vulnerability detection', enabled: true },
      { name: 'Code Review', description: 'All code changes reviewed before deployment', enabled: true },
      { name: 'Dependency Scanning', description: 'Automated scanning for vulnerable dependencies', enabled: true },
    ],
  },
  productSecurity: {
    title: 'Product Security',
    icon: Lock,
    controls: [
      { name: 'Multi-Factor Authentication', description: 'MFA support for all user accounts', enabled: true },
      { name: 'Single Sign-On (SSO)', description: 'SAML and OIDC integration available', enabled: true },
      { name: 'Role-Based Access Control', description: 'Granular permissions for all features', enabled: true },
      { name: 'Session Management', description: 'Automatic session timeout and secure cookies', enabled: true },
      { name: 'Audit Logging', description: 'Comprehensive activity logging for compliance', enabled: true },
      { name: 'API Security', description: 'Rate limiting, API keys, and OAuth 2.0', enabled: true },
    ],
  },
  aiSecurity: {
    title: 'AI Security',
    icon: Zap,
    controls: [
      { name: 'AI Model Isolation', description: 'Customer data never used to train models', enabled: true },
      { name: 'Data Control', description: 'Full control over what data AI can access', enabled: true },
      { name: 'Prompt Injection Protection', description: 'Guards against prompt manipulation attacks', enabled: true },
      { name: 'Output Filtering', description: 'AI responses filtered for sensitive data', enabled: true },
    ],
  },
  privacy: {
    title: 'Privacy',
    icon: Eye,
    controls: [
      { name: 'GDPR Compliance', description: 'Full compliance with EU data protection laws', enabled: true },
      { name: 'Data Processing Agreement', description: 'DPA available for all customers', enabled: true },
      { name: 'Data Retention Controls', description: 'Configurable data retention policies', enabled: true },
      { name: 'Right to Deletion', description: 'Complete data deletion on request', enabled: true },
      { name: 'Data Portability', description: 'Export all your data at any time', enabled: true },
    ],
  },
};

// Subprocessors
const SUBPROCESSORS = [
  { name: 'Supabase', purpose: 'Database and authentication services', location: 'United States' },
  { name: 'Stripe', purpose: 'Payment processing', location: 'United States' },
  { name: 'OpenAI', purpose: 'AI language model services', location: 'United States' },
  { name: 'Cloudflare', purpose: 'CDN and DDoS protection', location: 'Global' },
  { name: 'Resend', purpose: 'Transactional email delivery', location: 'United States' },
];

// FAQs
const FAQS = [
  {
    question: 'How is my data protected?',
    answer: 'All data is encrypted at rest using AES-256 and in transit using TLS 1.3. We implement row-level security to ensure complete data isolation between customers. For SafePass, we use zero-knowledge encryption where passwords are encrypted client-side before transmission.',
  },
  {
    question: 'Do you use my data to train AI models?',
    answer: 'No. Customer data is never used to train AI models. Your data remains private and is only used to provide you with our services. AI features process your data but do not retain it for training purposes.',
  },
  {
    question: 'What compliance certifications do you have?',
    answer: 'We are SOC 2 Type II certified and GDPR/CCPA compliant. We offer Business Associate Agreements (BAA) for HIPAA compliance. ISO 27001 certification is in progress.',
  },
  {
    question: 'How do you handle security incidents?',
    answer: 'We have a documented incident response plan with 24/7 monitoring. Security incidents are triaged immediately, with critical issues addressed within 1 hour. Affected customers are notified within 72 hours as required by GDPR.',
  },
  {
    question: 'Can I request a penetration test report?',
    answer: 'Yes. We conduct regular third-party penetration tests and can share summary reports with enterprise customers under NDA. Contact security@ultriumai.com to request access.',
  },
  {
    question: 'How do you handle data deletion requests?',
    answer: 'We honor all data deletion requests within 30 days. You can request complete deletion of your data at any time by contacting support or through your account settings.',
  },
];

// Security updates
const SECURITY_UPDATES = [
  {
    date: '2026-01-15',
    type: 'Enhancement',
    title: 'Enhanced MFA Options',
    description: 'Added support for hardware security keys (FIDO2/WebAuthn) for multi-factor authentication.',
  },
  {
    date: '2026-01-10',
    type: 'Security',
    title: 'Vulnerability Scanning Integration',
    description: 'Integrated automated vulnerability scanning into CI/CD pipeline for continuous security monitoring.',
  },
  {
    date: '2025-12-20',
    type: 'Compliance',
    title: 'SOC 2 Type II Renewal',
    description: 'Successfully completed annual SOC 2 Type II audit with no exceptions noted.',
  },
];

export default function VanguardTrustCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'certified':
      case 'compliant':
        return <Badge className="bg-emerald-500">Certified</Badge>;
      case 'in-progress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'available':
        return <Badge className="bg-cyan-500">Available</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Shield className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Vanguard Trust Center</h1>
              <p className="text-white/60">Security, Compliance & Transparency</p>
            </div>
          </div>
          
          <p className="text-lg text-white/70 max-w-3xl mt-6">
            At Vanguard, security is built into everything we do. Our Trust Center provides complete 
            transparency into how we protect your data, maintain compliance, and ensure the reliability 
            of our platform.
          </p>
          
          <div className="flex items-center gap-4 mt-8">
            <Button variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" asChild>
              <a href="mailto:security@ultriumai.com">
                <Mail className="h-4 w-4 mr-2" />
                security@ultriumai.com
              </a>
            </Button>
            <Button variant="outline" className="border-white/20 text-white/70 hover:bg-white/5" asChild>
              <Link to="/privacy">
                <FileText className="h-4 w-4 mr-2" />
                Privacy Policy
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-cyan-500/20 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="subprocessors">Subprocessors</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Compliance Section */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Compliance & Certifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {COMPLIANCE_CERTIFICATIONS.map((cert) => (
                  <Card key={cert.id} className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full ${cert.color}/20 flex items-center justify-center mb-3`}>
                        <cert.icon className={`h-6 w-6 ${cert.color.replace('bg-', 'text-')}`} />
                      </div>
                      <p className="font-semibold text-white text-sm">{cert.name}</p>
                      <div className="mt-2">
                        {getStatusBadge(cert.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Controls Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Security Controls</h2>
                <Button 
                  variant="link" 
                  className="text-cyan-400"
                  onClick={() => setActiveTab("controls")}
                >
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(SECURITY_CONTROLS).slice(0, 6).map(([key, category]) => (
                  <Card key={key} className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer" onClick={() => setActiveTab("controls")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                          <category.icon className="h-5 w-5 text-cyan-400" />
                        </div>
                        <h3 className="font-semibold text-white">{category.title}</h3>
                      </div>
                      <div className="space-y-2">
                        {category.controls.slice(0, 3).map((control) => (
                          <div key={control.name} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-white/70">{control.name}</span>
                          </div>
                        ))}
                        {category.controls.length > 3 && (
                          <p className="text-xs text-cyan-400 mt-2">
                            +{category.controls.length - 3} more controls
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Subprocessors Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Subprocessors</h2>
                <Button 
                  variant="link" 
                  className="text-cyan-400"
                  onClick={() => setActiveTab("subprocessors")}
                >
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUBPROCESSORS.slice(0, 3).map((sub) => (
                  <Card key={sub.name} className="bg-slate-900/50 border-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg">
                          <Cloud className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{sub.name}</p>
                          <p className="text-xs text-white/50">{sub.location}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/60 mt-3">{sub.purpose}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Updates */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Updates</h2>
                <Button 
                  variant="link" 
                  className="text-cyan-400"
                  onClick={() => setActiveTab("updates")}
                >
                  View all <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <Card className="bg-slate-900/50 border-cyan-500/20">
                <CardContent className="p-4">
                  {SECURITY_UPDATES.slice(0, 2).map((update, i) => (
                    <div key={i} className={`py-3 ${i > 0 ? 'border-t border-cyan-500/10' : ''}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                          {update.type}
                        </Badge>
                        <span className="text-xs text-white/40">{update.date}</span>
                      </div>
                      <p className="font-medium text-white">{update.title}</p>
                      <p className="text-sm text-white/60 mt-1">{update.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Controls Tab */}
          <TabsContent value="controls" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search controls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-cyan-500/20 text-white"
                />
              </div>
            </div>

            {Object.entries(SECURITY_CONTROLS).map(([key, category]) => (
              <Card key={key} className="bg-slate-900/50 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <category.icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.controls
                      .filter(c => 
                        searchQuery === '' || 
                        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.description.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((control) => (
                      <div key={control.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                        <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-white">{control.name}</p>
                          <p className="text-sm text-white/60">{control.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Subprocessors Tab */}
          <TabsContent value="subprocessors" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Third-Party Subprocessors</CardTitle>
                <CardDescription className="text-white/60">
                  These are the third-party service providers that may process your data as part of providing our services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SUBPROCESSORS.map((sub) => (
                    <div key={sub.name} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-700 rounded-lg">
                          <Cloud className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{sub.name}</p>
                          <p className="text-sm text-white/60">{sub.purpose}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        {sub.location}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {FAQS.map((faq, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-cyan-500/10">
                      <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-white/70">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Updates Tab */}
          <TabsContent value="updates" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Security Updates</CardTitle>
                  <Button variant="outline" className="border-cyan-500/20 text-cyan-400">
                    <Bell className="h-4 w-4 mr-2" />
                    Subscribe to updates
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SECURITY_UPDATES.map((update, i) => (
                    <div key={i} className="p-4 rounded-lg bg-slate-800/30 border-l-2 border-cyan-500">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          className={`
                            ${update.type === 'Security' ? 'bg-red-500' : ''}
                            ${update.type === 'Enhancement' ? 'bg-cyan-500' : ''}
                            ${update.type === 'Compliance' ? 'bg-emerald-500' : ''}
                          `}
                        >
                          {update.type}
                        </Badge>
                        <span className="text-sm text-white/50">{update.date}</span>
                      </div>
                      <h3 className="font-semibold text-white">{update.title}</h3>
                      <p className="text-sm text-white/60 mt-1">{update.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-cyan-500/10 border-cyan-500/30">
              <CardContent className="p-6">
                <p className="text-white/80 text-sm">
                  Content on this page is subject to change as updates are made to reflect current information. 
                  Please review this page periodically for the most up-to-date details, or subscribe to receive 
                  notifications regarding future updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
