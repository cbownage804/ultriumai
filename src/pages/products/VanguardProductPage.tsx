import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, Building2, Shield, Lock,
  BarChart3, FileCheck, AlertTriangle, Users, Zap, Check, Brain,
  Network, Search, Activity, Server, Workflow, Play
} from "lucide-react";
import { Link } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import safeopsLogo from '@/assets/logos/logo-safeops.png';
import safedeskLogo from '@/assets/logos/logo-safedesk.png';
import safedocLogo from '@/assets/logos/logo-safedoc.png';
import { SEOHead } from "@/components/SEOHead";
import { ProductDemoWrapper } from "@/components/demos/ProductDemoWrapper";
import { VanguardDemo } from "@/components/demos/VanguardDemo";
import { SafeTrackDemo } from "@/components/demos/SafeTrackDemo";

const VanguardProductPage = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Managed Service Providers",
      description: "Unify security and operations tooling into a single platform for your clients. Deliver SOC-style protection with MSP-friendly multi-tenancy and billing."
    },
    {
      icon: Users,
      title: "IT Operations Teams",
      description: "Streamline endpoint management, helpdesk, and threat detection in one place. Reduce tool sprawl while increasing operational visibility."
    },
    {
      icon: Shield,
      title: "Security-Conscious Organizations",
      description: "Meet compliance requirements with built-in audit trails, automated evidence collection, and enterprise-grade security controls."
    }
  ];

  const products = [
    {
      logo: safeopsLogo,
      title: "SafeOps™ RMM",
      description: "Remote monitoring and management with real-time endpoint visibility, automated patching, and proactive maintenance workflows.",
      bgColor: "bg-black"
    },
    {
      logo: safedeskLogo,
      title: "SafeDesk™ Helpdesk",
      description: "AI-powered IT service desk with smart ticket routing, SLA management, automated resolutions, and seamless escalation workflows.",
      bgColor: "bg-black"
    },
    {
      logo: safedocLogo,
      title: "SafeDoc™ Documentation",
      description: "Centralized IT documentation and knowledge base with AI-powered search, runbook automation, and client-facing portals.",
      bgColor: "bg-black"
    },
    {
      icon: AlertTriangle,
      title: "AI Threat Detection",
      description: "Machine learning-driven threat detection and response with real-time alerting, automated containment, and forensic analysis.",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: FileCheck,
      title: "Compliance Automation",
      description: "Built-in frameworks for SOC 2, HIPAA, PCI DSS, NIST, and CIS benchmarks with automated evidence collection and reporting.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      icon: BarChart3,
      title: "Security Analytics",
      description: "Comprehensive dashboards and reporting for security posture, operational metrics, and executive-level risk visibility.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: Lock,
      title: "Endpoint Protection",
      description: "Unified endpoint security with vulnerability scanning, configuration hardening, and continuous compliance monitoring.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  const capabilities = [
    {
      icon: Brain,
      title: "AI-Powered Copilot",
      description: "Intelligent assistance for threat analysis, ticket triage, and operational decision-making. AI that augments your team, not replaces it."
    },
    {
      icon: Network,
      title: "Unified Dashboard",
      description: "Single-pane-of-glass visibility across all security and operations data. No more switching between tools to understand your environment."
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      description: "Continuous monitoring of endpoints, networks, and cloud workloads with instant alerting and automated response capabilities."
    },
    {
      icon: Server,
      title: "Multi-Tenant Architecture",
      description: "Purpose-built for MSPs and enterprises with tenant isolation, role-based access, and client-level reporting."
    },
    {
      icon: Workflow,
      title: "Workflow Automation",
      description: "Automated playbooks for common scenarios — from patch deployment to incident response — reducing manual effort and human error."
    },
    {
      icon: Search,
      title: "Threat Intelligence",
      description: "Integrated threat feeds and dark web monitoring to identify risks before they become incidents. Proactive security, not reactive."
    }
  ];

  const differentiators = [
    "AI-driven insights across security and operations — not just dashboards",
    "Unified platform eliminates tool sprawl and integration headaches",
    "Built for MSPs with multi-tenant architecture and client billing visibility",
    "Real-time threat detection with automated response capabilities",
    "Integrated compliance tooling with automated evidence collection",
    "Predictable pricing model designed for service providers",
    "SOC-style security operations without the SOC-level investment",
    "Veteran-owned with a commitment to protecting American businesses"
  ];

  const useCases = [
    {
      title: "For MSPs Managing Client Environments",
      description: "Deploy unified security and operations across your entire client base. Get client-level visibility, automated billing metrics, and white-glove service delivery tools."
    },
    {
      title: "For IT Teams in Regulated Industries",
      description: "Meet HIPAA, PCI DSS, and SOC 2 requirements with built-in compliance frameworks. Automated evidence collection and audit-ready reporting reduce compliance burden."
    },
    {
      title: "For Organizations Without a Dedicated SOC",
      description: "Get SOC-style security operations with AI-powered threat detection and response. Enterprise security capabilities without enterprise security headcount."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="Vanguard — AI-Powered Security & Operations | UltriumAI"
        description="A unified platform combining RMM, helpdesk, threat detection, and compliance tooling — all powered by AI. Built for MSPs, IT teams, and security-conscious organizations."
        canonicalPath="/products/vanguard"
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered Security & Operations
          </Badge>
          
          <div className="flex items-center justify-center mb-8">
            <div className="h-48 w-80 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-cyan-500/30 mx-auto">
              <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            Vanguard — AI-Powered Security & Operations
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            A unified platform combining RMM, helpdesk, threat detection, and compliance 
            tooling — all powered by AI.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Built for MSPs, IT teams, and security-conscious organizations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
              <Link to="/contact">
                Request a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is Vanguard */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What is Vanguard?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Vanguard is an <strong className="text-foreground">AI-Powered Security & Operations Platform</strong> that 
            unifies remote monitoring, helpdesk, threat detection, and compliance into a single solution. It delivers 
            SOC-style security operations to organizations that don't have dedicated security teams, while providing 
            MSPs with the multi-tenant architecture and billing visibility they need to deliver managed security services profitably.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who It's For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Vanguard serves organizations that need unified security and operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, i) => {
              const IconComponent = audience.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-7 w-7 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-sm">{audience.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Included */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Unified Platform
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What's Included</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to secure and manage IT infrastructure in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => {
              const IconComponent = product.icon;
              return (
                <Card key={i} className="bg-card border-border/50 hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6">
                    {product.logo ? (
                      <div className={`w-28 h-16 rounded-lg ${product.bgColor} flex items-center justify-center mb-4 p-3`}>
                        <img src={product.logo} alt={product.title} className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 rounded-lg ${product.bgColor} flex items-center justify-center mb-4`}>
                        {IconComponent && <IconComponent className={`h-7 w-7 ${product.color}`} />}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Core Capabilities</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              AI-driven features that set Vanguard apart.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, i) => {
              const IconComponent = capability.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{capability.title}</h3>
                    <p className="text-muted-foreground text-sm">{capability.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Play className="h-3 w-3 mr-1" />
              Live Demo
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Experience Vanguard</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore our security operations platform with interactive demos
            </p>
          </div>

          <Tabs defaultValue="xdr" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
              <TabsTrigger value="xdr" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                XDR Platform
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Asset Management
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Compliance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="xdr">
              <ProductDemoWrapper
                productName="Vanguard XDR"
                productColor="cyan"
                compactMode
                compactHeight="h-[700px]"
                fullDemoPath="/demos/vanguard"
                description="AI-powered threat detection and autonomous response"
              >
                <div className="p-4 overflow-auto h-full">
                  <VanguardDemo />
                </div>
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="assets">
              <ProductDemoWrapper
                productName="SafeTrack Asset Management"
                productColor="orange"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/vanguard/assets"
                description="Complete IT asset lifecycle management"
              >
                <SafeTrackDemo compactMode />
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="compliance">
              <ProductDemoWrapper
                productName="Compliance & Auditing"
                productColor="emerald"
                compactMode
                compactHeight="h-[500px]"
                description="SOC 2, HIPAA, PCI DSS frameworks with automated evidence collection"
              >
                <div className="p-6 text-center">
                  <FileCheck className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-xl font-bold mb-2">Compliance Automation</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Built-in frameworks for SOC 2, HIPAA, PCI DSS, NIST, and CIS benchmarks 
                    with automated evidence collection and audit-ready reporting.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {['SOC 2', 'HIPAA', 'PCI DSS', 'NIST'].map((framework) => (
                      <div key={framework} className="p-4 border rounded-lg bg-muted/30">
                        <Check className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                        <span className="text-sm font-medium">{framework}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="mt-6 bg-emerald-500 hover:bg-emerald-600" asChild>
                    <Link to="/contact">
                      Request Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </ProductDemoWrapper>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Common Use Cases</h2>
            <p className="text-muted-foreground">
              How organizations deploy Vanguard.
            </p>
          </div>

          <div className="space-y-6">
            {useCases.map((useCase, i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                  <p className="text-muted-foreground">{useCase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Makes Vanguard Different</h2>
            <p className="text-muted-foreground">
              AI-driven, unified, and built for scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {differentiators.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50"
              >
                <Check className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Part of UltriumAI */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Part of the UltriumAI Platform</h2>
          <p className="text-muted-foreground mb-6">
            Vanguard integrates seamlessly with AI Studio for intelligent assistants and SafeSuite 
            for personal security tools. Build a complete security ecosystem with AI at its core.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products/ai-studio">
              <Button variant="outline" size="sm">
                Learn about AI Studio
              </Button>
            </Link>
            <Link to="/products/safesuite">
              <Button variant="outline" size="sm">
                Learn about SafeSuite
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-cyan-500/10 border-cyan-500/30">
            <CardContent className="p-10 text-center">
              <Shield className="h-12 w-12 text-cyan-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Unify Security & Operations?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                See how Vanguard can transform your IT operations with AI-powered 
                insights, unified tooling, and enterprise-grade security.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
                  <Link to="/contact">
                    Request a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">
                    Talk to Sales
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link to="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>🇺🇸 Veteran-Owned</span>
                <span>•</span>
                <span>MSP-Focused</span>
                <span>•</span>
                <span>AI-Powered</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VanguardProductPage;