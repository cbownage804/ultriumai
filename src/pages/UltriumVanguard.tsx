import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Search, 
  Lock, 
  Eye, 
  Network, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
  Star,
  ArrowRight,
  Play
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { FAQSection } from '@/components/FAQSection';

const UltriumVanguard = () => {
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

  const pricingTiers = [
    {
      name: "Professional",
      price: "$99",
      period: "per month",
      description: "Perfect for growing businesses",
      features: [
        "Up to 50 endpoints",
        "Basic threat detection",
        "Password management",
        "Network monitoring", 
        "Email support",
        "Monthly reports"
      ]
    },
    {
      name: "Enterprise",
      price: "$299",
      period: "per month",
      description: "Advanced security for larger organizations",
      popular: true,
      features: [
        "Unlimited endpoints",
        "Advanced threat detection",
        "Full SOC operations",
        "Penetration testing",
        "Compliance management",
        "24/7 phone support",
        "Real-time dashboards",
        "Custom integrations"
      ]
    },
    {
      name: "MSP Partner",
      price: "Custom",
      period: "volume pricing",
      description: "Multi-tenant platform for service providers",
      features: [
        "White-label platform",
        "Multi-client management",
        "Branded reports",
        "API access",
        "Training & certification",
        "Partner support",
        "Revenue sharing",
        "Marketing materials"
      ]
    }
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 text-sm px-4 py-2">
            🚀 The Future of Cybersecurity Operations
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ultrium Vanguard
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
            The world's first <strong>AI-powered unified cybersecurity platform</strong> that combines SOC operations, 
            threat detection, penetration testing, compliance, and identity management into one revolutionary solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/vanguard">
              <Button size="lg" className="px-8 py-4 text-lg">
                <Shield className="mr-2 h-5 w-5" />
                Launch Vanguard Platform
              </Button>
            </Link>
            <Link to="/demos">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                <Play className="mr-2 h-5 w-5" />
                Watch Live Demo
              </Button>
            </Link>
          </div>
          <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Deploy in 24 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>SOC2 compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              <span>50,000+ endpoints protected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Security Modules */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Six Security Disciplines. One Unified Platform.</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stop juggling multiple security tools. Ultrium Vanguard consolidates everything into one AI-powered platform 
              with seamless integration and unified reporting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityModules.map((module, index) => (
              <Card key={index} className="text-center hover-scale border-2 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <module.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription className="text-base">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
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

      {/* Why Choose Vanguard */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Security Teams Choose Vanguard</h2>
            <p className="text-xl text-muted-foreground">
              The most advanced cybersecurity platform trusted by enterprises worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">10x Faster Response</h3>
              <p className="text-muted-foreground">AI-powered automation reduces incident response time from hours to minutes with intelligent threat correlation.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">60% Cost Reduction</h3>
              <p className="text-muted-foreground">Consolidate multiple security tools into one platform while improving coverage and reducing operational overhead.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">99.9% Uptime SLA</h3>
              <p className="text-muted-foreground">Enterprise-grade reliability with 24/7 monitoring, redundant infrastructure, and guaranteed service levels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent, Predictable Pricing</h2>
            <p className="text-xl text-muted-foreground">
              Choose the plan that fits your organization. Upgrade or downgrade anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card key={index} className={`text-center relative ${tier.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/{tier.period}</span>
                  </div>
                  <CardDescription className="text-base">{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3 text-left">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact">
                    <Button className={`w-full ${tier.popular ? '' : 'variant-outline'}`}>
                      {tier.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Revolutionize Your Security?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join thousands of organizations that trust Ultrium Vanguard to protect their digital infrastructure. 
            Start your free trial today and experience the future of cybersecurity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/vanguard">
              <Button size="lg" className="px-8 py-4 text-lg">
                <Shield className="mr-2 h-5 w-5" />
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={faqs} />
    </div>
  );
};

export default UltriumVanguard;