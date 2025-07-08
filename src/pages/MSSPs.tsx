import { Shield, Lock, AlertTriangle, Eye, CheckCircle, Star, ArrowRight, Zap, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SolutionPurchaseButton } from "@/components/SolutionPurchaseButton";

const MSSPs = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Security Knowledge Hub",
      description: "Centralize your security documentation and procedures with AI-powered search"
    },
    {
      icon: Eye,
      title: "Threat Intelligence Guide",
      description: "AI trained on security best practices to guide your team's response"
    },
    {
      icon: Zap,
      title: "Quick Response Guidance",
      description: "Instant access to incident playbooks and security procedures"
    },
    {
      icon: BarChart3,
      title: "Security Reporting",
      description: "Basic security scanning results and client-ready reports"
    }
  ];

  const securitySolutions = [
    {
      id: "security-knowledge",
      title: "Security Knowledge Base",
      description: "Train AI on your security documentation and procedures for instant threat response guidance",
      features: ["Incident playbooks", "Threat identification", "Response procedures", "Documentation search"],
      price: "Starting at $100/month (5 users)",
      popular: true
    },
    {
      id: "security-apps",
      title: "Security Apps Suite",
      description: "Collection of AI-powered security scanning tools for basic threat detection",
      features: ["Email scanning", "URL analysis", "Document checks", "Basic reporting"],
      price: "Starting at $175/month (5 users)",
      popular: false
    },
    {
      id: "security-portal",
      title: "Client Security Portal",
      description: "White-label security dashboard for your clients with basic security insights",
      features: ["Branded interface", "Security tips", "Basic monitoring", "Client reporting"],
      price: "Starting at $175/month (5 users)",
      popular: false
    }
  ];

  const securityApps = [
    { name: "SafeMail™", description: "Email threat detection" },
    { name: "SafeLink™", description: "URL security scanning" },
    { name: "SafeDoc™", description: "Document malware analysis" },
    { name: "SafePass™", description: "Password security auditing" },
    { name: "SafeWeb™", description: "Web application scanning" },
    { name: "SafeScore™", description: "Compliance monitoring" },
    { name: "SafeNet™", description: "Network security analysis" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 text-primary">
              <Lock className="h-4 w-4 mr-2" />
              MSSP Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI-Powered Security for MSSPs
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              AI-powered security knowledge management for MSSPs. Centralize your security documentation, provide instant response guidance, and offer clients basic security scanning services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300">
                Schedule Security Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                MSSP Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why MSSPs Choose UltriumAI</h2>
              <p className="text-xl text-muted-foreground">
                Built specifically for security-focused service providers who need enterprise-grade automation
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Apps Grid */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Complete Security Suite</h2>
              <p className="text-xl text-muted-foreground">
                Comprehensive AI-powered security applications for every threat vector
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {securityApps.map((app, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{app.name}</CardTitle>
                        <CardDescription className="text-sm">{app.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary">
                Coming Soon
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Advanced Security Features in Development</h2>
              <p className="text-xl text-muted-foreground">
                Enterprise-grade security automation coming in 2025
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    Real-Time Threat Detection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Advanced AI-powered threat detection with real-time monitoring, automated incident response, and integration with major SIEM platforms.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    SOC Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Full Security Operations Center automation with threat hunting, incident analysis, and automated containment and remediation workflows.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    Compliance Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Automated compliance monitoring and reporting for HIPAA, SOC 2, PCI DSS, and other major frameworks with continuous audit readiness.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">MSSP-Specific Security Solutions</h2>
              <p className="text-xl text-muted-foreground">
                Designed for security service providers who need scalable, automated security operations
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {securitySolutions.map((solution, index) => (
                <Card key={index} className={`hover:shadow-xl transition-all duration-300 relative ${solution.popular ? 'ring-2 ring-primary' : ''}`}>
                  {solution.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                    <CardDescription className="text-base">{solution.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {solution.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-primary text-lg">{solution.price}</p>
                      <SolutionPurchaseButton 
                        solutionType={solution.id}
                        solutionName={solution.title}
                        variant={solution.popular ? "default" : "outline"}
                        className="w-full mt-3"
                      >
                        Get Started
                      </SolutionPurchaseButton>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Security Stats */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Security Knowledge Benefits</h2>
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Instant</div>
                <p className="text-muted-foreground">Access to security playbooks</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground">AI-powered documentation search</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Custom</div>
                <p className="text-muted-foreground">Trained on your procedures</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">White-Label</div>
                <p className="text-muted-foreground">Your brand and messaging</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                Schedule Security Demo
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/demos')}>
                View Security Demos
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default MSSPs;