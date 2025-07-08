import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  Shield, 
  Users, 
  Clock, 
  Brain, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Star,
  Globe,
  AlertTriangle,
  TrendingUp,
  Target,
  Search,
  BarChart3,
  Phone,
  Mail
} from "lucide-react";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const SafeEDRPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: Eye,
      title: "24/7 Security Monitoring",
      description: "Round-the-clock threat detection and monitoring by expert security analysts"
    },
    {
      icon: Search,
      title: "Threat Hunting",
      description: "Proactive hunting for advanced persistent threats and hidden malicious activity"
    },
    {
      icon: Zap,
      title: "Rapid Response",
      description: "Immediate incident response with containment and remediation within minutes"
    },
    {
      icon: Brain,
      title: "AI-Enhanced Detection",
      description: "Machine learning algorithms combined with human expertise for superior accuracy"
    },
    {
      icon: BarChart3,
      title: "Threat Intelligence",
      description: "Global threat intelligence feeds providing context and attribution for attacks"
    },
    {
      icon: Users,
      title: "Expert Analysts",
      description: "Certified security professionals with deep expertise in threat detection"
    }
  ];

  const services = [
    {
      title: "Security Operations Center (SOC)",
      description: "24/7 monitoring and analysis of security events across your entire infrastructure",
      capabilities: [
        "Real-time event correlation and analysis",
        "Advanced persistent threat (APT) detection", 
        "Behavioral analytics and anomaly detection",
        "Compliance monitoring and reporting"
      ]
    },
    {
      title: "Incident Response",
      description: "Rapid containment and remediation of security incidents to minimize business impact",
      capabilities: [
        "Immediate threat containment",
        "Forensic analysis and investigation",
        "Recovery and restoration guidance",
        "Post-incident analysis and improvements"
      ]
    },
    {
      title: "Threat Hunting",
      description: "Proactive search for sophisticated threats that evade traditional security controls",
      capabilities: [
        "Hypothesis-driven threat hunting",
        "Custom IOC development",
        "Advanced malware analysis",
        "Threat landscape intelligence"
      ]
    }
  ];

  const industries = [
    { name: "Financial Services", compliance: "PCI DSS, SOX, FFIEC" },
    { name: "Healthcare", compliance: "HIPAA, HITECH" },
    { name: "Government", compliance: "FedRAMP, FISMA, NIST" },
    { name: "Manufacturing", compliance: "ISO 27001, NIST CSF" },
    { name: "Retail & E-commerce", compliance: "PCI DSS, GDPR" },
    { name: "Technology", compliance: "SOC 2, ISO 27001" }
  ];

  const pricingTiers = [
    {
      name: "Essential SafeEDR",
      price: "$5,000",
      description: "Core managed detection and response for small to medium businesses",
      features: [
        "24/7 security monitoring",
        "Threat detection & alerting",
        "Basic incident response",
        "Monthly security reports",
        "Email & phone support"
      ],
      popular: false
    },
    {
      name: "Advanced SafeEDR", 
      price: "$15,000",
      description: "Comprehensive SafeEDR with enhanced threat hunting and response",
      features: [
        "Everything in Essential",
        "Proactive threat hunting",
        "Advanced incident response",
        "Compliance reporting",
        "Dedicated security analyst",
        "Quarterly security reviews"
      ],
      popular: true
    },
    {
      name: "Enterprise SafeEDR",
      price: "Custom",
      description: "Full-spectrum security operations for large enterprises",
      features: [
        "Everything in Advanced",
        "Custom threat intelligence",
        "Dedicated SOC team",
        "On-site incident response",
        "Executive briefings",
        "Custom integrations & workflows"
      ],
      popular: false
    }
  ];

  const responseStats = [
    { metric: "< 15 min", label: "Mean Time to Detection" },
    { metric: "< 1 hour", label: "Mean Time to Response" },
    { metric: "99.9%", label: "Service Availability" },
    { metric: "24/7/365", label: "Expert Coverage" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Eye className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold text-gradient">
                Ultrium SafeEDR
              </h1>
            </div>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
              24/7 Managed Detection and Response service combining AI-powered threat detection 
              with expert human analysis for comprehensive cybersecurity protection
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-lg px-8 py-3" variant="hero">
                Get Security Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Schedule Consultation
              </Button>
            </div>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Free security assessment
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Expert consultation included
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Rapid deployment
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              {responseStats.map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold text-primary mb-2">{stat.metric}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
              <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="industries">Industries</TabsTrigger>
                <TabsTrigger value="team">Our Team</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">Enterprise-Grade Security Operations</h2>
                  <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                    Ultrium SafeEDR provides comprehensive managed detection and response services, 
                    combining cutting-edge technology with expert human analysis to protect your organization
                    from sophisticated cyber threats.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
                        <CardHeader>
                          <Icon className="h-12 w-12 text-primary mb-4" />
                          <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="services" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Comprehensive Security Services</h2>
                  <p className="text-xl text-muted-foreground">
                    Full-spectrum cybersecurity operations tailored to your needs
                  </p>
                </div>

                <div className="space-y-8">
                  {services.map((service, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-2xl">{service.title}</CardTitle>
                        <CardDescription className="text-lg">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {service.capabilities.map((capability, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span>{capability}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="industries" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Industry Expertise</h2>
                  <p className="text-xl text-muted-foreground">
                    Specialized security solutions for regulated industries
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {industries.map((industry, index) => (
                    <Card key={index} className="hover:border-primary/20 transition-colors">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-3">{industry.name}</h3>
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground">Compliance Frameworks:</div>
                          <Badge variant="outline" className="text-xs">{industry.compliance}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Our security analysts are certified in industry-specific compliance frameworks 
                    and maintain deep expertise in sector-specific threats and regulations.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="team" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Expert Security Team</h2>
                  <p className="text-xl text-muted-foreground">
                    Certified professionals with decades of combined cybersecurity experience
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">50+ Analysts</h3>
                      <p className="text-sm text-muted-foreground">Certified security professionals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">Advanced Certifications</h3>
                      <p className="text-sm text-muted-foreground">CISSP, GCIH, GNFA, GCTI</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">15+ Years</h3>
                      <p className="text-sm text-muted-foreground">Average team experience</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">Global Coverage</h3>
                      <p className="text-sm text-muted-foreground">Follow-the-sun operations</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle>What Sets Our Team Apart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Former government cybersecurity professionals</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Industry-leading threat hunting expertise</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Continuous training and skill development</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Hands-on incident response experience</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Deep understanding of attacker techniques</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Proactive threat intelligence research</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Flexible Service Plans</h2>
                  <p className="text-xl text-muted-foreground">
                    Choose the right level of managed security for your organization
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {pricingTiers.map((tier, index) => (
                    <Card key={index} className={`relative ${tier.popular ? 'border-2 border-primary' : ''}`}>
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{tier.name}</CardTitle>
                        <div className="text-4xl font-bold">
                          {tier.price}
                          {tier.price !== "Custom" && <span className="text-lg text-muted-foreground">/month</span>}
                        </div>
                        <CardDescription>{tier.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {tier.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full" 
                          variant={tier.popular ? "default" : "outline"}
                        >
                          {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <h3 className="text-xl font-semibold mb-4">Need a Custom Solution?</h3>
                  <p className="text-muted-foreground mb-6">
                    We offer tailored SafeEDR services for unique requirements and large enterprises
                  </p>
                  <Button variant="outline" size="lg">
                    Schedule Consultation
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
            <h2 className="text-4xl font-bold">Ready to Strengthen Your Security Posture?</h2>
            <p className="text-xl text-muted-foreground">
              Let our security experts assess your current environment and design a comprehensive SafeEDR solution
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-lg px-8 py-3" variant="hero">
                Get Free Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Talk to Expert
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default SafeEDRPage;