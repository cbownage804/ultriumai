import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Bot, Zap, Shield, BarChart3, Palette, Code2,
  Layers, Rocket, Globe, CheckCircle, Play, Sparkles,
  Building2, Users, MessageSquare, FileText, Workflow, Database
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Testimonials } from "@/components/marketing/Testimonials";
import { RequestDemoForm } from "@/components/marketing/RequestDemoForm";
import aiStudioLogo from "@/assets/ultrium-gpt-logo.png";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const }
  })
};

const tools = [
  { icon: Bot, label: "Custom GPT Builder", description: "Train AI assistants on your data with no-code tools", color: "text-violet-400", bg: "bg-violet-500/10" },
  { icon: Code2, label: "App Builder IDE", description: "Full-stack AI-powered IDE with live preview & deployment", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: Zap, label: "AI Agent Workflows", description: "Autonomous agents that trigger on events and automate tasks", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Layers, label: "22+ Action Templates", description: "Pre-built integrations for security, Slack, calendars & more", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { icon: Shield, label: "Enterprise Governance", description: "Role-based access, audit trails, content guardrails", color: "text-red-400", bg: "bg-red-500/10" },
  { icon: BarChart3, label: "Capacity Analytics", description: "Credit tracking, burn-rate projections, per-client billing", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: Palette, label: "White-Label Ready", description: "Custom domains, branding, and full visual customization", color: "text-pink-400", bg: "bg-pink-500/10" },
  { icon: Rocket, label: "One-Click Deploy", description: "Publish to Vercel, Docker, or custom hosting in seconds", color: "text-orange-400", bg: "bg-orange-500/10" },
];

const useCases = [
  { icon: MessageSquare, title: "Customer Support AI", description: "Deflect 60% of tier-1 tickets with an AI assistant trained on your KB.", stat: "60%", statLabel: "Ticket deflection" },
  { icon: Database, title: "Internal Knowledge Q&A", description: "Let employees query HR policies, IT docs, and SOPs in natural language.", stat: "10x", statLabel: "Faster answers" },
  { icon: Workflow, title: "Workflow Automation", description: "AI agents that route tickets, escalate issues, and trigger actions automatically.", stat: "85%", statLabel: "Time saved" },
  { icon: FileText, title: "Document Analysis", description: "Upload contracts, proposals, and reports for instant AI-powered analysis.", stat: "24/7", statLabel: "Availability" },
  { icon: Globe, title: "Website Chatbots", description: "Embed lead-qualifying AI on your website with brand-consistent messaging.", stat: "3x", statLabel: "More leads" },
  { icon: Code2, title: "Full-Stack App Builder", description: "Build and deploy complete web applications with AI code generation.", stat: "100x", statLabel: "Faster shipping" },
];

const audiences = [
  { icon: Building2, title: "MSPs & IT Firms", points: ["White-label AI for clients", "Per-client usage tracking", "New recurring revenue", "Predictable margins"], highlight: "from-violet-500/20 to-violet-900/10", border: "border-violet-500/30" },
  { icon: Users, title: "Business Teams", points: ["Governed AI deployment", "Centralized controls", "Full audit logging", "Eliminate shadow IT"], highlight: "from-cyan-500/20 to-cyan-900/10", border: "border-cyan-500/30" },
  { icon: Globe, title: "Websites & Marketing", points: ["24/7 lead qualification", "Brand-consistent AI", "Visitor analytics", "Sales handoff automation"], highlight: "from-emerald-500/20 to-emerald-900/10", border: "border-emerald-500/30" },
];

const AIStudioLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI Studio — Build, Deploy & Govern AI at Scale | UltriumAI"
        description="The complete AI platform for businesses. Build custom GPTs, full-stack apps, and automated workflows with enterprise governance. Start free."
        canonicalPath="/ai-studio-platform"
      />
      <Navigation />

      {/* Hero */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" className="text-center space-y-8">
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-sm px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                The Complete AI Platform for Business
              </Badge>
            </motion.div>

            <motion.div variants={fadeUp} custom={1} className="flex justify-center">
              <div className="h-24 w-24 rounded-2xl bg-black p-3 shadow-2xl shadow-violet-500/30 border border-violet-500/20">
                <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} custom={2} className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-violet-300 via-foreground to-cyan-300 bg-clip-text text-transparent">
                Build AI That Works
              </span>
              <br />
              <span className="text-foreground/80 text-4xl md:text-5xl">Like Your Business Does</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={3} className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Custom GPTs, full-stack apps, autonomous agents, and workflow automation—all with enterprise governance, predictable pricing, and one-click deployment.
            </motion.p>

            <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 shadow-lg shadow-violet-500/25" asChild>
                <Link to="/ai-studio">
                  Start Building Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-violet-500/30 hover:bg-violet-500/10" asChild>
                <Link to="/demos/ai-studio">
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Free tier available</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" /> Deploy in minutes</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof variant="full" className="bg-muted/20 border-y border-border/30" />

      {/* Tools Grid */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Layers className="h-3 w-3 mr-1" /> Platform Capabilities
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need to Ship AI</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From no-code GPT builders to a full IDE — AI Studio is the most complete AI platform for business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="h-full bg-card/50 border-border/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group">
                  <CardContent className="p-5">
                    <div className={`w-11 h-11 rounded-lg ${tool.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <tool.icon className={`h-5 w-5 ${tool.color}`} />
                    </div>
                    <h3 className="font-semibold mb-1">{tool.label}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases with Stats */}
      <section className="py-24 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Real Results, Real Use Cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how businesses use AI Studio to automate, accelerate, and scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full bg-card border-border/50 hover:border-violet-500/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        <uc.icon className="h-6 w-6 text-violet-400" />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-violet-400">{uc.stat}</div>
                        <div className="text-xs text-muted-foreground">{uc.statLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{uc.title}</h3>
                    <p className="text-sm text-muted-foreground">{uc.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience Segments */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Built For Your Organization</h2>
            <p className="text-lg text-muted-foreground">Different needs, one powerful platform.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((aud, i) => (
              <motion.div
                key={aud.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full bg-gradient-to-br ${aud.highlight} border ${aud.border} hover:shadow-xl transition-all`}>
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-background/50 flex items-center justify-center mb-4">
                      <aud.icon className="h-7 w-7 text-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{aud.title}</h3>
                    <ul className="space-y-2.5">
                      {aud.points.map((p) => (
                        <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Builder Highlight */}
      <section className="py-24 px-4 bg-gradient-to-br from-violet-500/5 via-background to-cyan-500/5 border-y border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                <Code2 className="h-3 w-3 mr-1" /> NEW: App Builder
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                A Full IDE.<br />Powered by AI.
              </h2>
              <p className="text-muted-foreground mb-6">
                Go beyond chatbots. Build complete React applications with a Monaco-based editor, live preview, Supabase integration, and one-click deployment to production.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "AI code generation with Plan → Execute → Verify loops",
                  "Real-time preview with hot reload",
                  "Supabase DB, Auth & Edge Functions built-in",
                  "Export as Docker, deploy to Vercel, or self-host",
                  "Version history with visual diff review"
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400" asChild>
                <Link to="/ai-studio/app-builder">
                  Try App Builder <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-xl border border-border/50 bg-card/80 p-4 shadow-2xl shadow-violet-500/10">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  <span className="text-xs text-muted-foreground ml-2">AI Studio — App Builder</span>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-3 h-64">
                  <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                    <div className="text-xs text-muted-foreground font-mono">Files</div>
                    {["App.tsx", "index.css", "api.ts", "Dashboard.tsx"].map(f => (
                      <div key={f} className="text-xs text-foreground/60 hover:text-foreground cursor-pointer py-0.5">{f}</div>
                    ))}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <div className="space-y-1.5">
                      <div className="h-2 w-3/4 bg-violet-500/20 rounded" />
                      <div className="h-2 w-1/2 bg-cyan-500/20 rounded" />
                      <div className="h-2 w-2/3 bg-violet-500/15 rounded" />
                      <div className="h-2 w-5/6 bg-cyan-500/15 rounded" />
                      <div className="h-2 w-1/3 bg-violet-500/10 rounded" />
                    </div>
                    <div className="mt-6 p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                      ✓ Build successful — deployed to preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Start Building Today</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Free tier to get started. Scale with predictable, credit-based pricing. No surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-violet-600 to-violet-500 shadow-lg shadow-violet-500/25" asChild>
              <Link to="/ai-studio">
                <Sparkles className="mr-2 h-5 w-5" /> Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/pricing/ai-studio">View Pricing</Link>
            </Button>
            <RequestDemoForm triggerLabel="Talk to Sales" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials
        maxItems={4}
        title="Trusted by Growing Businesses"
        subtitle="See why teams choose AI Studio for their AI infrastructure"
      />

      <Footer />
    </div>
  );
};

export default AIStudioLanding;
