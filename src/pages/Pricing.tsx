import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Building2, 
  Phone,
  Crown,
  Brain,
  Shield,
  Cpu,
  Network,
  Headphones,
  Code,
  Blocks,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <Badge variant="secondary" className="mb-6">
            Flexible Solutions
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight mb-6">
            Pricing That Fits Your Business
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From self-serve AI tools to enterprise security solutions—choose what works for you.
          </p>
        </div>
      </section>

      {/* AI Studio Pricing - Self-Serve */}
      <section id="ai-studio" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Brain className="h-4 w-4 mr-2" />
              Self-Serve Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">AI Studio™</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Build custom AI assistants for your business. No coding required. Start with a free trial.
            </p>
          </div>

          {/* AI Studio Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Starter GPT Plan */}
            <Card className="bg-card border-2 border-border hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription className="text-base">Perfect for small teams</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$99</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "1 Custom GPT assistant",
                    "500 queries per month",
                    "1GB knowledge base storage",
                    "Up to 3 team seats",
                    "Basic analytics",
                    "API access",
                    "Email support"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/ai-studio">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Professional GPT Plan - Most Popular */}
            <Card className="bg-card border-2 border-primary shadow-lg scale-105 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
              
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription className="text-base">For growing businesses</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$499</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "5 Custom GPT assistants",
                    "2,500 queries per month",
                    "5GB knowledge base storage",
                    "Up to 10 team seats",
                    "Advanced analytics",
                    "White-label deployment",
                    "Remove UltriumAI branding",
                    "Priority support",
                    "Advanced integrations"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" asChild>
                  <Link to="/ai-studio">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise GPT Plan */}
            <Card className="bg-card border-2 border-border hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription className="text-base">For large-scale deployments</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">Custom</div>
                  <div className="text-sm text-muted-foreground">Contact for pricing</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    "25+ Custom GPT assistants",
                    "High-volume query limits",
                    "25GB+ data storage",
                    "Unlimited team seats",
                    "Enterprise security & compliance",
                    "Dedicated account manager",
                    "24/7 priority support",
                    "On-premise deployment",
                    "Custom training & setup"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/contact">
                    Contact Sales
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Ultrium Vanguard - Contact for Pricing */}
      <section id="vanguard" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Shield className="h-4 w-4 mr-2" />
              Enterprise Security
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ultrium Vanguard™</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              All-in-one AI-powered security operations platform. Enterprise pricing tailored to your needs.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-card to-primary/5 border-2 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">Complete Security Suite</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Shield, text: "XDR/EDR Threat Detection" },
                      { icon: Network, text: "Network Scanning & Discovery" },
                      { icon: Cpu, text: "Penetration Testing Tools" },
                      { icon: Headphones, text: "AI-Powered Service Desk" },
                      { icon: Check, text: "Security Compliance Monitoring" },
                      { icon: Check, text: "Real-time Threat Intelligence" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col justify-center items-center text-center bg-background/50 rounded-xl p-8">
                  <div className="text-4xl font-bold text-primary mb-2">Enterprise Pricing</div>
                  <p className="text-muted-foreground mb-6">
                    Tailored to your organization's security needs
                  </p>
                  <div className="space-y-3 w-full">
                    <Button className="w-full" size="lg" asChild>
                      <Link to="/contact">
                        Request Demo & Pricing
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <a href="https://vanguard.ultriumai.com" target="_blank" rel="noopener noreferrer">
                        Explore Vanguard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Custom Development Services */}
      <section id="custom" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Code className="h-4 w-4 mr-2" />
              We Build It For You
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Custom AI Development</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Need something built specifically for your business? Our team creates custom solutions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Brain, title: "Custom GPT Training", desc: "AI assistants trained on your data" },
              { icon: Blocks, title: "API Integrations", desc: "Connect to your existing systems" },
              { icon: Building2, title: "White-Label Solutions", desc: "Your brand, our technology" },
              { icon: Users, title: "Dedicated Support", desc: "Hands-on implementation help" }
            ].map((service, i) => (
              <Card key={i} className="text-center p-6 hover:border-primary/40 transition-all">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.desc}</p>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" asChild>
              <Link to="/contact">
                Schedule Free Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-purple-600/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Not sure which solution is right for you? Let's talk.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="tel:804-821-1410">
                <Phone className="w-5 h-5" />
                804-821-1410
              </a>
            </Button>
            <Button size="lg" asChild>
              <Link to="/contact">
                Schedule a Call
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>🇺🇸 Veteran-Owned</span>
            <span>•</span>
            <span>15+ Years IT Experience</span>
            <span>•</span>
            <span>Security-First Approach</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
