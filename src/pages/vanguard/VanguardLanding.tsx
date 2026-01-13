import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Eye, 
  Shield,
  Monitor, 
  Cpu,
  ArrowRight,
  Lock,
  BarChart3,
  Zap,
  Network,
  Crosshair,
  Activity,
  Wifi,
  Bot,
  Layers,
  Globe,
  CheckCircle,
  Search,
  TrendingUp,
  Users,
  Star,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import vanguardLogo from '@/assets/vanguard-logo.png';

export default function VanguardLanding() {
  const navigate = useNavigate();

  const securityModules = [
    {
      icon: Eye,
      title: "SOC Operations Center",
      description: "24/7 security monitoring with AI-powered threat detection and automated incident response",
      features: ["Real-time threat monitoring", "Automated incident response", "Expert analyst support", "Custom alert rules"]
    },
    {
      icon: Search,
      title: "Advanced Threat Detection",
      description: "AI-powered vulnerability scanning and malware analysis with behavioral detection",
      features: ["Automated vulnerability scanning", "Malware analysis", "Behavioral monitoring", "Zero-day protection"]
    },
    {
      icon: Lock,
      title: "Identity & Access Management",
      description: "Enterprise password management with multi-factor authentication and privileged access controls",
      features: ["Password vault", "Multi-factor authentication", "Privileged access management", "Identity governance"]
    },
    {
      icon: Network,
      title: "Network Security",
      description: "Internal network scanning with distributed agents for comprehensive visibility",
      features: ["Network discovery", "Asset inventory", "Traffic analysis", "Intrusion detection"]
    },
    {
      icon: Target,
      title: "Penetration Testing",
      description: "Automated and manual penetration testing with detailed vulnerability assessments",
      features: ["Automated pen testing", "Manual testing", "Vulnerability assessment", "Remediation guidance"]
    },
    {
      icon: CheckCircle,
      title: "Compliance Management",
      description: "Automated compliance monitoring for SOC2, HIPAA, PCI-DSS, and other frameworks",
      features: ["Compliance monitoring", "Audit preparation", "Policy management", "Risk assessment"]
    }
  ];

  const v4Features = [
    {
      icon: Crosshair,
      title: 'Deception & Honeypots',
      description: 'Deploy decoy services to detect and analyze attacker behavior in real-time'
    },
    {
      icon: Activity,
      title: 'Continuous Monitoring',
      description: 'File integrity, process monitoring, and configuration drift detection'
    },
    {
      icon: Wifi,
      title: 'Traffic Analysis',
      description: 'Deep packet inspection, anomaly detection, and DNS tunneling prevention'
    },
    {
      icon: Layers,
      title: 'Agent Mesh Coordination',
      description: 'Distributed threat intelligence sharing across all deployed agents'
    },
    {
      icon: Bot,
      title: 'AI Security Copilot',
      description: 'Conversational AI for threat investigation and automated response'
    },
    {
      icon: Globe,
      title: 'Integration Connectors',
      description: 'Connect to SIEM, SOAR, and third-party security tools'
    }
  ];

  const stats = [
    { value: '99.97%', label: 'Detection Rate' },
    { value: '<0.1s', label: 'Response Time' },
    { value: '50K+', label: 'Endpoints Protected' },
    { value: '24/7', label: 'SOC Coverage' }
  ];

  const faqs = [
    {
      question: "What makes Ultrium Vanguard different from other security platforms?",
      answer: "Ultrium Vanguard combines multiple security disciplines into one AI-powered platform. Instead of managing separate tools for SOC operations, vulnerability scanning, penetration testing, and compliance, you get everything integrated with advanced AI analysis and automated response capabilities."
    },
    {
      question: "How quickly can we see results after deployment?",
      answer: "Most customers see immediate value within 24-48 hours. Our automated onboarding process deploys agents, configures monitoring, and begins threat detection immediately. Full ROI is typically realized within 30-60 days through reduced security incidents and improved compliance posture."
    },
    {
      question: "Do you replace our existing security tools?",
      answer: "Ultrium Vanguard can operate alongside your existing tools or replace them entirely. Our platform integrates with major SIEM systems, EDR solutions, and security frameworks. Many customers use us as their primary security operations platform while maintaining specialized tools for specific use cases."
    },
    {
      question: "What compliance frameworks does Vanguard support?",
      answer: "We support all major compliance frameworks including SOC2, HIPAA, PCI-DSS, ISO 27001, NIST, and GDPR. Our automated compliance monitoring continuously tracks your security posture and generates audit-ready reports for any framework."
    },
    {
      question: "Is Ultrium Vanguard suitable for MSPs?",
      answer: "Absolutely! Our multi-tenant architecture is specifically designed for MSPs and MSSPs. You get white-label branding, per-client reporting, automated billing integration, and comprehensive partner support including training and marketing materials."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vanguardLogo} alt="Vanguard" className="h-10 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm">Features</a>
            <a href="#modules" className="text-white/70 hover:text-white transition-colors text-sm">Security Modules</a>
            <a href="#pricing" className="text-white/70 hover:text-white transition-colors text-sm">Pricing</a>
            <a href="#faq" className="text-white/70 hover:text-white transition-colors text-sm">FAQ</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
            >
              <Lock className="h-4 w-4 mr-2" />
              Login to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-[#0a0a0f]" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border-cyan-500/30 mb-6">
              <Zap className="h-3 w-3 mr-1" />
              v4.0 Enterprise Plus - The Future of Cybersecurity
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Ultrium Vanguard
            </h1>
            
            <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-3xl mx-auto">
              The world's first <strong className="text-white">AI-powered unified cybersecurity platform</strong> that combines SOC operations, 
              threat detection, penetration testing, compliance, and identity management into one revolutionary solution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
              >
                <Shield className="h-5 w-5 mr-2" />
                Launch Vanguard Platform
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
              >
                <a href="https://ultriumai.com/demos">
                  <Play className="h-5 w-5 mr-2" />
                  Watch Live Demo
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Deploy in 24 hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span>SOC2 compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <span>50,000+ endpoints protected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Modules */}
      <section id="modules" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Six Security Disciplines. One Unified Platform.</h2>
            <p className="text-lg text-white/60 max-w-3xl mx-auto">
              Stop juggling multiple security tools. Ultrium Vanguard consolidates everything into one AI-powered platform 
              with seamless integration and unified reporting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityModules.map((module, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-4">
                    <module.icon className="h-7 w-7 text-cyan-400" />
                  </div>
                  <CardTitle className="text-white text-xl">{module.title}</CardTitle>
                  <CardDescription className="text-white/60">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* v4.0 Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 border-purple-500/30 mb-4">
              NEW IN v4.0
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Enterprise Plus Capabilities
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Advanced features for comprehensive security operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {v4Features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border-purple-500/20 hover:border-purple-500/40"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 mb-4">
                    <feature.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Vanguard */}
      <section className="py-24 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Security Teams Choose Vanguard</h2>
            <p className="text-lg text-white/60">
              The most advanced cybersecurity platform trusted by enterprises worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">10x Faster Response</h3>
              <p className="text-white/60">AI-powered automation reduces incident response time from hours to minutes with intelligent threat correlation.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">60% Cost Reduction</h3>
              <p className="text-white/60">Consolidate multiple security tools into one platform while improving coverage and reducing operational overhead.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">99.9% Uptime SLA</h3>
              <p className="text-white/60">Enterprise-grade reliability with 24/7 monitoring, redundant infrastructure, and guaranteed service levels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Simple, Per-Seat Pricing</h2>
            <p className="text-lg text-white/60 mb-4">
              Choose the plan that fits your organization. All pricing is per user per month.
            </p>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 rounded-full px-4 py-2">
              <span className="text-cyan-400 font-semibold">$999</span>
              <span className="text-white/60 text-sm">one-time onboarding fee (includes Vanguard agent hardware & setup)</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/5 border-white/10 hover:border-cyan-500/30 transition-all">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2 text-white">Starter</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$5</span>
                  <span className="text-white/60">/user/mo</span>
                </div>
                <CardDescription className="text-white/60">Essential security for small teams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {['SafePass™ password management', 'SafeScan™ threat scanning', 'Basic breach monitoring', 'Email support', 'Up to 25 users'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/suite')} 
                  variant="outline" 
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border-2 border-cyan-500/50 relative scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 border-0">
                Most Popular
              </Badge>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2 text-white">Professional</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$12</span>
                  <span className="text-white/60">/user/mo</span>
                </div>
                <CardDescription className="text-white/60">Complete security & operations suite</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {['Everything in Starter', 'SafeNet™ vulnerability scanning', 'Helpdesk™ ticketing', 'RMM™ remote management', 'Priority support', 'API access'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/suite')} 
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 hover:border-purple-500/30 transition-all">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2 text-white">Enterprise</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">$20</span>
                  <span className="text-white/60">/user/mo</span>
                </div>
                <CardDescription className="text-white/60">Full platform with AI capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {['Everything in Professional', 'UltriumGPT AI assistant', 'Dark web monitoring', 'SIEM integration', 'Dedicated account manager', 'SLA guarantee'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate('/suite')} 
                  variant="outline" 
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center text-white/50 mt-8 text-sm">
            All plans include 20% discount with annual billing. <a href="https://ultriumai.com/contact" className="text-cyan-400 hover:underline">Contact sales</a> for volume discounts.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
            <p className="text-lg text-white/60">
              Everything you need to know about Ultrium Vanguard
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-white/5 border border-white/10 rounded-lg px-6"
                >
                  <AccordionTrigger className="text-white hover:text-cyan-400 text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/60">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-[#0a0a0f]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Revolutionize Your Security?
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-3xl mx-auto">
            Join thousands of organizations that trust Ultrium Vanguard to protect their digital infrastructure. 
            Start your free trial today and experience the future of cybersecurity.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
            >
              <Shield className="h-5 w-5 mr-2" />
              Start Free Trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
            >
              <a href="https://ultriumai.com/contact">Schedule Demo</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={vanguardLogo} alt="Vanguard" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="https://ultriumai.com/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="https://ultriumai.com/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="https://ultriumai.com/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
