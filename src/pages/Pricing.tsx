import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, ArrowRight, Phone, Brain, Shield, Sparkles, Users, Zap, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <Badge className="mb-6 bg-white/10 text-white/80 border-white/20">Simple, Transparent Pricing</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            From personal security tools to enterprise AI platforms—find the perfect fit for your needs.
          </p>
        </div>
      </section>

      {/* SafeSuite Section */}
      <section id="safesuite" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-10 py-5 bg-black rounded-2xl shadow-lg shadow-emerald-500/30 mb-6">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-24 w-auto" />
            </div>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Personal & SMB security toolkit with password vault, threat scanning, and dark web monitoring.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="bg-[#141414] border-white/10 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Free</h3>
                <p className="text-white/50 text-sm mb-6">Get started with essential security</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "25 password entries",
                    "5 threat scans/month",
                    "Basic dark web alerts",
                    "Browser extension",
                    "Mobile app access",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                  <Link to="/auth">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Pro - Popular */}
            <Card className="bg-[#141414] border-2 border-emerald-500/50 relative scale-105 shadow-xl shadow-emerald-500/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                Most Popular
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
                <p className="text-white/50 text-sm mb-6">For individuals who need more</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-emerald-400">$9.99</span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Unlimited passwords",
                    "100 threat scans/month",
                    "5 monitored assets",
                    "Priority dark web alerts",
                    "Secure file storage (1GB)",
                    "Priority support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" asChild>
                  <Link to="/safesuite/billing">
                    Upgrade to Pro
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Business */}
            <Card className="bg-[#141414] border-white/10 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Business</h3>
                <p className="text-white/50 text-sm mb-6">For teams and organizations</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$15</span>
                  <span className="text-white/50">/user/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Pro",
                    "Unlimited team members",
                    "Shared password vaults",
                    "Admin controls & audit logs",
                    "SSO integration",
                    "Dedicated support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" asChild>
                  <Link to="/safesuite/billing">
                    Start Business Trial
                    <Users className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Studio Section */}
      <section id="ai-studio" className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-10 py-5 bg-black rounded-2xl shadow-lg shadow-primary/30 mb-6">
              <img src={aiStudioLogo} alt="AI Studio" className="h-24 w-auto" />
            </div>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Build custom GPT assistants trained on your data. No coding required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter */}
            <Card className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <p className="text-white/50 text-sm mb-6">For small teams getting started</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "1 Custom GPT",
                    "500 queries/month",
                    "1GB knowledge base",
                    "3 team seats",
                    "API access",
                    "Email support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                  <Link to="/dashboard">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Professional */}
            <Card className="bg-[#141414] border-2 border-primary/50 relative scale-105 shadow-xl shadow-primary/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white">
                Most Popular
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                <p className="text-white/50 text-sm mb-6">For growing businesses</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-primary">$499</span>
                  <span className="text-white/50">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "5 Custom GPTs",
                    "2,500 queries/month",
                    "5GB knowledge base",
                    "10 team seats",
                    "White-label deployment",
                    "Priority support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                  <Link to="/dashboard">
                    Start Free Trial
                    <Brain className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise */}
            <Card className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-white/50 text-sm mb-6">For large-scale deployments</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "25+ Custom GPTs",
                    "Unlimited queries",
                    "25GB+ storage",
                    "Unlimited seats",
                    "On-premise deployment",
                    "24/7 dedicated support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                  <Link to="/contact">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Vanguard Section */}
      <section id="vanguard" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-6 py-3 bg-black rounded-xl shadow-lg shadow-cyan-500/20 mb-6">
              <img src={vanguardLogo} alt="Vanguard" className="h-12 w-auto" />
            </div>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Enterprise AI-powered cybersecurity operations platform for MSPs and large organizations.
            </p>
          </div>

          <Card className="bg-gradient-to-br from-[#141414] to-cyan-500/5 border-cyan-500/30">
            <CardContent className="p-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div>
                  <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                    <Shield className="h-3 w-3 mr-1" />
                    Enterprise Security
                  </Badge>
                  <h3 className="text-3xl font-bold text-white mb-4">Complete Security Suite</h3>
                  <p className="text-white/50 mb-6">
                    Everything you need to protect your organization with AI-powered threat detection and response.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "XDR/EDR Detection",
                      "SIEM & Log Analysis",
                      "Compliance Monitoring",
                      "Vulnerability Scanning",
                      "AI Security Copilot",
                      "Managed SOC Services",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-center items-center text-center bg-black/50 rounded-2xl p-8 border border-cyan-500/20">
                  <Lock className="h-10 w-10 text-cyan-400 mb-4" />
                  <h4 className="text-2xl font-bold text-white mb-2">Enterprise Pricing</h4>
                  <p className="text-white/50 mb-6 text-sm">
                    Tailored to your organization's security requirements
                  </p>
                  <div className="space-y-3 w-full">
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white" asChild>
                      <Link to="/contact">
                        Request Demo & Quote
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" asChild>
                      <a href="https://vanguard.ultriumai.com">
                        Explore Vanguard
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not Sure Which Plan?</h2>
          <p className="text-white/50 mb-8">
            Let's talk about your needs. We'll help you find the perfect solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <a href="tel:888-884-1410">
                <Phone className="mr-2 h-5 w-5" />
                888-884-1410
              </a>
            </Button>
            <Button size="lg" asChild>
              <Link to="/contact">
                Schedule a Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
            <span>🇺🇸 Veteran-Owned</span>
            <span>•</span>
            <span>15+ Years IT Experience</span>
            <span>•</span>
            <span>Security-First</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
