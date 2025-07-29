
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Star,
  Lock,
  Zap,
  Globe,
  Phone,
  Mail,
  Calendar,
  User,
  Award,
  Target,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Crown,
  Heart,
  Lightbulb,
  Rocket,
  Clock,
  DollarSign,
  MessageSquare,
  Handshake
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const Solutions = () => {
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const stats = [
    { value: "50K+", label: "Businesses Protected", icon: Shield },
    { value: "99.9%", label: "Uptime Guarantee", icon: TrendingUp },
    { value: "24/7", label: "Support Available", icon: Users },
    { value: "150+", label: "Countries Served", icon: Globe }
  ];

  const companies = [
    { name: "Microsoft", logo: "https://logo.clearbit.com/microsoft.com" },
    { name: "Google", logo: "https://logo.clearbit.com/google.com" },
    { name: "AWS", logo: "https://logo.clearbit.com/aws.amazon.com" },
    { name: "Salesforce", logo: "https://logo.clearbit.com/salesforce.com" },
    { name: "Adobe", logo: "https://logo.clearbit.com/adobe.com" },
    { name: "Oracle", logo: "https://logo.clearbit.com/oracle.com" }
  ];

  const useCases = [
    {
      title: "Customer Support AI",
      description: "Intelligent chatbots that handle 80% of customer inquiries automatically",
      icon: MessageSquare,
      benefits: ["24/7 availability", "Instant responses", "Multilingual support"],
      industry: "retail"
    },
    {
      title: "Document Processing",
      description: "Automated document analysis and data extraction for faster processing",
      icon: FileText,
      benefits: ["95% accuracy", "10x faster processing", "Cost reduction"],
      industry: "finance"
    },
    {
      title: "Predictive Analytics",
      description: "AI-powered insights to forecast trends and optimize operations",
      icon: BarChart3,
      benefits: ["Data-driven decisions", "Risk reduction", "Revenue optimization"],
      industry: "manufacturing"
    },
    {
      title: "Code Generation",
      description: "Automated code writing and debugging to accelerate development",
      icon: Settings,
      benefits: ["50% faster development", "Fewer bugs", "Code quality improvement"],
      industry: "technology"
    },
    {
      title: "Content Creation",
      description: "AI-generated content for marketing, social media, and communications",
      icon: Lightbulb,
      benefits: ["Consistent brand voice", "Scalable content", "Creative inspiration"],
      industry: "marketing"
    },
    {
      title: "Process Automation",
      description: "Streamline workflows and eliminate repetitive tasks across departments",
      icon: Rocket,
      benefits: ["Efficiency gains", "Error reduction", "Employee satisfaction"],
      industry: "all"
    }
  ];

  const industries = [
    { id: 'all', name: 'All Industries', icon: Globe },
    { id: 'retail', name: 'Retail & E-commerce', icon: Briefcase },
    { id: 'finance', name: 'Financial Services', icon: DollarSign },
    { id: 'manufacturing', name: 'Manufacturing', icon: Settings },
    { id: 'technology', name: 'Technology', icon: Zap },
    { id: 'marketing', name: 'Marketing & Media', icon: Target }
  ];

  const securityApps = [
    {
      name: "SafeScan",
      description: "Advanced vulnerability scanning and threat detection",
      features: ["Real-time scanning", "Compliance reporting", "Risk assessment"],
      color: "bg-red-500"
    },
    {
      name: "SafeNet",
      description: "Network security monitoring and intrusion detection",
      features: ["Traffic analysis", "Threat intelligence", "Automated response"],
      color: "bg-blue-500"
    },
    {
      name: "SafePass",
      description: "Password management and identity protection",
      features: ["Secure vault", "Multi-factor auth", "Breach monitoring"],
      color: "bg-green-500"
    },
    {
      name: "SafeWeb",
      description: "Web security and dark web monitoring",
      features: ["Site protection", "Brand monitoring", "Threat tracking"],
      color: "bg-purple-500"
    },
    {
      name: "SafeEmail",
      description: "Email security and phishing protection",
      features: ["Spam filtering", "Attachment scanning", "Link verification"],
      color: "bg-orange-500"
    },
    {
      name: "SafeCloud",
      description: "Cloud security and data protection",
      features: ["Data encryption", "Access control", "Compliance monitoring"],
      color: "bg-cyan-500"
    },
    {
      name: "SafeDesk",
      description: "Endpoint security and device management",
      features: ["Device monitoring", "Patch management", "Threat response"],
      color: "bg-pink-500"
    },
    {
      name: "SafeComply",
      description: "Compliance management and audit preparation",
      features: ["Regulatory tracking", "Audit trails", "Risk assessment"],
      color: "bg-indigo-500"
    }
  ];

  const filteredUseCases = selectedIndustry === 'all' 
    ? useCases 
    : useCases.filter(useCase => useCase.industry === selectedIndustry || useCase.industry === 'all');

  const integrationFeatures = [
    {
      title: "API-First Architecture",
      description: "RESTful APIs for seamless integration with existing systems",
      icon: Settings
    },
    {
      title: "Webhook Support",
      description: "Real-time notifications and automated workflows",
      icon: Zap
    },
    {
      title: "SSO Integration",
      description: "Single sign-on with popular identity providers",
      icon: Lock
    },
    {
      title: "Custom Connectors",
      description: "Purpose-built integrations for your specific tools",
      icon: Handshake
    }
  ];

  const industryBenefits = [
    {
      industry: "Healthcare",
      benefits: ["HIPAA compliance", "Patient data security", "Automated reporting"],
      icon: Heart
    },
    {
      industry: "Finance",
      benefits: ["SOX compliance", "Fraud detection", "Risk management"],
      icon: DollarSign
    },
    {
      industry: "Manufacturing",
      benefits: ["Quality control", "Predictive maintenance", "Supply chain optimization"],
      icon: Settings
    },
    {
      industry: "Retail",
      benefits: ["Customer insights", "Inventory optimization", "Personalization"],
      icon: Briefcase
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    AI Solutions for Every Business
                  </h1>
                  <p className="text-xl text-foreground/80 max-w-4xl mx-auto">
                    Transform your operations with custom AI agents, comprehensive security suite, and enterprise-grade platform. From small businesses to global enterprises.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    onClick={() => navigate('/pricing')}
                  >
                    <Star className="mr-2 h-5 w-5" />
                    Get Started Today
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg px-8 py-6"
                    onClick={() => navigate('/live-demos')}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    See Live Demos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary">{stat.value}</div>
                      <div className="text-foreground/80">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Company Trust Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Trusted by Leading Companies</h2>
              <p className="text-foreground/80 max-w-2xl mx-auto">
                Join thousands of businesses that trust UltriumAI for their AI and security needs
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
              {companies.map((company, index) => (
                <div key={index} className="flex items-center justify-center p-4 bg-card rounded-lg hover:shadow-lg transition-shadow">
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="h-8 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">AI Solutions by Industry</h2>
                <p className="text-foreground/80 max-w-2xl mx-auto">
                  Discover how UltriumAI transforms businesses across different sectors
                </p>
              </div>

              {/* Industry Filter */}
              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {industries.map((industry) => {
                  const Icon = industry.icon;
                  return (
                    <Button
                      key={industry.id}
                      variant={selectedIndustry === industry.id ? "default" : "outline"}
                      onClick={() => setSelectedIndustry(industry.id)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {industry.name}
                    </Button>
                  );
                })}
              </div>

              {/* Use Cases Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredUseCases.map((useCase, index) => {
                  const Icon = useCase.icon;
                  return (
                    <Card key={index} className="hover:shadow-lg transition-shadow bg-card border border-border">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-xl text-card-foreground">{useCase.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-card-foreground/70 mb-4">{useCase.description}</p>
                        <ul className="space-y-2">
                          {useCase.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-center gap-2 text-sm text-card-foreground/80">
                              <CheckCircle className="h-4 w-4 text-success" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Customer Success Story */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20 bg-card border border-border">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center mb-6">
                      <div className="flex -space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-6 w-6 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <blockquote className="text-xl italic text-card-foreground">
                      "UltriumAI transformed our customer service operations. Our response time improved by 75% and customer satisfaction increased by 40%. The AI agents handle complex queries better than we expected."
                    </blockquote>
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-card-foreground">Sarah Johnson</div>
                        <div className="text-sm text-card-foreground/70">CTO, TechCorp Inc.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Security Suite Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Complete Security Suite</h2>
                <p className="text-foreground/80 max-w-2xl mx-auto">
                  Comprehensive security applications to protect your business from all angles
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {securityApps.map((app, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow bg-card border border-border">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${app.color}`}></div>
                        <CardTitle className="text-lg text-card-foreground">{app.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-card-foreground/70 mb-4">{app.description}</p>
                      <ul className="space-y-2">
                        {app.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm text-card-foreground/80">
                            <CheckCircle className="h-4 w-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industry Benefits */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Industry-Specific Benefits</h2>
                <p className="text-foreground/80 max-w-2xl mx-auto">
                  Tailored solutions that address the unique challenges of your industry
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {industryBenefits.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-card border border-border">
                      <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-xl text-card-foreground">{item.industry}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {item.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="text-sm text-card-foreground/80">
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Integration Features */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">Seamless Integration</h2>
                <p className="text-foreground/80 max-w-2xl mx-auto">
                  Connect UltriumAI with your existing tools and workflows
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {integrationFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-card border border-border">
                      <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-lg text-card-foreground">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-card-foreground/70">{feature.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* MSP Partner Program */}
        <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20 dark:border-green-400/20">
                <CardContent className="p-8">
                  <div className="text-center space-y-6">
                    <Badge className="bg-green-600 text-white px-4 py-2 text-sm font-medium">
                      <Crown className="h-4 w-4 mr-2" />
                      MSP Partner Program
                    </Badge>
                    
                    <h2 className="text-3xl font-bold text-foreground">
                      Looking to Scale? Become an MSP Partner
                    </h2>
                    
                    <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
                      Join our MSP Partner Program and offer UltriumAI's complete suite to your clients. 
                      Earn recurring revenue while providing cutting-edge AI and security solutions.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-semibold text-foreground">Up to 40% recurring commissions</div>
                      </div>
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-semibold text-foreground">White-label options with your branding</div>
                      </div>
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-semibold text-foreground">24/7 technical support and training</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">$15K+</div>
                      <div className="text-foreground/80">Average monthly recurring revenue per partner</div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                        onClick={() => navigate('/msps')}
                      >
                        <FileText className="mr-2 h-5 w-5" />
                        View MSP Solutions
                      </Button>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-black text-white hover:bg-gray-800 border-black"
                        onClick={() => navigate('/msp-program')}
                      >
                        Learn About MSP Program
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
              <p className="text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using UltriumAI to automate processes, 
                enhance security, and accelerate growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/pricing')}
                >
                  <Star className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/contact')}
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Solutions;
