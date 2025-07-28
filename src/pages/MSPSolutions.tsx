import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Shield, 
  Lock, 
  Search, 
  Globe, 
  FileText, 
  Users, 
  Zap,
  ArrowRight,
  Play,
  Network,
  CheckCircle, 
  ChevronDown,
  ChevronUp,
  Star,
  Building,
  Settings,
  Bell,
  BarChart3,
  Brain,
  TrendingUp,
  Headphones,
  Clock,
  Phone,
  Crown,
  Factory
} from "lucide-react";

const MSPSolutions = () => {
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());
  
  const toggleFeatures = (appId: string) => {
    const newExpanded = new Set(expandedFeatures);
    if (newExpanded.has(appId)) {
      newExpanded.delete(appId);
    } else {
      newExpanded.add(appId);
    }
    setExpandedFeatures(newExpanded);
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const mspSecurityApps = [
    {
      id: "safescan-msp",
      name: "Ultrium SafeScan™ for MSPs",
      category: "Multi-Tenant Threat Detection",
      description: "Complete AI-powered scanning suite with client segregation and white-label deployment",
      longDescription: "Comprehensive security scanning platform designed for MSPs with multi-tenant architecture, client-specific reporting, and white-label deployment options.",
      icon: Shield,
      features: [
        "Multi-tenant client segregation",
        "White-label deployment options",
        "Client-specific threat reporting",
        "Centralized MSP dashboard",
        "Email phishing detection across all clients",
        "Document malware scanning with client tagging",
        "URL reputation analysis for multiple domains",
        "Bulk scanning capabilities for MSP workflows",
        "Client-specific security policies",
        "MSP billing integration ready",
        "Real-time threat intelligence feeds",
        "Custom branding for client reports"
      ],
      demoUrl: "/demos/safescan-msp",
      pageUrl: "/products/safescan",
      gradient: "from-blue-100 to-indigo-100"
    },
    {
      id: "safecenter-msp",
      name: "Ultrium SafeCenter™ MSP Edition",
      category: "MSP Service Management Platform",
      description: "Complete MSP platform with RMM, ticketing, client management, and mobile technician apps",
      longDescription: "Comprehensive MSP platform that combines remote monitoring, service desk, client management, and mobile technician applications in one unified solution.",
      icon: Settings,
      features: [
        "Multi-tenant RMM with client segregation",
        "Integrated ticketing system with client portals",
        "Asset management across all client environments", 
        "Automated patch management with client scheduling",
        "Performance monitoring with MSP dashboards",
        "Service desk automation with client branding",
        "Mobile technician apps (iOS & Android)",
        "Client billing integration and automation",
        "MSP performance analytics and reporting",
        "White-label client portals",
        "Automated client onboarding workflows",
        "Integration with major PSA/RMM platforms"
      ],
      demoUrl: "/demos/safecenter-msp",
      pageUrl: "/msps",
      gradient: "from-green-100 to-emerald-100"
    },
    {
      id: "ultrium-gpt-msp",
      name: "UltriumGPT™ MSP Edition",
      category: "AI-Powered MSP Assistant",
      description: "Advanced AI platform specifically trained for MSP operations, client management, and service delivery",
      longDescription: "Revolutionary AI assistant designed specifically for MSPs, trained on MSP best practices, client management workflows, and technical documentation.",
      icon: Brain,
      features: [
        "MSP workflow automation and optimization",
        "Client-specific documentation and policies",
        "Automated service desk responses",
        "Technical troubleshooting assistance",
        "Client onboarding automation",
        "Service delivery optimization",
        "MSP business intelligence and analytics",
        "Integration with PSA/RMM platforms",
        "Custom MSP knowledge bases",
        "Automated compliance reporting",
        "Client communication templates",
        "MSP training and certification content"
      ],
      demoUrl: "/demos/ultriumgpt-msp",
      pageUrl: "/ultrium-gpt",
      gradient: "from-emerald-100 to-teal-100"
    },
    {
      id: "ai-studio-msp",
      name: "UltriumAI Studio™ for MSPs",
      category: "Custom AI Development Platform",
      description: "Build custom AI assistants for your MSP and deploy white-label AI solutions for your clients",
      longDescription: "Comprehensive AI development platform that allows MSPs to create custom AI assistants for internal use and deploy branded AI solutions for their clients.",
      icon: Zap,
      features: [
        "Drag-and-drop AI assistant builder",
        "Multi-tenant AI deployment for clients",
        "White-label AI solutions with client branding",
        "Custom knowledge base integration",
        "Client-specific AI training and customization",
        "MSP revenue generation through AI services",
        "Integration with MSP tools and workflows",
        "Automated AI assistant deployment",
        "Client AI usage analytics and reporting",
        "MSP AI service management dashboard",
        "Custom AI pricing and billing models",
        "Advanced AI security and compliance"
      ],
      demoUrl: "/demos/ai-studio-msp",
      pageUrl: "/ai-studio",
      gradient: "from-violet-100 to-purple-100"
    },
    {
      id: "safesoc-msp",
      name: "SafeSOC™ MSP Dashboard",
      category: "Security Operations Center",
      description: "Complete SOC dashboard with multi-client management and real-time threat intelligence",
      longDescription: "Centralized security operations center designed for MSPs to monitor and manage security across all client environments with real-time threat intelligence.",
      icon: BarChart3,
      features: [
        "Multi-client security monitoring",
        "Real-time threat intelligence aggregation",
        "Client-specific security dashboards",
        "Automated incident response workflows",
        "MSP security analytics and reporting",
        "Threat hunting across client environments",
        "Security compliance monitoring",
        "Client security score tracking",
        "Executive reporting for MSP and clients",
        "Custom security alerting and notifications",
        "Integration with SIEM and security tools",
        "MSP security service delivery metrics"
      ],
      demoUrl: "/demos/safesoc-msp",
      pageUrl: "/security-dashboard",
      gradient: "from-gray-100 to-slate-100"
    }
  ];

  const mspBenefits = [
    {
      icon: Users,
      title: "Multi-Tenant Architecture",
      description: "Complete client segregation with centralized MSP management and monitoring"
    },
    {
      icon: Crown,
      title: "White-Label Solutions",
      description: "Deploy all solutions under your brand with custom colors, logos, and messaging"
    },
    {
      icon: TrendingUp,
      title: "Revenue Generation", 
      description: "Turn AI and security services into new revenue streams for your MSP business"
    },
    {
      icon: Headphones,
      title: "Reduce Support Burden",
      description: "AI-powered client support reduces tickets by 60% while improving response times"
    },
    {
      icon: Clock,
      title: "24/7 Client Services",
      description: "Provide round-the-clock AI-powered support without additional staffing costs"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive reporting and analytics for both MSP operations and client services"
    }
  ];

  const integrations = [
    { name: "ConnectWise", category: "PSA" },
    { name: "Autotask", category: "PSA" },
    { name: "Kaseya", category: "RMM" },
    { name: "NinjaRMM", category: "RMM" },
    { name: "Atera", category: "All-in-One" },
    { name: "SyncroMSP", category: "All-in-One" },
    { name: "Microsoft Teams", category: "Communication" },
    { name: "Slack", category: "Communication" },
    { name: "QuickBooks", category: "Billing" },
    { name: "Xero", category: "Billing" },
    { name: "HubSpot", category: "CRM" },
    { name: "Salesforce", category: "CRM" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 mb-12">
            <Badge variant="secondary" className="animate-pulse">
              <Settings className="h-4 w-4 mr-2" />
              Complete MSP Solutions
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              MSP Solutions Suite
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Comprehensive AI-powered security and service management platform designed specifically for MSPs. 
              Multi-tenant architecture, white-label deployment, and new revenue opportunities.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300">
              Schedule MSP Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleNavigation('/pricing')}>
              MSP Pricing
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleNavigation('/demos')}>
              <Play className="mr-2 h-4 w-4" />
              Live Demos
            </Button>
          </div>
        </div>
      </section>

      {/* MSP Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Built for MSP Success</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every feature designed with MSP workflows, client management, and revenue generation in mind
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mspBenefits.map((benefit, index) => (
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

      {/* MSP Solutions Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Complete MSP Platform</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive solutions designed specifically for MSP workflows and client management
            </p>
          </div>
          
          <div className="space-y-8">
            {mspSecurityApps.map((app, index) => (
              <Card key={app.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white border-2 border-primary/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                  {/* App Info */}
                  <div className="lg:col-span-1 p-8 bg-white">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <app.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs border-primary/30 text-primary">
                          {app.category}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {app.longDescription}
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => handleNavigation(app.demoUrl)}
                        className="w-full bg-gradient-to-r from-primary to-purple-600"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Live Demo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleNavigation(app.pageUrl)}
                        className="w-full"
                      >
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="lg:col-span-2 p-8 bg-gray-50">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">MSP Features</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeatures(app.id)}
                        className="text-primary hover:text-primary/80"
                      >
                        {expandedFeatures.has(app.id) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show All Features
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {app.features.slice(0, expandedFeatures.has(app.id) ? app.features.length : 6).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    {!expandedFeatures.has(app.id) && app.features.length > 6 && (
                      <div className="mt-4 text-center">
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                          +{app.features.length - 6} more features
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">MSP Tool Integrations</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seamlessly integrate with the PSA, RMM, and business tools your MSP already uses
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {integrations.map((integration, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="space-y-2">
                  <div className="font-semibold text-foreground">{integration.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {integration.category}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your MSP?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of MSPs already using UltriumAI to reduce costs, increase efficiency, 
            and create new revenue streams with AI-powered solutions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">60%</div>
              <p className="text-muted-foreground">Reduction in support tickets</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">AI-powered client support</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$15K+</div>
              <p className="text-muted-foreground">Average monthly revenue increase</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 text-lg px-8">
              <Phone className="mr-2 h-5 w-5" />
              Schedule MSP Demo
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleNavigation('/msps')} className="text-lg px-8">
              Learn More About MSP Program
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MSPSolutions;