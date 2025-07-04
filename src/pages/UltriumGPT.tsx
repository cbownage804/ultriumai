import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { 
  Building, 
  Users, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Phone,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Globe
} from "lucide-react";

const UltriumGPT = () => {
  const businessTiers = [
    {
      title: "Small-Medium Businesses",
      employeeRange: "5-100 employees",
      description: "Perfect for growing businesses that need intelligent automation without the complexity.",
      features: [
        "Basic helpdesk automation",
        "Employee onboarding assistance", 
        "FAQ and policy guidance",
        "Simple workflow automation",
        "Basic security awareness training"
      ],
      benefits: [
        "Reduce helpdesk tickets by 25-40%",
        "Faster employee onboarding",
        "24/7 support availability",
        "Lower IT support costs"
      ],
      gradient: "from-blue-50 to-indigo-50",
      icon: Building
    },
    {
      title: "Large Enterprises",
      employeeRange: "100-5000+ employees",
      description: "Comprehensive AI solutions for complex organizational structures and advanced security needs.",
      features: [
        "Advanced workflow automation",
        "Multi-department GPT agents",
        "Complex integration capabilities",
        "Advanced analytics and reporting",
        "Enterprise-grade security protocols",
        "Custom training on company data"
      ],
      benefits: [
        "Reduce support volume by 40-60%",
        "Streamline cross-department workflows",
        "Enhanced security compliance",
        "Scalable across all business units"
      ],
      gradient: "from-purple-50 to-violet-50",
      icon: Globe
    },
    {
      title: "Managed Service Providers (MSPs)",
      employeeRange: "10-500 employees",
      description: "Purpose-built for MSPs managing multiple client environments with security at the forefront.",
      features: [
        "Multi-tenant client management",
        "RMM and PSA integrations",
        "Client-specific knowledge bases",
        "Automated ticket triage",
        "Security incident response",
        "Client portal integration"
      ],
      benefits: [
        "Scale support across multiple clients",
        "Reduce L1 support burden",
        "Improve client satisfaction",
        "Standardize service delivery"
      ],
      gradient: "from-green-50 to-emerald-50",
      icon: Settings
    },
    {
      title: "Managed Security Service Providers (MSSPs)",
      employeeRange: "25-1000+ employees",
      description: "Advanced security-focused AI agents for organizations providing cybersecurity services.",
      features: [
        "Security event analysis",
        "Threat intelligence integration",
        "Incident response automation",
        "Compliance reporting",
        "Security awareness training",
        "SOC analyst assistance"
      ],
      benefits: [
        "Faster threat detection and response",
        "Enhanced security monitoring",
        "Automated compliance reporting",
        "Improved analyst efficiency"
      ],
      gradient: "from-red-50 to-orange-50",
      icon: Shield
    }
  ];

  const coreCapabilities = [
    {
      icon: MessageSquare,
      title: "Intelligent Conversation",
      description: "Natural language processing trained on your specific business context and terminology."
    },
    {
      icon: Shield,
      title: "Security-First Architecture",
      description: "Built-in cybersecurity features including threat detection and secure data handling."
    },
    {
      icon: Settings,
      title: "Seamless Integrations",
      description: "Connect with existing tools, RMM platforms, PSA systems, and business applications."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and insights to measure ROI and optimize performance."
    },
    {
      icon: Users,
      title: "Multi-User Management",
      description: "Role-based access controls and user management for teams of any size."
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automate repetitive tasks and complex business processes with intelligent decision making."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                <MessageSquare className="h-4 w-4 mr-2" />
                UltriumGPT Platform
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                AI Agents Built for Your Business Size & Industry
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                From SMBs to enterprises, MSPs to MSSPs—UltriumGPT scales with your organization and delivers 
                intelligent automation tailored to your specific needs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                <Phone className="mr-2 h-5 w-5" />
                Call 804-821-1410
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Business Tiers Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Tailored Solutions for Every Business Type
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              UltriumGPT adapts to your organization's size, industry, and specific requirements—delivering 
              the right level of automation and intelligence for your business.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {businessTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <Card key={index} className={`hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${tier.gradient} border-2 hover:border-primary/20`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-white/80 shadow-sm">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{tier.title}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {tier.employeeRange}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-base font-medium text-primary">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-foreground">Key Features:</h4>
                      <ul className="space-y-2">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-foreground">Expected Benefits:</h4>
                      <ul className="space-y-2">
                        {tier.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Core UltriumGPT Capabilities
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every UltriumGPT deployment includes these foundational capabilities, 
              customized to your organization's specific needs and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreCapabilities.map((capability, index) => {
              const Icon = capability.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{capability.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {capability.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementation Process */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Implementation Tailored to Your Scale
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our implementation process scales with your organization—from rapid SMB deployments 
              to comprehensive enterprise rollouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Discovery & Planning",
                description: "We assess your organization size, current workflows, and specific requirements to design the optimal UltriumGPT configuration.",
                timeframe: "1-2 weeks for SMBs, 2-4 weeks for enterprises"
              },
              {
                step: "02", 
                title: "Custom Development & Training",
                description: "Build and train your UltriumGPT using your actual policies, procedures, and data—with security protocols appropriate for your organization.",
                timeframe: "2-4 weeks for SMBs, 4-8 weeks for enterprises"
              },
              {
                step: "03",
                title: "Deployment & Support",
                description: "Phased rollout with comprehensive training and ongoing support to ensure successful adoption across your organization.",
                timeframe: "1-2 weeks rollout, ongoing support"
              }
            ].map((phase, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center relative">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {phase.step}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{phase.title}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {phase.timeframe}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {phase.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business Operations?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Let's discuss how UltriumGPT can be configured for your specific organization size, 
                industry requirements, and business objectives.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  <Calendar className="mr-2 h-5 w-5" />
                  Schedule Your Consultation
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
                  <Phone className="mr-2 h-5 w-5" />
                  Call 804-821-1410
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default UltriumGPT;