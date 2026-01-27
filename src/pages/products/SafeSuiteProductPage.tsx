import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, User, Building2, Check, Zap, Lock, Heart, Smartphone, Shield, Eye, RefreshCw, Play } from "lucide-react";
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

const SafeSuiteProductPage = () => {
  const audiences = [
    {
      icon: User,
      title: "Individuals & Families",
      description: "Protect your personal accounts, passwords, and digital identity with simple, modern tools. No technical expertise required — just security that works."
    },
    {
      icon: Building2,
      title: "Small & Medium Businesses",
      description: "Secure your team's credentials and monitor for threats without enterprise complexity or enterprise pricing. Right-sized security for growing organizations."
    }
  ];

  const features = [
    {
      logo: safepassLogo,
      title: "SafePass™ — Password Vault",
      description: "Secure password storage with autofill, secure sharing, and breach monitoring. Never forget a password or reuse weak credentials again.",
      highlights: ["Encrypted vault", "Browser extension", "Secure sharing", "Breach alerts"]
    },
    {
      logo: safescanLogo,
      title: "SafeScan™ — Threat Scanning",
      description: "Scan your devices and networks for vulnerabilities, malware, and security misconfigurations. Know your risk before attackers do.",
      highlights: ["Device scanning", "Network analysis", "Risk scoring", "Remediation guides"]
    },
    {
      logo: safewebLogo,
      title: "SafeWeb™ — Dark Web Monitoring",
      description: "24/7 monitoring of the dark web for leaked credentials, data breaches, and identity exposure. Get alerted before criminals can act.",
      highlights: ["Credential monitoring", "Breach detection", "Identity alerts", "Exposure reports"]
    },
    {
      logo: safetrackLogo,
      title: "SafeTrack™ — Asset Management",
      description: "Keep track of your devices, software licenses, and digital assets in one simple dashboard. Know what you own and its security status.",
      highlights: ["Device inventory", "License tracking", "Warranty alerts", "Security status"]
    },
    {
      logo: safeassistLogo,
      title: "SafeAssist™ — AI Security Assistant",
      description: "Get plain-language security guidance and threat analysis powered by AI. Your personal security advisor available 24/7.",
      highlights: ["Security guidance", "Threat explanations", "Best practices", "Incident help"]
    }
  ];

  const benefits = [
    "No enterprise complexity — just simple, effective security",
    "Modern design that anyone can understand and use",
    "Affordable pricing for individuals and small teams",
    "All-in-one bundle — no need to buy separate tools",
    "Works seamlessly across all your devices",
    "Privacy-first approach — your data stays yours",
    "No long-term contracts or hidden fees",
    "Free tier available to get started immediately"
  ];

  const comparisonPoints = [
    {
      title: "vs. Enterprise Security Suites",
      points: [
        "No complex deployment or IT involvement required",
        "Pricing that makes sense for individuals and SMBs",
        "Simple interface without overwhelming options",
        "Get started in minutes, not months"
      ]
    },
    {
      title: "vs. Free Password Managers",
      points: [
        "Comprehensive security beyond just passwords",
        "Dark web monitoring included",
        "AI-powered security guidance",
        "Device and asset tracking in one place"
      ]
    }
  ];

  const howItWorks = [
    {
      icon: Smartphone,
      title: "1. Sign Up",
      description: "Create your account in under a minute. No credit card required for the free tier."
    },
    {
      icon: RefreshCw,
      title: "2. Import & Scan",
      description: "Import existing passwords and run your first security scan to see where you stand."
    },
    {
      icon: Shield,
      title: "3. Get Protected",
      description: "Follow simple recommendations to close security gaps and enable monitoring."
    },
    {
      icon: Eye,
      title: "4. Stay Informed",
      description: "Receive alerts about new threats, breaches, and security recommendations."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="SafeSuite — Simple, Modern Security for People & Small Teams | UltriumAI"
        description="Password management, threat scanning, and dark web monitoring — all in one easy-to-use bundle. No enterprise complexity. Just protection that works for individuals and SMBs."
        canonicalPath="/products/safesuite"
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Heart className="h-3 w-3 mr-1" />
            Security Made Simple
          </Badge>
          
          <div className="flex items-center justify-center mb-8">
            <div className="h-48 w-80 rounded-3xl bg-black p-6 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            SafeSuite — Simple, Modern Security
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Password management, threat scanning, and dark web monitoring — 
            all in one easy-to-use bundle.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            No enterprise complexity. Just protection that works.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" asChild>
              <Link to="/auth">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing#safesuite">
                View Plans
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What is SafeSuite */}
      <section className="py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">What is SafeSuite?</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            SafeSuite is a <strong className="text-foreground">Personal & SMB Security Suite</strong> that bundles 
            the essential security tools everyone needs into one simple package. Instead of juggling separate 
            password managers, scanning tools, and monitoring services, SafeSuite gives you everything in one 
            place — with a modern interface that anyone can use.
          </p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Who It's For</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              SafeSuite is designed for people and small teams who want effective 
              security without the complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {audiences.map((audience, i) => {
              const IconComponent = audience.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-7 w-7 text-emerald-500" />
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

      {/* Core Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              All-in-One Bundle
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What's Included</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Five powerful tools in one simple package.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-card border-border/50 hover:border-emerald-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="w-36 h-20 rounded-xl bg-black flex items-center justify-center mb-4 p-3">
                    <img 
                      src={feature.logo} 
                      alt={feature.title} 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {feature.highlights.map((highlight, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Getting protected takes minutes, not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => {
              const IconComponent = step.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-7 w-7 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </div>
              );
            })}
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
              Explore interactive demos of each SafeSuite tool. No signup required.
            </p>
          </div>

          <Tabs defaultValue="safepass" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="safepass" className="flex items-center gap-2">
                <img src={safepassLogo} alt="" className="h-4 w-auto" />
                SafePass
              </TabsTrigger>
              <TabsTrigger value="safeweb" className="flex items-center gap-2">
                <img src={safewebLogo} alt="" className="h-4 w-auto" />
                SafeWeb
              </TabsTrigger>
              <TabsTrigger value="safetrack" className="flex items-center gap-2">
                <img src={safetrackLogo} alt="" className="h-4 w-auto" />
                SafeTrack
              </TabsTrigger>
              <TabsTrigger value="safeassist" className="flex items-center gap-2">
                <img src={safeassistLogo} alt="" className="h-4 w-auto" />
                SafeAssist
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

      {/* Why SafeSuite */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose SafeSuite</h2>
            <p className="text-muted-foreground">
              Security should be simple. We made it that way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50"
              >
                <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How SafeSuite Compares</h2>
            <p className="text-muted-foreground">
              The right balance of features and simplicity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {comparisonPoints.map((comparison, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">{comparison.title}</h3>
                  <ul className="space-y-2">
                    {comparison.points.map((point, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
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

      {/* Part of UltriumAI */}
      <section className="py-16 px-4 border-y border-border/50 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Part of the UltriumAI Platform</h2>
          <p className="text-muted-foreground mb-6">
            SafeSuite is part of the broader UltriumAI ecosystem. For organizations needing 
            enterprise security operations or AI-powered business tools, explore our 
            Vanguard and AI Studio products.
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-emerald-500/10 border-emerald-500/30">
            <CardContent className="p-10 text-center">
              <Lock className="h-12 w-12 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Protect Yourself?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Start with our free tier and upgrade when you're ready. 
                No credit card required. No complicated setup.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" asChild>
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing#safesuite">
                    View Plans
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
                <span>Privacy-First</span>
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