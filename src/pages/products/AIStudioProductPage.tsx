import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Building2, Users, Globe, Shield, BarChart3, 
  Palette, Lock, Zap, Check, Settings, Bot, FileText,
  Eye, Database, Workflow, MessageSquare, Play
} from "lucide-react";
import { Link } from "react-router-dom";
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';
import { SEOHead } from "@/components/SEOHead";
import { ProductDemoWrapper } from "@/components/demos/ProductDemoWrapper";
import { AIStudioProductDemo } from "@/components/demos/AIStudioProductDemo";

const AIStudioProductPage = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Managed Service Providers",
      description: "Deliver white-labeled AI assistants to clients with predictable margins, usage visibility, and full governance. Create new recurring revenue streams with AI-as-a-Service."
    },
    {
      icon: Users,
      title: "Internal Business Teams",
      description: "Deploy AI assistants for HR, IT, sales, and operations without shadow IT. Maintain enterprise-grade controls, audit trails, and centralized oversight."
    },
    {
      icon: Globe,
      title: "Websites & Lead Generation",
      description: "Embed intelligent chatbots that qualify leads, answer visitor questions, and provide 24/7 support—all governed by your brand guidelines and content policies."
    }
  ];

  const capabilities = [
    {
      icon: Bot,
      title: "Custom AI Assistants",
      description: "Create purpose-built assistants powered by Google Gemini 3 and GPT-5. Train on your documentation, workflows, and brand voice for customer support, Q&A, or lead qualification."
    },
    {
      icon: Zap,
      title: "22+ Action Templates",
      description: "Pre-built integrations for SafeSuite security, Slack/Teams notifications, calendar automation, web search, and structured data extraction. Connect AI to your business systems instantly."
    },
    {
      icon: Shield,
      title: "Enterprise Governance",
      description: "Centralized policy controls with role-based access, content guardrails, and compliance-ready infrastructure. Every interaction logged and auditable."
    },
    {
      icon: BarChart3,
      title: "Capacity Analytics Dashboard",
      description: "Track daily trends, per-assistant consumption, burn-rate projections, and days remaining. Credit-based system (1 credit = 1,000 tokens) with transparent pricing."
    },
    {
      icon: Palette,
      title: "Complete White-Labeling",
      description: "Full customization of colors, logos, messaging, and domain. Deliver AI solutions under your brand with no UltriumAI branding visible to end users."
    },
    {
      icon: Eye,
      title: "Admin Analytics & Control",
      description: "Track usage by client, department, or assistant. Monitor performance, manage deployments, and control access across your entire organization."
    },
    {
      icon: Lock,
      title: "Security by Design",
      description: "SOC 2 aligned controls with encryption at rest and in transit. Role-based access controls, SSO integration, and comprehensive audit logging."
    }
  ];

  const useCases = [
    {
      icon: MessageSquare,
      title: "Customer Support Automation",
      description: "Deploy AI assistants that handle tier-1 support inquiries, reducing ticket volume while maintaining quality and brand consistency."
    },
    {
      icon: Database,
      title: "Knowledge Base Q&A",
      description: "Train assistants on internal documentation, policies, and procedures. Enable employees to get instant answers without searching through wikis."
    },
    {
      icon: Workflow,
      title: "Workflow Automation",
      description: "Connect AI assistants to business systems via actions and integrations. Automate data lookups, ticket creation, and process handoffs."
    },
    {
      icon: FileText,
      title: "Document Analysis",
      description: "Upload documents and enable assistants to answer questions about contracts, policies, technical documentation, and more."
    }
  ];

  const differentiators = [
    "Powered by Google Gemini 3 Pro and GPT-5 — enterprise-grade AI models",
    "22+ pre-built action templates for security, productivity, and automation",
    "Predictable capacity model with usage analytics and burn-rate projections",
    "Multi-tenant architecture designed for MSPs, agencies, and enterprise teams",
    "Full administrative oversight with granular usage tracking and audit trails",
    "Deploy in days, not months — minimal IT involvement required",
    "Train on your own data and documents with secure, private knowledge bases",
    "White-label ready — deliver under your brand with custom domains",
    "API access for custom integrations and workflow automation"
  ];

  const platformBenefits = [
    {
      title: "For MSPs & Agencies",
      points: [
        "Create new AI-as-a-Service revenue streams",
        "Client-level usage tracking and billing visibility",
        "White-label delivery with your branding",
        "Predictable margins with capacity-based pricing"
      ]
    },
    {
      title: "For Internal Teams",
      points: [
        "Eliminate shadow IT with governed AI deployment",
        "Centralized control across all departments",
        "Compliance-ready with full audit logging",
        "Reduce support burden on IT and HR"
      ]
    },
    {
      title: "For Websites & Marketing",
      points: [
        "24/7 lead qualification and engagement",
        "Brand-consistent messaging and guardrails",
        "Analytics on visitor interactions and intent",
        "Seamless handoff to sales teams"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="AI Studio — Business AI Control Plane | UltriumAI"
        description="Build, deploy, and govern AI assistants with predictable cost, enterprise controls, and full visibility. A Business AI Control Plane for MSPs, internal teams, and websites."
        canonicalPath="/products/ai-studio"
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            <Zap className="h-3 w-3 mr-1" />
            Business AI Platform
          </Badge>
          
          <div className="flex items-center justify-center mb-8">
            <div className="h-48 w-80 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto">
              <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            AI Studio — Your Business AI Control Plane
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Build, deploy, and govern AI assistants with predictable cost, 
            enterprise controls, and full visibility.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Not a chatbot toy — a platform built for business accountability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/pricing/ai-studio">
                View Pricing
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

      {/* What is AI Studio */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What is AI Studio?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            AI Studio is a <strong className="text-foreground">Business AI Control Plane</strong> that enables 
            organizations to deploy governed AI assistants at scale. Unlike consumer chatbots, AI Studio provides 
            the governance, visibility, and predictability that business operations require — from centralized 
            policy management to detailed usage analytics and white-label delivery.
          </p>

          {/* Build It Yourself CTA */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="bg-card/50 border-primary/30 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">App Builder</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Build full web applications with our AI-powered IDE. Chat your ideas into reality — no coding required.
                </p>
                <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/ai-studio/app-builder">
                    Start Building
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-primary/30 hover:border-primary/50 transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-7 w-7 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">GPT Builder</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create custom AI assistants trained on your data. Deploy as chatbots, embed on websites, or share via Teams.
                </p>
                <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/ai-studio/gpt-builder">
                    Create a GPT
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who It's For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              AI Studio serves organizations that need governance, predictability, and scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, i) => {
              const IconComponent = audience.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-7 w-7 text-primary" />
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

      {/* Core Capabilities */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Settings className="h-3 w-3 mr-1" />
              Core Capabilities
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What AI Studio Does</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to deploy AI at scale with confidence and control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, i) => {
              const IconComponent = capability.icon;
              return (
                <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
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

      {/* Use Cases */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Common Use Cases</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              AI Studio powers a wide range of business applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, i) => {
              const IconComponent = useCase.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground text-sm">{useCase.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Play className="h-3 w-3 mr-1" />
              Interactive Demo
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Experience AI Studio</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See how easy it is to build, customize, and deploy AI assistants
            </p>
          </div>

          <ProductDemoWrapper
            productName="AI Studio GPT Builder"
            productColor="primary"
            compactMode
            compactHeight="h-[650px]"
            fullDemoPath="/ai-studio"
            description="Create custom AI assistants trained on your data"
          >
            <AIStudioProductDemo compactMode />
          </ProductDemoWrapper>
        </div>
      </section>

      {/* Platform Benefits by Audience */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How AI Studio Fits Your Organization</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Different organizations, same platform — tailored outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {platformBenefits.map((benefit, i) => (
              <Card key={i} className="bg-card border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{benefit.title}</h3>
                  <ul className="space-y-2">
                    {benefit.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
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
            <h2 className="text-3xl font-bold mb-4">What Makes AI Studio Different</h2>
            <p className="text-muted-foreground">
              Built for business, not consumers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {differentiators.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50"
              >
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
            AI Studio integrates seamlessly with the broader UltriumAI ecosystem, including 
            Vanguard for security operations and SafeSuite for personal security tools. 
            Organizations can leverage AI assistants trained on security data, helpdesk content, 
            and operational documentation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products/vanguard">
              <Button variant="outline" size="sm">
                Learn about Vanguard
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

      {/* Custom Apps CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-card to-primary/10 border-primary/30">
            <CardContent className="p-10 text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">
                Are You an MSP?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm">
                Learn how AI Studio can become a profitable addition to your managed services portfolio 
                with white-label delivery, predictable margins, and client-level visibility.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/ai-studio-for-msps">
                  AI Studio for MSPs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-violet-500/10 border-violet-500/30">
            <CardContent className="p-10 text-center">
              <Settings className="h-12 w-12 text-violet-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">
                Need a Custom App?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm">
                Have something specific in mind that goes beyond our builders? Our team can design and 
                build bespoke applications tailored to your exact business requirements.
              </p>
              <Button size="lg" variant="outline" className="border-violet-500/30 hover:bg-violet-500/10" asChild>
                <Link to="/contact">
                  Contact Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            See how AI Studio can transform your organization with governed, scalable AI. 
            No credit card required to explore pricing options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/pricing/ai-studio">
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Talk to Sales
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link to="/auth">
                Get Started
              </Link>
            </Button>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>🇺🇸 Veteran-Owned</span>
            <span>•</span>
            <span>Enterprise-Ready</span>
            <span>•</span>
            <span>SOC 2 Aligned</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIStudioProductPage;