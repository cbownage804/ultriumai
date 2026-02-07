import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, User, Building2, Check, Zap, Lock, Heart, Smartphone, Shield,
  Eye, RefreshCw, Play, AlertTriangle, Users, Briefcase, Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { safesuiteLogo } from "@/components/safesuite/SafeSuiteProductIcons";
import safepassLogo from "@/assets/safepass-logo.png";
import safescanLogo from "@/assets/safescan-logo.png";
import safewebLogo from "@/assets/safeweb-logo.png";
import safetrackLogo from "@/assets/safetrack-logo.png";
import safeassistLogo from "@/assets/safeassist-logo-horizontal.png";
import { SEOHead } from "@/components/SEOHead";
import { ProductDemoWrapper } from "@/components/demos/ProductDemoWrapper";
import { SafePassDemo } from "@/components/demos/SafePassDemo";
import { SafeTrackDemo } from "@/components/demos/SafeTrackDemo";
import { SafeAssistDemo } from "@/components/demos/SafeAssistDemo";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";
import { SafeScanDemo } from "@/components/demos/SafeScanDemo";

const SafeSuiteProductPage = () => {
  const audiencePaths = [
    {
      icon: Building2,
      title: "SMB Teams",
      outcome: "Protect your business credentials, monitor for breaches, and prove you take security seriously — without hiring a security team.",
    },
    {
      icon: Briefcase,
      title: "Freelancers",
      outcome: "Manage client credentials safely and keep your own accounts locked down — one tool, no complexity.",
    },
    {
      icon: Home,
      title: "Families",
      outcome: "Keep your family's passwords secure, monitor for identity theft, and teach good security habits — all from one dashboard.",
    },
    {
      icon: User,
      title: "Individuals",
      outcome: "Take control of your digital life. Strong passwords, breach alerts, and AI security guidance — for free.",
    },
  ];

  const outcomes = [
    {
      logo: safepassLogo,
      title: "SafePass™",
      outcome: "Never lose, forget, or reuse a password again.",
      description: "Encrypted vault with autofill, secure sharing, and breach monitoring. Every credential is stored with AES-256-GCM encryption — only you can decrypt it.",
    },
    {
      logo: safescanLogo,
      title: "SafeScan™",
      outcome: "Know your risk before attackers do.",
      description: "Scan emails, URLs, documents, and passwords for threats. Get a clear risk score and actionable guidance — not a wall of technical jargon.",
    },
    {
      logo: safewebLogo,
      title: "SafeWeb™",
      outcome: "Find out if your data is already exposed.",
      description: "24/7 dark web monitoring for leaked credentials and personal data. Get alerted the moment your information appears in a breach — before criminals can act.",
    },
    {
      logo: safetrackLogo,
      title: "SafeTrack™",
      outcome: "Know exactly what you own and its security status.",
      description: "Simple asset tracking for devices, software licenses, and warranties. See what's up to date, what's expiring, and what needs attention.",
    },
    {
      logo: safeassistLogo,
      title: "SafeAssist™",
      outcome: "Get expert security guidance — anytime, in plain language.",
      description: "AI-powered security advisor that answers your questions, identifies phishing attempts, and guides you through incident response — no security expertise required.",
    },
  ];

  const trustSignals = [
    {
      title: "Zero-knowledge encryption",
      description: "Your passwords are encrypted on your device before they reach our servers. We can't read them — ever.",
    },
    {
      title: "No data selling",
      description: "We don't sell your data, serve ads, or monetize your browsing. Your security data belongs to you.",
    },
    {
      title: "Veteran-owned",
      description: "Built by a U.S. veteran-owned company with a security-first mission — not a growth-at-all-costs startup.",
    },
    {
      title: "Continuous monitoring",
      description: "Dark web scanning runs 24/7. When a breach happens, you're notified — not surprised months later.",
    },
    {
      title: "Industry-standard cryptography",
      description: "AES-256-GCM encryption, PBKDF2 with 600,000 iterations for key derivation, and TLS for all data in transit.",
    },
    {
      title: "Free tier, no tricks",
      description: "Start for free with core features. Upgrade when you're ready — no surprise charges or feature walls.",
    },
  ];

  const steps = [
    { icon: Smartphone, label: "Try Free", description: "Create your account in under a minute. No credit card." },
    { icon: RefreshCw, label: "Choose a Plan", description: "Stay free or pick the plan that matches your needs." },
    { icon: Shield, label: "Get Protected", description: "Import passwords, run your first scan, and enable monitoring." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="SafeSuite — Protect Your Digital World | UltriumAI"
        description="Passwords, breaches, and threats — all in one tool. Enterprise-grade security built for individuals, teams, and SMBs without the complexity."
        canonicalPath="/products/safesuite"
      />
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="flex items-center justify-center mb-8">
            <div className="h-44 w-72 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            Protect Your Digital World — Passwords, Breaches & Threats All in One Tool
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Enterprise-grade security built for individuals, teams, and SMBs — without the complexity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" asChild>
              <Link to="/auth">
                Try Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing/safesuite">
                View Plans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">The Problem Is Real — and It's Getting Worse</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Every day, credentials are lost, reused, stolen, or compromised. Hackers exploit
            weak passwords, exposed data, and unprotected accounts — and most security tools
            are too complex or expensive for small teams and individuals.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            The result? People skip security altogether, reuse the same password everywhere,
            and only find out about breaches months after the damage is done.
            SafeSuite exists to change that.
          </p>
        </div>
      </section>

      {/* Audience Paths */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who Is SafeSuite For?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Security that fits your world — whether you're protecting a business, a family, or just yourself.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {audiencePaths.map((audience, i) => {
              const IconComponent = audience.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{audience.title}</h3>
                    <p className="text-muted-foreground text-sm">{audience.outcome}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Outcome-Framed Products */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Five Tools, One Suite
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What You Get</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each tool solves a specific security problem. Together, they cover the full picture.
            </p>
          </div>

          <div className="space-y-4">
            {outcomes.map((product, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-emerald-500/20 transition-all overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-[200px_1fr] gap-0">
                    <div className="bg-black/50 p-6 flex items-center justify-center">
                      <img
                        src={product.logo}
                        alt={product.title}
                        className="h-14 w-auto object-contain"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold mb-1">{product.title}</h3>
                      <p className="text-emerald-500 font-medium text-sm mb-2">{product.outcome}</p>
                      <p className="text-muted-foreground text-sm">{product.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demos Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Play className="h-3 w-3 mr-1" />
              Try Before You Buy
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Experience SafeSuite Live</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore interactive demos of each tool. No signup required.
            </p>
          </div>

          <Tabs defaultValue="safepass" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 h-auto p-1">
              <TabsTrigger value="safepass" className="py-3 px-2">
                <img src={safepassLogo} alt="SafePass" className="h-8 w-auto" />
              </TabsTrigger>
              <TabsTrigger value="safescan" className="py-3 px-2">
                <img src={safescanLogo} alt="SafeScan" className="h-8 w-auto" />
              </TabsTrigger>
              <TabsTrigger value="safeweb" className="py-3 px-2">
                <img src={safewebLogo} alt="SafeWeb" className="h-8 w-auto" />
              </TabsTrigger>
              <TabsTrigger value="safetrack" className="py-3 px-2">
                <img src={safetrackLogo} alt="SafeTrack" className="h-8 w-auto" />
              </TabsTrigger>
              <TabsTrigger value="safeassist" className="py-3 px-2">
                <img src={safeassistLogo} alt="SafeAssist" className="h-8 w-auto" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="safepass">
              <ProductDemoWrapper
                productName="SafePass Password Vault"
                productColor="amber"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/demos/safepass"
                description="Secure password storage with team sharing and breach monitoring"
              >
                <SafePassDemo />
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="safescan">
              <ProductDemoWrapper
                productName="SafeScan Threat Detection"
                productColor="red"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/demos/safescan"
                description="AI-powered scanning for documents, emails, URLs, and passwords"
              >
                <SafeScanDemo />
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="safeweb">
              <ProductDemoWrapper
                productName="SafeWeb Dark Web Monitor"
                productColor="violet"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/demos/darkweb"
                description="Monitor for leaked credentials and data breaches"
              >
                <DarkWebDemo />
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="safetrack">
              <ProductDemoWrapper
                productName="SafeTrack Asset Management"
                productColor="orange"
                compactMode
                compactHeight="h-[600px]"
                fullDemoPath="/vanguard/assets"
                description="Track hardware, software licenses, and asset lifecycle"
              >
                <SafeTrackDemo compactMode />
              </ProductDemoWrapper>
            </TabsContent>

            <TabsContent value="safeassist">
              <ProductDemoWrapper
                productName="SafeAssist AI Security Advisor"
                productColor="emerald"
                compactMode
                compactHeight="h-[550px]"
                description="24/7 AI-powered security guidance and threat analysis"
              >
                <SafeAssistDemo compactMode />
              </ProductDemoWrapper>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Trust & Proof Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your Security Is Not Negotiable</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              SafeSuite is built on the principle that your data belongs to you — and only you.
              Here's how we back that up.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustSignals.map((signal, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{signal.title}</h3>
                  <p className="text-sm text-muted-foreground">{signal.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started — 3 Steps */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Three Steps to Protected</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const IconComponent = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h3 className="font-bold mb-2">{step.label}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Part of UltriumAI */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Part of the UltriumAI Platform</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            SafeSuite shares a single account, billing hub, and AI backbone with Vanguard and AI Studio.
            Need enterprise IT operations or custom AI tools? They're one click away.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products/vanguard">
              <Button variant="outline" size="sm">
                Learn about Vanguard
              </Button>
            </Link>
            <Link to="/products/ai-studio">
              <Button variant="outline" size="sm">
                Learn about AI Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-10 text-center">
              <Shield className="h-12 w-12 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Start protecting yourself today.
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Create a free account, import your passwords, and run your first security scan — all in under five minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" asChild>
                  <Link to="/auth">
                    Try Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing/safesuite">
                    Choose a Plan
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
                <span>Zero-Knowledge Encryption</span>
                <span>•</span>
                <span>Free Tier Available</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SafeSuiteProductPage;
