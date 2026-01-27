import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, ArrowRight, Users, Shield, BarChart3, Palette, 
  Building2, Zap, Lock, HeadphonesIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';

const AIStudioForMSPs = () => {
  const benefits = [
    {
      icon: Palette,
      title: "White-Label Delivery",
      description: "Deploy AI assistants under your brand. Your clients see your company, not ours."
    },
    {
      icon: BarChart3,
      title: "Predictable AI Capacity",
      description: "Monthly AI capacity allocation with no surprise costs. Know your margins upfront."
    },
    {
      icon: Users,
      title: "Client-Level Visibility",
      description: "Track usage and performance per client. Full administrative control across your portfolio."
    },
    {
      icon: Shield,
      title: "Enterprise Governance",
      description: "Centralized policy controls, audit logging, and compliance-ready infrastructure."
    },
    {
      icon: Building2,
      title: "Multi-Tenant Architecture",
      description: "Isolated client environments with shared administrative oversight."
    },
    {
      icon: Lock,
      title: "Secure by Design",
      description: "SOC 2 aligned controls, encrypted at rest and in transit, with role-based access."
    }
  ];

  const useCases = [
    "IT Help Desk Automation — Resolve Tier 1 tickets automatically",
    "Client Onboarding Assistants — Guide new users through setup",
    "Knowledge Base Bots — Answer common questions instantly",
    "Security Awareness Training — Interactive AI-driven learning",
    "Compliance Documentation — Generate policy documents on demand",
    "Custom Business Assistants — Trained on client-specific workflows"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#0f0f12]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30">
            <Building2 className="h-3 w-3 mr-1" />
            For Managed Service Providers
          </Badge>
          
          <div className="inline-flex items-center justify-center mb-8">
            <img src={aiStudioLogo} alt="AI Studio" className="h-20 w-auto" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            AI Studio for MSPs
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-4">
            Deliver white-labeled AI assistants to your clients with predictable costs, 
            full governance, and complete visibility.
          </p>
          
          <p className="text-lg text-primary font-medium mb-8">
            A Business AI Control Plane built for service providers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/contact">
                Talk to Us About MSP Plans
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link to="/pricing#ai-studio">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Built for Service Providers
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Everything you need to add AI as a managed service offering.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={i} className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                    <p className="text-white/50 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Deploy in Days, Not Months
            </Badge>
            <h2 className="text-3xl font-bold text-white mb-4">
              AI Assistants Your Clients Will Love
            </h2>
            <p className="text-white/50">
              Start with templates, customize for each client, deploy under your brand.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {useCases.map((useCase, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-lg bg-[#141414] border border-white/10"
              >
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/80">{useCase}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-[#141414] to-primary/10 border-primary/30">
            <CardContent className="p-10 text-center">
              <HeadphonesIcon className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Add AI to Your Service Stack?
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Let's discuss how AI Studio can become a profitable addition to your managed services portfolio. 
                Custom capacity allocations and pricing available.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/contact">
                    Talk to Us About MSP Plans
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
                <span>🇺🇸 Veteran-Owned</span>
                <span>•</span>
                <span>MSP-Focused Since Day One</span>
                <span>•</span>
                <span>Predictable Pricing</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIStudioForMSPs;
