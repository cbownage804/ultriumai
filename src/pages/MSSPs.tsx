import { Shield, Lock, AlertTriangle, Eye, CheckCircle, Star, ArrowRight, Zap, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const MSSPs = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Advanced Threat Detection",
      description: "AI-powered security scanning with real-time threat intelligence"
    },
    {
      icon: Eye,
      title: "24/7 Security Monitoring",
      description: "Continuous monitoring and automated incident response"
    },
    {
      icon: Zap,
      title: "Automated Response",
      description: "Instant containment and mitigation of security threats"
    },
    {
      icon: BarChart3,
      title: "Security Analytics",
      description: "Comprehensive security reporting and compliance tracking"
    }
  ];

  const securitySolutions = [
    {
      title: "SafeEmail™ Enterprise",
      description: "Advanced email threat detection and phishing protection for enterprise clients",
      features: ["Advanced phishing detection", "Malware scanning", "Link analysis", "Client reporting"],
      price: "Starting at $100/month",
      popular: true
    },
    {
      title: "Integrated Security Suite",
      description: "Complete security automation platform with all security apps included",
      features: ["All SafeSuite apps", "Custom integrations", "White-label deployment", "SOC integration"],
      price: "Starting at $500/month",
      popular: false
    },
    {
      title: "Security Operations AI",
      description: "AI-powered SOC automation and incident response platform",
      features: ["Threat hunting", "Incident analysis", "Response automation", "Compliance reporting"],
      price: "Starting at $500/month",
      popular: false
    }
  ];

  const securityApps = [
    { name: "SafeEmail™", description: "Email threat detection" },
    { name: "SafeLink™", description: "URL security scanning" },
    { name: "SafeDoc™", description: "Document malware analysis" },
    { name: "SafePass™", description: "Password security auditing" },
    { name: "SafeWeb™", description: "Web application scanning" },
    { name: "SafeComp™", description: "Compliance monitoring" },
    { name: "SafeNet™", description: "Network security analysis" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        
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
              Advanced AI security solutions designed for Managed Security Service Providers. Automate threat detection, enhance SOC operations, and deliver premium security services at scale.
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
                      <Button className="w-full mt-3" variant={solution.popular ? "default" : "outline"}>
                        Get Started
                      </Button>
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
            <h2 className="text-3xl font-bold mb-4">Security Performance Metrics</h2>
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">99.7%</div>
                <p className="text-muted-foreground">Threat detection accuracy</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">&lt;30s</div>
                <p className="text-muted-foreground">Average response time</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">85%</div>
                <p className="text-muted-foreground">Reduction in false positives</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground">Continuous monitoring</p>
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