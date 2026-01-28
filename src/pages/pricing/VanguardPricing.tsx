import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Radar, Server, Cloud, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { useAuth } from "@/hooks/useAuth";

const VanguardPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/vanguard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-red-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-orange-500/20 mb-6">
            <img src={vanguardLogo} alt="Vanguard" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            Vanguard Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Enterprise security monitoring and compliance platform with AI-powered threat detection.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <Card className="border-border/50 hover:border-orange-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground text-sm mb-6">For small teams getting started</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Up to 25 endpoints",
                    "Basic threat detection",
                    "7-day log retention",
                    "Email alerts",
                    "Community support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>

            {/* Professional - Popular */}
            <Card className="border-2 border-orange-500/50 relative shadow-xl shadow-orange-500/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white">
                Most Popular
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Professional</h3>
                <p className="text-muted-foreground text-sm mb-6">For growing security teams</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-orange-500">$499</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Up to 100 endpoints",
                    "AI-powered threat detection",
                    "30-day log retention",
                    "SIEM integrations",
                    "Compliance reports",
                    "Priority support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleGetStarted}>
                  Start Pro Trial
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/50 hover:border-orange-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground text-sm mb-6">For large organizations</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">Custom</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Unlimited endpoints",
                    "Advanced AI analytics",
                    "1-year log retention",
                    "Custom integrations",
                    "Dedicated SOC support",
                    "SLA guarantee",
                    "On-premise option",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Enterprise-grade security features</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Real-time protection", desc: "24/7 threat monitoring" },
              { icon: Radar, title: "AI threat detection", desc: "ML-powered analysis" },
              { icon: Server, title: "Endpoint security", desc: "Full device protection" },
              { icon: Cloud, title: "Cloud security", desc: "Secure cloud workloads" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VanguardPricing;
