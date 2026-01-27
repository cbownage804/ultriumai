import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Building2, Users, Globe, Shield, BarChart3, 
  Palette, Lock, Zap, Check, Settings, Bot
} from "lucide-react";
import { Link } from "react-router-dom";
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';

const AIStudioProductPage = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Managed Service Providers",
      description: "Deliver white-labeled AI assistants to clients with predictable margins and full governance."
    },
    {
      icon: Users,
      title: "Internal Teams",
      description: "Deploy AI assistants for HR, IT, sales, and operations with enterprise-grade controls."
    },
    {
      icon: Globe,
      title: "Websites & Lead Generation",
      description: "Embed intelligent chatbots that qualify leads and answer visitor questions 24/7."
    }
  ];

  const capabilities = [
    {
      icon: Bot,
      title: "Build Custom AI Assistants",
      description: "Create purpose-built assistants trained on your data, workflows, and brand voice."
    },
    {
      icon: Shield,
      title: "Enterprise Governance",
      description: "Centralized policy controls, audit logging, and compliance-ready infrastructure."
    },
    {
      icon: BarChart3,
      title: "Predictable AI Capacity",
      description: "Monthly capacity allocation with no surprise costs. Know your usage upfront."
    },
    {
      icon: Palette,
      title: "White-Label Branding",
      description: "Full customization of colors, logos, and messaging to match your brand identity."
    },
    {
      icon: Settings,
      title: "Admin Analytics & Control",
      description: "Track performance, manage deployments, and control access across your organization."
    },
    {
      icon: Lock,
      title: "Secure by Design",
      description: "SOC 2 aligned controls, encrypted at rest and in transit, with role-based access."
    }
  ];

  const differentiators = [
    "Not a consumer chatbot — built for business governance",
    "Predictable capacity model — no per-message surprises",
    "Multi-tenant architecture for MSPs and agencies",
    "Full administrative oversight and audit trails",
    "Deploy in days, not months",
    "Train on your own data and documents"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
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
          
          <div className="inline-flex items-center justify-center mb-8">
            <div className="h-24 w-24 rounded-2xl bg-black p-2 flex items-center justify-center shadow-xl shadow-primary/20">
              <img src={aiStudioLogo} alt="AI Studio" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            AI Studio — A Business AI Control Plane
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Build, deploy, and govern AI assistants with predictable cost, 
            enterprise controls, and full visibility. Not a chatbot toy — 
            a platform built for business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/pricing#ai-studio">
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Talk to Us
              </Link>
            </Button>
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

      {/* Capabilities */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Settings className="h-3 w-3 mr-1" />
              Key Capabilities
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What AI Studio Does</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to deploy AI at scale with confidence.
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

      {/* MSP CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-card to-primary/10 border-primary/30">
            <CardContent className="p-10 text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">
                Are You an MSP?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Learn how AI Studio can become a profitable addition to your managed services portfolio 
                with white-label delivery, predictable margins, and client-level visibility.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/ai-studio-for-msps">
                    AI Studio for MSPs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            See how AI Studio can transform your organization with governed, scalable AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/pricing#ai-studio">
                View Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Talk to Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIStudioProductPage;
