import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Building2, Shield, Headphones, Monitor, Lock,
  BarChart3, FileCheck, AlertTriangle, Users, Zap, Check, Brain
} from "lucide-react";
import { Link } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { SEOHead } from "@/components/SEOHead";

const VanguardProductPage = () => {
  const audiences = [
    {
      icon: Building2,
      title: "Managed Service Providers",
      description: "Unify security and operations tooling into a single platform for your clients."
    },
    {
      icon: Users,
      title: "IT Teams",
      description: "Streamline endpoint management, helpdesk, and threat detection in one place."
    },
    {
      icon: Shield,
      title: "Regulated Businesses",
      description: "Meet compliance requirements with built-in audit trails and security controls."
    }
  ];

  const products = [
    {
      icon: Monitor,
      title: "SafeOps™ RMM",
      description: "Remote monitoring and management with real-time endpoint visibility, patching, and automation.",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      icon: Headphones,
      title: "SafeDesk™ Helpdesk",
      description: "AI-powered IT service desk with smart routing, SLA management, and automated resolutions.",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    {
      icon: AlertTriangle,
      title: "Threat Detection",
      description: "AI-driven threat detection and response with real-time alerting and automated remediation.",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: FileCheck,
      title: "Compliance Tooling",
      description: "Built-in frameworks for SOC 2, HIPAA, PCI DSS, and NIST with automated evidence collection.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      icon: BarChart3,
      title: "Security Analytics",
      description: "Comprehensive dashboards and reporting for security posture and operational metrics.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: Lock,
      title: "Endpoint Security",
      description: "Unified endpoint protection with vulnerability scanning and configuration management.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  const differentiators = [
    "AI-driven insights across security and operations",
    "Unified platform — no tool sprawl",
    "Built for MSPs with multi-tenant architecture",
    "Real-time threat detection and response",
    "Integrated compliance and audit tooling",
    "Predictable pricing for service providers"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <SEOHead
        title="Vanguard — AI-Powered Security & Operations | UltriumAI"
        description="A unified platform combining RMM, helpdesk, threat detection, and compliance tooling — all powered by AI. Built for MSPs, IT teams, and security-conscious organizations."
        canonicalPath="/products/vanguard"
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered Security & Operations
          </Badge>
          
          <div className="inline-flex items-center justify-center mb-8">
            <div className="h-28 w-44 rounded-2xl bg-black p-4 flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <img src={vanguardLogo} alt="Vanguard" className="h-full w-full object-contain" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            Vanguard — AI-Powered Security & Operations
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            A unified platform combining RMM, helpdesk, threat detection, and compliance 
            tooling — all powered by AI. Built for MSPs, IT teams, and security-conscious organizations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
              <Link to="/contact">
                Request a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">
                Contact Sales
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
              Vanguard serves organizations that need unified security and operations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, i) => {
              const IconComponent = audience.icon;
              return (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-7 w-7 text-cyan-500" />
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

      {/* Products Included */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Unified Platform
            </Badge>
            <h2 className="text-3xl font-bold mb-4">What's Included</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to secure and manage IT infrastructure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => {
              const IconComponent = product.icon;
              return (
                <Card key={i} className="bg-card border-border/50 hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg ${product.bgColor} flex items-center justify-center mb-4`}>
                      <IconComponent className={`h-6 w-6 ${product.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                    <p className="text-muted-foreground text-sm">{product.description}</p>
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
            <h2 className="text-3xl font-bold mb-4">What Makes Vanguard Different</h2>
            <p className="text-muted-foreground">
              AI-driven, unified, and built for scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {differentiators.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50"
              >
                <Check className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{item}</span>
              </div>
            ))}
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
                Ready to Unify Security & Operations?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                See how Vanguard can transform your IT operations with AI-powered 
                insights, unified tooling, and enterprise-grade security.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:opacity-90" asChild>
                  <Link to="/contact">
                    Request a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <span>🇺🇸 Veteran-Owned</span>
                <span>•</span>
                <span>MSP-Focused</span>
                <span>•</span>
                <span>AI-Powered</span>
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
