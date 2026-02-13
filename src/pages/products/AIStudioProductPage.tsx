import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Building2, Users, Globe, Shield, BarChart3, 
  Palette, Zap, Check, Settings, Bot,
  Eye, Code, Layers, GitBranch, Image, Sparkles, Share2,
  Globe2, BookOpen, Search, Key, PenTool, MonitorSmartphone,
  Blocks, Cpu, Send, RefreshCw, MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';
import appBuilderShowcase from '@/assets/app-builder-showcase.png';
import gptBuilderShowcase from '@/assets/gpt-builder-showcase.png';
import aiStudioDashboard from '@/assets/ai-studio-dashboard-showcase.png';
import { SEOHead } from "@/components/SEOHead";

const AIStudioProductPage = () => {
  const platformBenefits = [
    {
      icon: Building2,
      title: "For MSPs & Agencies",
      points: [
        "Create new AI-as-a-Service revenue streams",
        "Client-level usage tracking and billing visibility",
        "White-label delivery with your branding",
        "Predictable margins with capacity-based pricing"
      ]
    },
    {
      icon: Users,
      title: "For Internal Teams",
      points: [
        "Eliminate shadow IT with governed AI deployment",
        "Centralized control across all departments",
        "Compliance-ready with full audit logging",
        "Reduce support burden on IT and HR"
      ]
    },
    {
      icon: Globe,
      title: "For Websites & Marketing",
      points: [
        "24/7 lead qualification and engagement",
        "Brand-consistent messaging and guardrails",
        "Analytics on visitor interactions and intent",
        "Seamless handoff to sales teams"
      ]
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

      {/* What is AI Studio + Dashboard */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">What is AI Studio?</h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto">
              AI Studio is a <strong className="text-foreground">Business AI Control Plane</strong> that enables 
              organizations to deploy governed AI assistants at scale. Unlike consumer chatbots, AI Studio provides 
              the governance, visibility, and predictability that business operations require — from centralized 
              policy management to detailed usage analytics and white-label delivery.
            </p>
          </div>
          
          <Card className="bg-card/50 border-primary/20 overflow-hidden shadow-2xl shadow-primary/10">
            <CardContent className="p-0">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={aiStudioDashboard} 
                  alt="AI Studio Dashboard — App Builder and GPT Builder hub with recent projects and templates" 
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* App Builder Deep Dive */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Code className="h-3 w-3 mr-1" />
              AI-Powered IDE
            </Badge>
            <h2 className="text-3xl font-bold mb-4">App Builder</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Build full web applications by chatting with AI. Describe what you want and watch it come to life — no coding required.
            </p>
          </div>

          <div className="mb-12">
            <Card className="bg-card/50 border-primary/30 overflow-hidden shadow-xl shadow-primary/10">
              <CardContent className="p-0">
                <div className="relative rounded-t-lg overflow-hidden">
                  <img 
                    src={appBuilderShowcase} 
                    alt="AI Studio App Builder — build full web apps by chatting with AI" 
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: MessageSquare, title: "Chat-to-Code", desc: "Describe what you want in plain English and the AI builds it — complete HTML, CSS, and JavaScript generated in seconds." },
              { icon: Eye, title: "Live Preview", desc: "See your application update in real-time as the AI generates code. Instant visual feedback with hot-reload preview." },
              { icon: Code, title: "Built-In Code Editor", desc: "Full Monaco-based code editor with syntax highlighting, IntelliSense, and AI-powered autocomplete suggestions." },
              { icon: PenTool, title: "Visual Edit Mode", desc: "Click any element in the preview to modify it directly. Change text, colors, and layout without touching code." },
              { icon: GitBranch, title: "Version History & Rollback", desc: "Every change is captured in a timeline. Browse snapshots and roll back to any previous version instantly." },
              { icon: Blocks, title: "Component Marketplace", desc: "24+ draggable UI blocks — hero sections, pricing tables, forms, navigation bars, and more. Drag, drop, customize." },
              { icon: Sparkles, title: "AI Autocomplete", desc: "Ghost-text code suggestions powered by AI. Write faster with intelligent completions for common patterns." },
              { icon: RefreshCw, title: "Auto-Error Recovery", desc: "Autonomous error detection and self-correction. The AI catches preview errors and fixes them automatically (up to 3 retries)." },
              { icon: Cpu, title: "Autonomous Agent Mode", desc: "Codex-inspired Plan → Execute → Verify → Fix loop. The AI plans multi-step tasks and executes them autonomously." },
              { icon: MonitorSmartphone, title: "Responsive Testing", desc: "Preview your app on desktop, tablet, and mobile viewports. 3-tab mobile navigation for small-screen editing." },
              { icon: Image, title: "AI Image Generation", desc: "Generate brand-accurate images directly in the builder. The AI matches your subject and style automatically." },
              { icon: Share2, title: "One-Click Publishing", desc: "Deploy to a live URL instantly. Full-stack export to React + Vite for self-hosting, Docker-ready, or raw ZIP download." },
            ].map((cap, i) => {
              const Icon = cap.icon;
              return (
                <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{cap.title}</h3>
                    <p className="text-muted-foreground text-sm">{cap.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/auth?return=ai-studio/app-builder">
                Try the App Builder
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* GPT Builder Deep Dive */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Bot className="h-3 w-3 mr-1" />
              Custom AI Assistants
            </Badge>
            <h2 className="text-3xl font-bold mb-4">GPT Builder</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create custom AI assistants trained on your data. Deploy as chatbots, embed on websites, or share via Microsoft Teams — fully branded and governed.
            </p>
          </div>

          <div className="mb-12">
            <Card className="bg-card/50 border-violet-500/30 overflow-hidden shadow-xl shadow-violet-500/10">
              <CardContent className="p-0">
                <div className="relative rounded-t-lg overflow-hidden">
                  <img 
                    src={gptBuilderShowcase} 
                    alt="AI Studio GPT Builder — create custom AI assistants with full configuration" 
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Bot, title: "Custom Personas", desc: "Define your assistant's personality, expertise areas, communication style, and system prompt. Full control over how it responds." },
              { icon: BookOpen, title: "Knowledge Sources", desc: "Train on your data — upload documents, paste text, or provide URLs. The assistant answers from your content, not generic data." },
              { icon: Zap, title: "22+ Action Templates", desc: "Pre-built integrations for SafeSuite security scans, Slack/Teams notifications, web search, calendar, and structured data extraction." },
              { icon: Search, title: "Live Web Search", desc: "Enable real-time web search powered by Perplexity. Your assistant can find current information and cite sources." },
              { icon: Palette, title: "Full Widget Theming", desc: "Customize every color — backgrounds, bubbles, headers, input fields. Per-element control for pixel-perfect brand matching." },
              { icon: Layers, title: "3 Embed Styles", desc: "Deploy as a floating Bubble, an Inline card panel, or a Full Page layout. Each adapts responsively to any screen size." },
              { icon: Globe2, title: "Website Embed", desc: "One-line script tag generates a floating chat widget on any website. Configure allowed domains for security." },
              { icon: Send, title: "Microsoft Teams Export", desc: "Export as a Teams app manifest (v1.16). Deploy your GPT directly into your organization's Microsoft Teams environment." },
              { icon: Key, title: "API Access & Keys", desc: "Generate API keys with rate limits and permissions. Integrate your GPT programmatically into any application or workflow." },
              { icon: MessageSquare, title: "Starter Questions", desc: "Configure welcome messages and pre-defined starter questions to guide users and showcase your assistant's capabilities." },
              { icon: Shield, title: "Content Guardrails", desc: "System prompt enforcement, domain restrictions, and message limits per visitor. Prevent misuse and control costs." },
              { icon: BarChart3, title: "Usage Analytics", desc: "Track conversations, credits consumed, and per-GPT performance. Real-time dashboards with burn-rate projections." },
            ].map((cap, i) => {
              const Icon = cap.icon;
              return (
                <Card key={i} className="bg-card border-border/50 hover:border-violet-500/30 transition-all">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <h3 className="font-semibold mb-1.5">{cap.title}</h3>
                    <p className="text-muted-foreground text-sm">{cap.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/auth?return=ai-studio/gpt-builder">
                Create a GPT
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who AI Studio Is For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Different organizations, same platform — tailored outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {platformBenefits.map((benefit, i) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-4 text-center">{benefit.title}</h3>
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
              );
            })}
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
