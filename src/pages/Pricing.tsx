import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, ArrowRight, Mail, Brain, Shield, Sparkles, Users, Zap, Lock
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#0f0f12] safe-area-inset-bottom overflow-hidden">
      <Navigation />
      
      {/* Hero Section - Premium with animated orbs */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[700px] md:h-[700px] lg:w-[900px] lg:h-[900px] bg-primary/8 rounded-full blur-[80px] sm:blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-emerald-500/10 rounded-full blur-[60px] sm:blur-[80px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 right-0 w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] bg-cyan-500/10 rounded-full blur-[40px] sm:blur-[60px] animate-[pulse_5s_ease-in-out_infinite]" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-primary/30 rounded-full animate-float" />
          <div className="absolute top-40 right-[15%] w-1.5 h-1.5 bg-emerald-400/40 rounded-full animate-float delay-1000" />
          <div className="absolute bottom-32 left-[20%] w-1 h-1 bg-cyan-400/50 rounded-full animate-float delay-2000" />
          <div className="absolute top-60 right-[25%] w-2.5 h-2.5 bg-primary/20 rounded-full animate-float delay-500" />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-6 sm:mb-8 backdrop-blur-sm animate-fade-in group hover:border-primary/30 transition-colors">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent px-2 animate-fade-in-up">
            Choose Your Plan
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed px-4 animate-fade-in-up stagger-1">
            From personal security tools to enterprise AI platforms—find the perfect fit for your needs.
          </p>
        </div>
      </section>

      {/* SafeSuite Section */}
      <section id="safesuite" className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center px-6 sm:px-10 py-3 sm:py-5 bg-black rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-500/30 mb-4 sm:mb-6">
              <img src={safesuiteLogo} alt="SafeSuite" className="h-16 sm:h-24 w-auto" />
            </div>
            <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto px-4">
              Personal & SMB security toolkit with password vault, threat scanning, and dark web monitoring.
            </p>
          </div>

          {/* Horizontal scroll on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Free */}
            <Card className="bg-[#141414] border-white/10 hover:border-emerald-500/30 transition-all hover-lift">
              <CardContent className="p-5 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Free</h3>
                <p className="text-white/50 text-xs sm:text-sm mb-4 sm:mb-6">Get started with essential security</p>
                
                <div className="mb-6 sm:mb-8">
                  <span className="text-3xl sm:text-4xl font-bold text-white">$0</span>
                  <span className="text-white/50 text-sm">/month</span>
                </div>

                <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                  {[
                    "25 password entries",
                    "5 threat scans/month",
                    "Basic dark web alerts",
                    "Browser extension",
                    "Mobile app access",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-5 sm:p-8 pt-0">
                <Button variant="outline" className="w-full h-11 sm:h-10 border-white/20 text-white hover:bg-white/10 touch-target tap-scale" asChild>
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

            {/* Enterprise */}
            <Card className="bg-[#141414] border-white/10 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-white/50 text-sm mb-6">For large organizations</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-white">$45</span>
                  <span className="text-white/50">/user/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Business",
                    "1,500 password entries",
                    "1,500 threat scans/month",
                    "150 monitored assets",
                    "Up to 60 team members",
                    "Custom integrations",
                    "Dedicated account manager",
                    "SLA guarantee",
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

      {/* AI Studio Section - Three Markets */}
      <section id="ai-studio" className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-10 py-5 bg-black rounded-2xl shadow-lg shadow-primary/30 mb-6">
              <img src={aiStudioLogo} alt="AI Studio" className="h-24 w-auto" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">AI Studio — A Business AI Control Plane</h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto mb-4">
              Build, deploy, and govern AI assistants with predictable cost, enterprise controls, and full visibility.
            </p>
            <p className="text-sm text-white/40">
              Predictable AI capacity • Full governance • Enterprise-ready
            </p>
          </div>

          {/* MSP / IT Firms */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">For MSPs & IT Firms</Badge>
              <h3 className="text-2xl font-bold text-white mb-2">Turn AI Into a Managed Service</h3>
              <p className="text-white/50 text-sm max-w-xl mx-auto">
                Deliver white-labeled AI assistants to your clients with predictable costs and complete control.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* MSP Starter */}
              <Card className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">MSP Starter</h3>
                  <p className="text-white/50 text-xs mb-4">Get started with client AI</p>
                  
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-white">$99</span>
                    <span className="text-white/50 text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-primary mb-4">Included monthly AI capacity</p>

                  <div className="space-y-2 mb-6">
                    {[
                      "5 Custom GPTs",
                      "Client allocation",
                      "White-label branding",
                      "Per-client analytics",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-xs text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                    <Link to="/dashboard">Start Trial</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* MSP Pro - Popular */}
              <Card className="bg-[#141414] border-2 border-primary/50 relative shadow-xl shadow-primary/10">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs">
                  Popular
                </Badge>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">MSP Pro</h3>
                  <p className="text-white/50 text-xs mb-4">Scale with your clients</p>
                  
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-primary">$249</span>
                    <span className="text-white/50 text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-primary mb-4">Expanded AI capacity for scale</p>

                  <div className="space-y-2 mb-6">
                    {[
                      "25 Custom GPTs",
                      "Multi-client mgmt",
                      "API & webhooks",
                      "Priority support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-xs text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90" asChild>
                    <Link to="/dashboard">Start Trial</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* MSP Elite */}
              <Card className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">MSP Elite</h3>
                  <p className="text-white/50 text-xs mb-4">Enterprise capacity</p>
                  
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-white">$499</span>
                    <span className="text-white/50 text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-primary mb-4">Enterprise-grade AI capacity</p>

                  <div className="space-y-2 mb-6">
                    {[
                      "Unlimited GPTs",
                      "Unlimited clients",
                      "Dedicated manager",
                      "SLA guarantee",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-xs text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="outline" size="sm" className="w-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                    <Link to="/dashboard">Start Trial</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Platform Pro */}
              <Card className="bg-[#141414] border-white/10 hover:border-primary/30 transition-all">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2">Platform Pro</h3>
                  <p className="text-white/50 text-xs mb-4">Maximum capacity</p>
                  
                  <div className="mb-1">
                    <span className="text-3xl font-bold text-white">$999</span>
                    <span className="text-white/50 text-sm">/mo</span>
                  </div>
                  <p className="text-sm text-primary mb-4">Maximum AI capacity allocation</p>

                  <div className="space-y-2 mb-6">
                    {[
                      "Everything in Elite",
                      "Custom integrations",
                      "Capacity rollover",
                      "24/7 support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="text-xs text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10" asChild>
                    <Link to="/dashboard">Start Trial</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Internal Business Teams */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-violet-500/20 text-violet-400 border-violet-500/30">For Internal Teams</Badge>
              <h3 className="text-2xl font-bold text-white mb-2">Your Company's Private AI</h3>
              <p className="text-white/50 text-sm max-w-xl mx-auto">
                Predictable monthly AI usage with no surprise costs.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Team Basic */}
              <Card className="bg-[#141414] border-white/10 hover:border-violet-500/30 transition-all">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">Team Basic</h3>
                  <p className="text-white/50 text-sm mb-6">Predictable AI for small teams</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">$49</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-sm text-violet-400 mb-6">Included monthly AI capacity</p>

                  <div className="space-y-3 mb-8">
                    {[
                      "3 Custom GPTs",
                      "5 team members",
                      "Knowledge base upload",
                      "Usage dashboard",
                      "Email support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-violet-400 flex-shrink-0" />
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

              {/* Team Plus */}
              <Card className="bg-[#141414] border-2 border-violet-500/50 relative shadow-xl shadow-violet-500/10">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white">
                  Best Value
                </Badge>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">Team Plus</h3>
                  <p className="text-white/50 text-sm mb-6">Extended capacity for growing teams</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-violet-400">$149</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-sm text-violet-400 mb-6">Expanded AI capacity for teams</p>

                  <div className="space-y-3 mb-8">
                    {[
                      "10 Custom GPTs",
                      "25 team members",
                      "Advanced analytics",
                      "API access",
                      "Priority support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-violet-400 flex-shrink-0" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button className="w-full bg-violet-500 hover:bg-violet-600" asChild>
                    <Link to="/dashboard">
                      Start Free Trial
                      <Users className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Team Enterprise */}
              <Card className="bg-[#141414] border-white/10 hover:border-violet-500/30 transition-all">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">Team Enterprise</h3>
                  <p className="text-white/50 text-sm mb-6">Custom for large organizations</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">Custom</span>
                  </div>
                  <p className="text-sm text-violet-400 mb-6">Custom AI capacity</p>

                  <div className="space-y-3 mb-8">
                    {[
                      "Unlimited GPTs",
                      "Unlimited team members",
                      "SSO integration",
                      "Dedicated support",
                      "SLA guarantee",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-violet-400 flex-shrink-0" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button variant="outline" className="w-full border-violet-500/50 text-violet-400 hover:bg-violet-500/10" asChild>
                    <Link to="/contact">
                      Contact Sales
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Website / Embedded GPTs */}
          <div>
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">For Websites</Badge>
              <h3 className="text-2xl font-bold text-white mb-2">Website AI Assistants</h3>
              <p className="text-white/50 text-sm max-w-xl mx-auto">
                A smart website assistant without spam or runaway costs. Designed for lead generation, not unlimited chat.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Website Basic */}
              <Card className="bg-[#141414] border-white/10 hover:border-emerald-500/30 transition-all">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">Website Basic</h3>
                  <p className="text-white/50 text-sm mb-6">Smart website assistant</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">$29</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-sm text-emerald-400 mb-6">Included monthly AI capacity</p>

                  <div className="space-y-3 mb-8">
                    {[
                      "1 Embedded GPT",
                      "Website chat widget",
                      "Lead capture forms",
                      "5 messages per visitor",
                      "IP/session rate limiting",
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
                    <Link to="/dashboard">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Website Pro */}
              <Card className="bg-[#141414] border-2 border-emerald-500/50 relative shadow-xl shadow-emerald-500/10">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                  Best for Lead Gen
                </Badge>
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">Website Pro</h3>
                  <p className="text-white/50 text-sm mb-6">High-volume lead generation</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-emerald-400">$79</span>
                    <span className="text-white/50">/month</span>
                  </div>
                  <p className="text-sm text-emerald-400 mb-6">Expanded AI capacity for lead gen</p>

                  <div className="space-y-3 mb-8">
                    {[
                      "3 Embedded GPTs",
                      "Custom branding",
                      "CRM integrations",
                      "Conversation analytics",
                      "Priority support",
                      "White-label option",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/70">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600" asChild>
                    <Link to="/dashboard">
                      Start Free Trial
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-br from-[#141414] to-primary/10 border-primary/30 max-w-2xl mx-auto">
              <CardContent className="p-10">
                <h3 className="text-2xl font-bold text-white mb-4">Enterprise & Custom Solutions</h3>
                <p className="text-white/60 mb-6">
                  Need more? Custom AI capacity allocation, on-premise deployment, dedicated support, and SLA guarantees available.
                </p>
                <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10" asChild>
                  <Link to="/contact">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
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
                      <Link to="/products/vanguard">
                        Explore Vanguard
                      </Link>
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
              <a href="mailto:support@ultriumai.com">
                <Mail className="mr-2 h-5 w-5" />
                Email Us
              </a>
            </Button>
            <Button size="lg" asChild>
              <Link to="/contact">
                Contact Us
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
