import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, Building2, Shield, Lock,
  BarChart3, FileCheck, AlertTriangle, Users, Zap, Check, Brain,
  Network, Search, Activity, Server, Workflow, Play, Globe, Target,
  BookOpen, FileText, Lightbulb, Compass
} from "lucide-react";
import { Link } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { SEOHead } from "@/components/SEOHead";
import { ProductDemoWrapper } from "@/components/demos/ProductDemoWrapper";
import { VanguardDemo } from "@/components/demos/VanguardDemo";
import { SafeTrackDemo } from "@/components/demos/SafeTrackDemo";
import { ModuleLogo, type ModuleName } from "@/components/vanguard/ModuleLogo";

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

  // Vanguard Modules - the core of the platform
  const modules: {
    moduleId: ModuleName;
    name: string;
    tagline: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    capabilities: string[];
    bestFor: string;
  }[] = [
    {
      moduleId: "horizon",
      name: "Vanguard Horizon",
      tagline: "Operational Visibility & Device Health",
      description: "Vanguard Horizon provides continuous insight into the health, availability, and performance of every device in your environment. It acts as your operational early-warning system, identifying issues before they impact users.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      capabilities: [
        "Endpoint and server monitoring",
        "Availability and uptime tracking",
        "Agent health and connectivity status",
        "Performance baselines and drift detection"
      ],
      bestFor: "MSPs and IT teams that need proactive monitoring and operational stability across all clients and sites."
    },
    {
      moduleId: "pursuit",
      name: "Vanguard Pursuit",
      tagline: "Active Threat Detection & Security Intelligence",
      description: "Vanguard Pursuit is the security hunting layer of the platform. It continuously analyzes activity across endpoints and networks to identify suspicious behavior, surface threats, and prioritize risk.",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      capabilities: [
        "Threat detection and alerting",
        "Behavioral and anomaly analysis",
        "Security event correlation",
        "Centralized alert severity and triage"
      ],
      bestFor: "Teams that need real-time threat visibility without managing a full SOC stack."
    },
    {
      moduleId: "response",
      name: "Vanguard Response",
      tagline: "Incident Management & Service Resolution",
      description: "Vanguard Response turns alerts and issues into action. It manages incidents, tickets, and remediation workflows to ensure problems are tracked, owned, and resolved efficiently.",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      capabilities: [
        "Ticket and incident tracking",
        "SLA monitoring and escalation",
        "Technician assignment and status visibility",
        "Integrated workflow from detection to resolution"
      ],
      bestFor: "MSPs delivering managed services with accountability and response guarantees."
    },
    {
      moduleId: "recon",
      name: "Vanguard Recon",
      tagline: "Network Discovery & Asset Intelligence",
      description: "Vanguard Recon maps your environment so nothing is hidden or forgotten. It discovers devices, networks, and infrastructure components to provide accurate asset awareness.",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
      capabilities: [
        "Network and asset discovery",
        "Device classification and mapping",
        "Infrastructure visibility across sites",
        "Foundational intelligence for security and ops"
      ],
      bestFor: "Teams onboarding new clients, auditing environments, or reducing blind spots."
    },
    {
      moduleId: "atlas",
      name: "Vanguard Atlas",
      tagline: "Knowledge Base & Operational Intelligence",
      description: "Vanguard Atlas centralizes institutional knowledge so your team always knows what to do and how to do it. It connects documentation, SOPs, and runbooks directly to operations.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      capabilities: [
        "Centralized knowledge base",
        "SOPs and internal documentation",
        "Searchable operational guidance",
        "Shared intelligence across teams"
      ],
      bestFor: "Scaling MSPs and IT teams that want consistency and faster issue resolution."
    },
    {
      moduleId: "ledger",
      name: "Vanguard Ledger",
      tagline: "Compliance, Reporting & Audit Trails",
      description: "Vanguard Ledger provides the evidence layer of the platform. It records activity, produces reports, and supports compliance and audit requirements without manual effort.",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      capabilities: [
        "Compliance-ready reporting",
        "Audit logs and historical records",
        "Scheduled and on-demand reports",
        "Executive and client-facing visibility"
      ],
      bestFor: "Organizations that must prove security posture, service delivery, or regulatory compliance."
    },
    {
      moduleId: "cortex",
      name: "Vanguard Cortex",
      tagline: "AI-Assisted Operations & Decision Support",
      description: "Vanguard Cortex is the intelligence layer that ties everything together. It uses AI to assist technicians and operators by summarizing data, answering questions, and accelerating decision-making.",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      capabilities: [
        "AI-powered operational insights",
        "Context-aware assistance across modules",
        "Knowledge synthesis from Atlas and Ledger",
        "Faster troubleshooting and analysis"
      ],
      bestFor: "Teams that want to reduce manual effort and operate more intelligently at scale."
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

      {/* Meet the Vanguard Modules */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Purpose-Built Modules
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Vanguard Modules</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vanguard is a unified security and operations platform composed of purpose-built modules.
              Each module focuses on a specific operational mission — together, they form a complete 
              command-and-control system for MSPs and IT teams.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module, i) => (
              <Card key={i} className={`bg-card border ${module.borderColor} hover:shadow-lg transition-all overflow-hidden`}>
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-3 gap-0">
                    {/* Module Header */}
                    <div className={`${module.bgColor} p-8 flex flex-col justify-center`}>
                      <div className="w-20 h-20 rounded-2xl bg-background/80 flex items-center justify-center mb-4 p-2">
                        <ModuleLogo module={module.moduleId} size="xl" glow />
                      </div>
                      <h3 className={`text-2xl font-bold mb-2 ${module.color}`}>{module.name}</h3>
                      <p className="text-foreground font-medium">{module.tagline}</p>
                    </div>

                      {/* Module Details */}
                      <div className="lg:col-span-2 p-8">
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          {module.description}
                        </p>

                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Key Capabilities</h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {module.capabilities.map((cap, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <Check className={`h-4 w-4 ${module.color} flex-shrink-0`} />
                                <span className="text-sm text-muted-foreground">{cap}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${module.bgColor} border ${module.borderColor}`}>
                          <div className="flex items-start gap-2">
                            <Lightbulb className={`h-4 w-4 ${module.color} flex-shrink-0 mt-0.5`} />
                            <div>
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Best for:</span>
                              <p className="text-sm text-muted-foreground mt-1">{module.bestFor}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>

      {/* One Platform, One Command Surface */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Workflow className="h-3 w-3 mr-1" />
              Unified Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">One Platform. One Command Surface.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Each Vanguard module is powerful on its own — but the real value comes from how they work together.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-card via-card to-cyan-500/5 border-cyan-500/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-cyan-400" />
                    <span className="text-foreground"><strong>Horizon</strong> sees issues.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-red-400" />
                    <span className="text-foreground"><strong>Pursuit</strong> hunts threats.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    <span className="text-foreground"><strong>Response</strong> resolves incidents.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Compass className="h-5 w-5 text-violet-400" />
                    <span className="text-foreground"><strong>Recon</strong> maps the environment.</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-emerald-400" />
                    <span className="text-foreground"><strong>Atlas</strong> documents knowledge.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <span className="text-foreground"><strong>Ledger</strong> proves compliance.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-pink-400" />
                    <span className="text-foreground"><strong>Cortex</strong> helps you think faster.</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                  That's Vanguard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 bg-muted/30">
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
      <section className="py-20 px-4">
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
      <section className="py-20 px-4 bg-muted/30">
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
