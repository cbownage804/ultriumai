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
  BookOpen, FileText, Lightbulb, Compass, Replace, MonitorSmartphone
} from "lucide-react";
import { Link } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { SEOHead } from "@/components/SEOHead";
import { ProductDemoWrapper } from "@/components/demos/ProductDemoWrapper";
import { VanguardDemo } from "@/components/demos/VanguardDemo";
import { SafeTrackDemo } from "@/components/demos/SafeTrackDemo";
import { ModuleLogo, type ModuleName } from "@/components/vanguard/ModuleLogo";

const VanguardProductPage = () => {
  // What Vanguard replaces — outcome-focused
  const replacements = [
    { category: "RMM", examples: "Datto, NinjaOne, ConnectWise Automate", module: "Horizon" },
    { category: "PSA / Service Desk", examples: "Autotask, ConnectWise Manage, Freshdesk", module: "Response" },
    { category: "XDR / Endpoint Security", examples: "SentinelOne, CrowdStrike, Huntress", module: "Pursuit" },
    { category: "SaaS Security", examples: "Augmentt, Saasment", module: "Sentinel" },
    { category: "Vulnerability Scanning", examples: "Nessus, Qualys, Rapid7", module: "Recon" },
    { category: "IT Documentation", examples: "IT Glue, Hudu", module: "Atlas" },
    { category: "Compliance", examples: "Drata, Vanta, Secureframe", module: "Comply" },
    { category: "Reporting", examples: "BrightGauge, CloudRadial", module: "Ledger" },
  ];

  // Vanguard Modules
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
      tagline: "Endpoint Monitoring & Fleet Management",
      description: "Continuous visibility into the health, performance, and security posture of every device in your environment. Horizon is the operational foundation — deploy agents, push patches, manage software, and connect remotely.",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      capabilities: [
        "Endpoint and server monitoring",
        "Automated patch management with rollback",
        "Built-in remote access via MeshCentral",
        "Fleet-wide software deployment"
      ],
      bestFor: "MSPs and IT teams that need proactive monitoring and operational control across all sites."
    },
    {
      moduleId: "pursuit",
      name: "Vanguard Pursuit",
      tagline: "Threat Detection & Response",
      description: "AI-powered detection across endpoints and networks. Pursuit identifies threats, maps them to MITRE ATT&CK, and provides automated response actions — isolate, quarantine, or remediate.",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      capabilities: [
        "Behavioral and signature-based detection",
        "MITRE ATT&CK mapping",
        "Automated isolation and remediation",
        "Cross-client SOC visibility"
      ],
      bestFor: "Teams that need real-time threat visibility without managing a full SOC stack."
    },
    {
      moduleId: "response",
      name: "Vanguard Response",
      tagline: "Service Desk & Incident Management",
      description: "The operational backbone for tracking work. Response manages tickets, SLAs, time entries, and client communication — from initial alert through resolution and invoicing.",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      capabilities: [
        "Ticket lifecycle management",
        "SLA tracking with escalation rules",
        "Time logging and contract billing",
        "Client-facing service portal"
      ],
      bestFor: "MSPs delivering managed services with accountability and SLA guarantees."
    },
    {
      moduleId: "recon",
      name: "Vanguard Recon",
      tagline: "Vulnerability Assessment & Network Discovery",
      description: "Discover what's in your environment and where it's vulnerable. Recon scans networks, maps assets, and identifies CVEs — feeding results directly into compliance and remediation workflows.",
      color: "text-violet-400",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/30",
      capabilities: [
        "Automated vulnerability scanning",
        "Network and asset discovery",
        "CIS and NIST benchmark checks",
        "Guided penetration testing"
      ],
      bestFor: "Security teams onboarding new clients, running assessments, or preparing for audits."
    },
    {
      moduleId: "atlas",
      name: "Vanguard Atlas",
      tagline: "IT Documentation & Knowledge Base",
      description: "Centralized documentation for every client — contacts, configurations, credentials, SOPs, and runbooks. Atlas is the reference layer your technicians reach for mid-ticket.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      capabilities: [
        "Multi-tenant knowledge base",
        "Password vault and credential management",
        "Runbooks and SOP library",
        "SSL and domain expiration tracking"
      ],
      bestFor: "Scaling teams that need consistent documentation and faster issue resolution."
    },
    {
      moduleId: "ledger",
      name: "Vanguard Ledger",
      tagline: "Unified Reporting Engine",
      description: "Aggregates data from every module into structured reports — executive summaries, security posture, SLA performance, and compliance status. One reporting engine for the entire platform.",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      capabilities: [
        "Cross-module executive reports",
        "Scheduled and on-demand generation",
        "Client-facing QBR presentations",
        "AI-generated report summaries"
      ],
      bestFor: "Organizations that need to prove security posture, service delivery, or regulatory compliance."
    },
    {
      moduleId: "cortex",
      name: "Vanguard Cortex",
      tagline: "AI Intelligence Layer",
      description: "Over 20 specialized AI tools embedded across the platform — ticket analysis, SLA prediction, smart routing, automated documentation, and knowledge base generation. Cortex makes every module more intelligent.",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/30",
      capabilities: [
        "AI ticket analyzer and smart routing",
        "SLA breach prediction",
        "Screen-to-Docs automation",
        "Knowledge base auto-generation"
      ],
      bestFor: "Teams that want to reduce manual effort and operate more intelligently at scale."
    },
    {
      moduleId: "sentinel" as ModuleName,
      name: "Vanguard Sentinel",
      tagline: "SaaS Security & Cloud Posture",
      description: "Monitors your Microsoft 365 and Google Workspace environments for misconfigurations, suspicious activity, and policy drift. Sentinel identifies shadow IT, risky app permissions, and compliance gaps across your cloud estate.",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      capabilities: [
        "M365 and Google Workspace security monitoring",
        "Shadow IT and risky app detection",
        "Configuration drift alerts",
        "AI-powered triage and remediation"
      ],
      bestFor: "Organizations relying on cloud productivity suites that need visibility into SaaS risk."
    },
    {
      moduleId: "comply" as ModuleName,
      name: "Vanguard Comply",
      tagline: "Compliance & Framework Management",
      description: "Map your security controls to industry frameworks — SOC 2, HIPAA, PCI DSS, NIST, and more. Comply automates evidence collection, tracks control status, and generates audit-ready reports.",
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/30",
      capabilities: [
        "Framework mapping (SOC 2, HIPAA, PCI, NIST)",
        "Automated evidence collection",
        "Control status tracking and gap analysis",
        "Audit-ready report generation"
      ],
      bestFor: "MSPs and businesses preparing for audits or managing compliance across regulated industries."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="Vanguard — Unified IT Operations & Security Platform | UltriumAI"
        description="Vanguard replaces your RMM, PSA, security tools, and compliance platforms with a single, AI-enabled system. Built for MSPs and internal IT teams."
        canonicalPath="/products/vanguard"
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-8">
            <div className="h-44 w-72 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-cyan-500/20 mx-auto">
              <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            Replace Your Entire MSP Stack
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed">
            Vanguard replaces the fragmented stack of tools your team manages today — 
            RMM, service desk, threat detection, documentation, compliance, and reporting — 
            with a single system that shares data, context, and intelligence across every workflow.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            Built for MSPs managing multiple clients and internal IT teams running their own operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
              <Link to="/auth?return=vanguard">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing/vanguard">
                View Pricing
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/contact">
                Talk to Sales
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What Vanguard Replaces */}
      <section className="py-20 px-4 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Vanguard Replaces</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Most IT teams run 5–10 separate tools with separate logins, separate billing, and separate data. 
              Vanguard consolidates them into one platform — reducing cost, complexity, and context-switching.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {replacements.map((item, i) => (
              <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/20 transition-colors">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-foreground mb-1">{item.category}</p>
                  <p className="text-xs text-muted-foreground mb-3">{item.examples}</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-400">{item.module}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Two Operating Modes */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">One Platform, Two Operating Modes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vanguard is the same platform whether you're managing clients or managing your own environment. 
              The difference is configuration, not product.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-cyan-500/20 hover:border-cyan-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-5">
                  <Building2 className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">MSP Mode</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  For managed service providers managing multiple client environments.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Multi-tenant with full client isolation",
                    "Per-technician pricing, unlimited endpoints",
                    "White-label branding and client portal",
                    "Cross-client SOC and unified billing",
                    "Partner tiers with volume discounts"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-violet-500/20 hover:border-violet-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                  <MonitorSmartphone className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Internal IT Mode</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  For IT departments managing their own organization's environment.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Single-tenant with internal user management",
                    "Same modules, same capabilities",
                    "Internal helpdesk and SLA tracking",
                    "Compliance frameworks for regulated industries",
                    "Executive reporting for leadership"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Meet the Vanguard Modules */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Modules</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each module handles a specific operational domain. Together, they form a complete 
              system where data flows between monitoring, detection, response, documentation, 
              compliance, and reporting — without integration work.
            </p>
          </div>

          <div className="space-y-8">
            {modules.map((module, i) => (
              <Card key={i} className={`bg-card border ${module.borderColor} hover:shadow-lg transition-all overflow-hidden`}>
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-3 gap-0">
                    <div className={`${module.bgColor} p-8 flex flex-col justify-center`}>
                      <div className="w-20 h-20 rounded-2xl bg-background/80 flex items-center justify-center mb-4 p-2">
                        <ModuleLogo module={module.moduleId} size="xl" glow />
                      </div>
                      <h3 className={`text-2xl font-bold mb-2 ${module.color}`}>{module.name}</h3>
                      <p className="text-foreground font-medium">{module.tagline}</p>
                    </div>

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

      {/* Platform Credibility */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built as a Platform, Not a Bundle</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vanguard isn't a collection of acquired products stitched together. 
              Every module shares the same data model, the same agent, and the same AI layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                title: "Unified data model",
                description: "A device in Horizon is the same device in Pursuit, Response, and Comply. No sync delays, no duplicate records."
              },
              {
                title: "Native agent",
                description: "One lightweight agent handles monitoring, security, patching, and remote access. No stacking multiple agents on endpoints."
              },
              {
                title: "Feature-gated by subscription",
                description: "Start with what you need. Modules activate as you add them — no rip-and-replace when you expand."
              },
              {
                title: "AI across every workflow",
                description: "Cortex AI is embedded in every module — ticket triage, threat analysis, documentation generation, and report summaries."
              },
              {
                title: "Security-first architecture",
                description: "Role-based access control, full audit trails, encrypted credential storage, and tenant isolation by default."
              },
              {
                title: "Per-technician pricing",
                description: "Unlimited endpoints. No per-device surcharges. Predictable costs that scale with your team, not your device count."
              }
            ].map((item, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
              Explore the platform with interactive demos.
            </p>
          </div>

          <Tabs defaultValue="xdr" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-6">
              <TabsTrigger value="xdr" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Threat Detection
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
                description="AI-powered threat detection and response"
              >
                <div className="p-4 overflow-auto h-full">
                  <VanguardDemo />
                </div>
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="assets">
              <ProductDemoWrapper
                productName="Asset Management"
                productColor="orange"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/vanguard/assets"
                description="IT asset lifecycle management"
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
                description="Automated evidence collection and audit-ready reporting"
              >
                <div className="p-6 text-center">
                  <FileCheck className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                  <h3 className="text-xl font-bold mb-2">Compliance Automation</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Help your clients achieve compliance with built-in framework templates and automated evidence collection.
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

      {/* Part of UltriumAI */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Part of the UltriumAI Platform</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Vanguard shares a single account, billing hub, and AI backbone with AI Studio and SafeSuite. 
            Use the products that match your role — they stay out of your way until you need them.
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
                Ready to consolidate your stack?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                See how Vanguard replaces multiple tools with a single platform — 
                fewer logins, fewer invoices, and complete operational visibility.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
                  <Link to="/auth?return=vanguard">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing/vanguard">
                    View Pricing
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link to="/contact">
                    Talk to Sales
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>🇺🇸 Veteran-Owned</span>
                <span>•</span>
                <span>Per-Technician Pricing</span>
                <span>•</span>
                <span>Unlimited Endpoints</span>
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
