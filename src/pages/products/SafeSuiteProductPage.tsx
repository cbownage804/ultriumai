import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Building2, Check, Zap, Lock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { safesuiteLogo, safeSuiteProducts } from "@/components/safesuite/SafeSuiteProductIcons";
import safepassLogo from "@/assets/safepass-logo.png";
import safescanLogo from "@/assets/safescan-logo.png";
import safewebLogo from "@/assets/safeweb-logo.png";
import safetrackLogo from "@/assets/safetrack-logo.png";
import safeassistLogo from "@/assets/safeassist-logo-horizontal.png";
import { SEOHead } from "@/components/SEOHead";

const SafeSuiteProductPage = () => {
  const audiences = [
    {
      icon: User,
      title: "Individuals",
      description: "Protect your personal accounts, passwords, and digital identity with simple, modern tools."
    },
    {
      icon: Building2,
      title: "Small & Medium Businesses",
      description: "Secure your team's credentials and monitor for threats without enterprise complexity."
    }
  ];

  const features = [
    {
      logo: safepassLogo,
      title: "SafePass™ — Password Vault",
      description: "Secure password storage with autofill, sharing, and breach monitoring. Never forget a password again."
    },
    {
      logo: safescanLogo,
      title: "SafeScan™ — Threat Scanning",
      description: "Scan your devices and networks for vulnerabilities, malware, and security misconfigurations."
    },
    {
      logo: safewebLogo,
      title: "SafeWeb™ — Dark Web Monitoring",
      description: "24/7 monitoring of the dark web for leaked credentials, data breaches, and identity exposure."
    },
    {
      logo: safetrackLogo,
      title: "SafeTrack™ — Asset Management",
      description: "Keep track of your devices, software licenses, and digital assets in one simple dashboard."
    },
    {
      logo: safeassistLogo,
      title: "SafeAssist™ — AI Security Assistant",
      description: "Get plain-language security guidance and threat analysis powered by AI. Your personal security advisor."
    }
  ];

  const benefits = [
    "No enterprise complexity — just simple, effective security",
    "Modern design that's easy to understand and use",
    "Affordable pricing for individuals and small teams",
    "All-in-one bundle — password vault, scanning, monitoring, and AI assistance",
    "Works across all your devices",
    "Privacy-first approach — your data stays yours"
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
          
          <div className="inline-flex items-center justify-center mb-8">
            <div className="h-28 w-44 rounded-2xl bg-black p-4 flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            SafeSuite — Simple, Modern Security for People & Small Teams
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Password management, threat scanning, and dark web monitoring — 
            all in one easy-to-use bundle. No enterprise complexity. 
            Just protection that works.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600" asChild>
              <Link to="/safesuite/auth">
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
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
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
                  <Link to="/safesuite/auth">
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
