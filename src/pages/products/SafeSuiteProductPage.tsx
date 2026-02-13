import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, User, Building2, Check, Zap, Lock, Heart, Smartphone, Shield,
  Eye, RefreshCw, Play, AlertTriangle, Users, Briefcase, Home, KeyRound,
  Mail, Bell, Fingerprint
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
  const everydayProblems = [
    {
      icon: KeyRound,
      problem: "Forgetting passwords",
      solution: "SafePass remembers every password for you — securely encrypted, always available.",
    },
    {
      icon: RefreshCw,
      problem: "Reusing the same password everywhere",
      solution: "Generate unique, strong passwords for every account with one click.",
    },
    {
      icon: Mail,
      problem: "Suspicious emails or links",
      solution: "SafeScan checks URLs, emails, and files before you click — keeping you safe from phishing.",
    },
    {
      icon: Bell,
      problem: "Finding out about breaches too late",
      solution: "SafeWeb monitors the dark web 24/7 and alerts you the moment your data appears in a leak.",
    },
  ];

  const outcomes = [
    {
      logo: safepassLogo,
      title: "SafePass™",
      outcome: "Never lose, forget, or reuse a password again.",
      description: "Your personal password vault. Saves every login, fills them automatically, and lets you share credentials safely with family or teammates.",
    },
    {
      logo: safescanLogo,
      title: "SafeScan™",
      outcome: "Know if a link, email, or file is safe — before you open it.",
      description: "Paste a suspicious URL, upload a file, or check an email. Get a clear, plain-language answer: safe or not.",
    },
    {
      logo: safewebLogo,
      title: "SafeWeb™",
      outcome: "Find out if your personal data has been exposed.",
      description: "Monitors breach databases and the dark web for your email, passwords, and personal information. You'll know before criminals can act.",
    },
    {
      logo: safetrackLogo,
      title: "SafeTrack™",
      outcome: "Keep track of your devices, subscriptions, and warranties.",
      description: "A simple inventory for your phones, laptops, and software. Know what you own, when warranties expire, and what needs attention.",
    },
    {
      logo: safeassistLogo,
      title: "SafeAssist™",
      outcome: "Get security advice in plain language — anytime.",
      description: "Ask anything about online safety and get clear, actionable guidance. Like having a security expert on call, without the jargon.",
    },
  ];

  const trustSignals = [
    {
      title: "Your passwords are private — even from us",
      description: "Zero-knowledge encryption means your data is encrypted on your device before it reaches our servers. We can never see it.",
    },
    {
      title: "We don't sell your data",
      description: "No ads, no tracking, no data brokers. Your security information belongs to you and only you.",
    },
    {
      title: "Free tier with no catches",
      description: "Start using SafeSuite for free. No credit card required, no time limit, no surprise charges.",
    },
    {
      title: "Veteran-owned, security-first",
      description: "Built by a U.S. veteran-owned company with a mission to make real security accessible to everyone.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="SafeSuite — Security That Fits Your Life | UltriumAI"
        description="Keep your passwords, accounts, and digital identity safe — at home, at work, and everywhere in between. Free to start, simple to use."
        canonicalPath="/products/safesuite"
      />
      <Navigation />

      {/* Hero Section — Personal, warm, human */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Heart className="h-3 w-3 mr-1" />
            Free to Start
          </Badge>

          <div className="flex items-center justify-center mb-8">
            <div className="h-40 w-64 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            Security That Fits Your Life
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-2">
            Keep your passwords, accounts, and digital identity safe — at home, at work, and everywhere in between.
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            No technical knowledge needed. No complicated setup. Just protection that works.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-lg px-8" asChild>
              <Link to="/auth?return=safesuite">
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing/safesuite">
                See Plans
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Free forever on the basic plan
          </p>
        </div>
      </section>

      {/* Everyday Problems — Relatable, human */}
      <section className="py-20 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sound Familiar?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              These are the everyday security problems most people deal with — and ignore.
              SafeSuite solves them quietly, in the background.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {everydayProblems.map((item, i) => {
              const IconComponent = item.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <IconComponent className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">"{item.problem}"</p>
                        <p className="text-sm text-muted-foreground">{item.solution}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* For Individuals & Families — Dedicated section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Home className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Built for People, Not Just Businesses</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              SafeSuite was designed for real people first. You don't need an IT team
              or a security background to use it. If you can use an app on your phone,
              you can use SafeSuite.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                  <User className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Individuals</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Take control of your digital life. Save every password securely,
                  check if your accounts have been breached, and get alerts before
                  problems become emergencies.
                </p>
                <ul className="space-y-2">
                  {[
                    "Unlimited password storage",
                    "Dark web breach alerts",
                    "Suspicious link checking",
                    "AI security advice on demand",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5">
                  <Home className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Families</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Keep your whole family safe online. Share passwords securely with
                  your partner, monitor your kids' email addresses for breaches, and
                  teach good security habits — all from one dashboard.
                </p>
                <ul className="space-y-2">
                  {[
                    "Secure password sharing between family members",
                    "Monitor multiple email addresses",
                    "Simple enough for teens and parents",
                    "One account protects the whole household",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get — Outcome-framed */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Everything You Need
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Five Tools, One Simple App</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Each tool handles a specific part of your digital safety. Together,
              they've got you covered.
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

      {/* Also Great for Teams — Secondary, brief */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-emerald-500" />
                <h2 className="text-2xl font-bold">Also Built for Teams & Small Businesses</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Running a business? SafeSuite scales with you. Manage your team's credentials,
                monitor for corporate breaches, and track company devices — all with the same
                simple interface. No IT department required.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {[
                  "Team password sharing with access controls",
                  "Employee breach monitoring",
                  "Company asset tracking",
                  "Business and Pro plans available",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Button variant="outline" asChild>
                <Link to="/pricing/safesuite">
                  View Business Plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demos */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Play className="h-3 w-3 mr-1" />
              Try It Out
            </Badge>
            <h2 className="text-3xl font-bold mb-4">See How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore each tool with an interactive demo. No signup needed.
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
              <ProductDemoWrapper productName="SafePass Password Vault" productColor="amber" compactMode compactHeight="h-[600px]" fullDemoPath="/demos/safepass" description="Secure password storage with team sharing and breach monitoring">
                <SafePassDemo />
              </ProductDemoWrapper>
            </TabsContent>
            <TabsContent value="safescan">
              <ProductDemoWrapper productName="SafeScan Threat Detection" productColor="red" compactMode compactHeight="h-[600px]" fullDemoPath="/demos/safescan" description="AI-powered scanning for documents, emails, URLs, and passwords">
                <SafeScanDemo />
              </ProductDemoWrapper>
            </TabsContent>
            <TabsContent value="safeweb">
              <ProductDemoWrapper productName="SafeWeb Dark Web Monitor" productColor="violet" compactMode compactHeight="h-[600px]" fullDemoPath="/demos/darkweb" description="Monitor for leaked credentials and data breaches">
                <DarkWebDemo />
              </ProductDemoWrapper>
            </TabsContent>
            <TabsContent value="safetrack">
              <ProductDemoWrapper productName="SafeTrack Asset Management" productColor="orange" compactMode compactHeight="h-[600px]" fullDemoPath="/vanguard/assets" description="Track hardware, software licenses, and asset lifecycle">
                <SafeTrackDemo compactMode />
              </ProductDemoWrapper>
            </TabsContent>
            <TabsContent value="safeassist">
              <ProductDemoWrapper productName="SafeAssist AI Security Advisor" productColor="emerald" compactMode compactHeight="h-[550px]" description="24/7 AI-powered security guidance and threat analysis">
                <SafeAssistDemo compactMode />
              </ProductDemoWrapper>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Fingerprint className="h-7 w-7 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your Privacy Comes First</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We built SafeSuite on one principle: your data is yours. Period.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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

      {/* Three Steps */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get Protected in Minutes</h2>
            <p className="text-muted-foreground">It's as easy as downloading an app.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Smartphone, label: "1. Sign Up Free", description: "Create your account in under a minute. No credit card, no commitment." },
              { icon: RefreshCw, label: "2. Add Your Accounts", description: "Import passwords, add your email for breach monitoring, and run your first scan." },
              { icon: Shield, label: "3. Stay Protected", description: "SafeSuite works quietly in the background — alerting you only when something needs your attention." },
            ].map((step, i) => {
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
            SafeSuite shares a single account with Vanguard and AI Studio.
            Need enterprise IT operations or custom AI tools? They're one click away.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products/vanguard">
              <Button variant="outline" size="sm">Learn about Vanguard</Button>
            </Link>
            <Link to="/products/ai-studio">
              <Button variant="outline" size="sm">Learn about AI Studio</Button>
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
                Protect Your Digital Life Today
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of people who've taken control of their passwords,
                privacy, and peace of mind. Start for free — upgrade when you're ready.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-lg px-8" asChild>
                  <Link to="/auth?return=safesuite">
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing/safesuite">
                    See Plans
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>🇺🇸 Veteran-Owned</span>
                <span>•</span>
                <span>Zero-Knowledge Encryption</span>
                <span>•</span>
                <span>Free Forever Plan</span>
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
