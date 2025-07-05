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
  Star,
  Building,
  Settings,
  Bell,
  BarChart3
} from "lucide-react";

const Solutions = () => {
  const securityApps = [
    {
      id: "safeemail",
      name: "Ultrium SafeEmail™",
      category: "Email Security",
      description: "AI-powered email analysis and threat detection",
      longDescription: "Advanced email security solution that uses AI to analyze incoming emails for phishing attempts, malware, suspicious links, and social engineering attacks.",
      icon: Shield,
      features: [
        "Real-time phishing detection",
        "Malware scanning",
        "Link analysis and safety scoring",
        "Social engineering detection",
        "Detailed threat reports",
        "API integration ready"
      ],
      demoUrl: "/demos/safeemail",
      pageUrl: "/products/safeemail",
      gradient: "from-blue-100 to-indigo-100"
    },
    {
      id: "safelink",
      name: "Ultrium SafeLink™",
      category: "Link Security",
      description: "Comprehensive URL analysis and safety verification",
      longDescription: "Intelligent link analysis tool that scans URLs for malicious content, phishing sites, malware distribution, and reputation issues.",
      icon: Lock,
      features: [
        "URL reputation analysis",
        "Malware detection",
        "Phishing site identification",
        "SSL certificate validation",
        "Domain age and history check",
        "Real-time scanning results"
      ],
      demoUrl: "/demos/safelink",
      pageUrl: "/products/safelink",
      gradient: "from-green-100 to-emerald-100"
    },
    {
      id: "safedoc",
      name: "Ultrium SafeDoc™", 
      category: "Document Management",
      description: "Secure document storage and knowledge management platform",
      longDescription: "Enterprise document management system with advanced security, version control, collaboration tools, and intelligent organization.",
      icon: FileText,
      features: [
        "Secure document storage",
        "Version control",
        "Advanced search",
        "Team collaboration",
        "Access controls",
        "Audit trails"
      ],
      demoUrl: "/demos/safedoc",
      pageUrl: "/products/safedoc",
      gradient: "from-purple-100 to-violet-100"
    },
    {
      id: "safepass",
      name: "Ultrium SafePass™",
      category: "Password Security",
      description: "Enterprise password management and security platform",
      longDescription: "Comprehensive password management solution with enterprise-grade security, automated password generation, and breach monitoring.",
      icon: Lock,
      features: [
        "Secure password generation",
        "Breach monitoring",
        "Team password sharing",
        "Multi-factor authentication",
        "Password health scoring",
        "Compliance reporting"
      ],
      demoUrl: "/demos/safepass",
      pageUrl: "/products/safepass",
      gradient: "from-orange-100 to-red-100"
    },
    {
      id: "safenet",
      name: "Ultrium SafeNet™",
      category: "Network Security",
      description: "Advanced network discovery and topology mapping platform",
      longDescription: "Comprehensive network security tool that discovers devices, maps network topology, monitors performance, and identifies vulnerabilities.",
      icon: Network,
      features: [
        "Network topology mapping",
        "Device discovery",
        "Performance monitoring",
        "Vulnerability assessment",
        "Real-time security scanning",
        "Meraki integration support"
      ],
      demoUrl: "/demos/safenet",
      pageUrl: "/products/safenet",
      gradient: "from-teal-100 to-cyan-100"
    },
    {
      id: "safecomp",
      name: "Ultrium SafeComp™",
      category: "Compliance Management",
      description: "Comprehensive compliance management and audit platform",
      longDescription: "Enterprise compliance management solution that automates compliance monitoring, conducts security audits, and tracks regulatory requirements.",
      icon: Users,
      features: [
        "Compliance monitoring",
        "Audit automation",
        "Risk assessment",
        "Multi-framework support",
        "Automated reporting",
        "Remediation tracking"
      ],
      demoUrl: "/demos/safecomp",
      pageUrl: "/products/safecomp",
      gradient: "from-pink-100 to-rose-100"
    },
    {
      id: "safeweb",
      name: "Ultrium SafeWeb™",
      category: "Threat Intelligence",
      description: "Dark web monitoring and threat intelligence platform",
      longDescription: "Comprehensive dark web monitoring solution that scans for compromised credentials, corporate data breaches, and emerging cyber threats.",
      icon: Search,
      features: [
        "Credential monitoring",
        "Data breach detection",
        "Threat actor tracking",
        "Brand monitoring",
        "Executive protection",
        "Automated alerts"
      ],
      demoUrl: "/demos/safeweb",
      pageUrl: "/products/safeweb",
      gradient: "from-indigo-100 to-blue-100"
    }
  ];

  const industries = [
    {
      name: "Managed Service Providers (MSPs)",
      icon: Settings,
      description: "Comprehensive security toolkit for MSPs managing multiple client environments",
      benefits: [
        "Multi-tenant client management",
        "Centralized security monitoring",
        "Automated compliance reporting",
        "White-label deployment options"
      ]
    },
    {
      name: "Small & Medium Businesses",
      icon: Building,
      description: "Enterprise-grade security solutions designed for SMB budgets and complexity",
      benefits: [
        "Easy deployment and management",
        "Cost-effective security coverage",
        "Minimal IT overhead required",
        "Scalable as business grows"
      ]
    },
    {
      name: "Enterprise Organizations",
      icon: Globe,
      description: "Advanced security solutions for complex organizational structures",
      benefits: [
        "Enterprise-grade integrations",
        "Advanced analytics and reporting",
        "Custom deployment options",
        "Dedicated support and training"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                <Shield className="h-4 w-4 mr-2" />
                AI Security Solutions
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Complete AI Security Suite for Modern Businesses
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                From email protection to dark web monitoring—our comprehensive AI security applications 
                protect your business from today's cyber threats while streamlining your security operations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-primary">7 Integrated Security Applications</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Deploy individually or as a complete security ecosystem. Each app works independently while integrating seamlessly with the others.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '/demos'}>
                <Play className="mr-2 h-5 w-5" />
                Try Live Demos
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '#contact'}>
                <Shield className="mr-2 h-5 w-5" />
                Schedule Security Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Applications Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              AI-Powered Security Applications
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each application is designed to address specific security challenges while providing 
              intelligent automation and real-time threat detection capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityApps.map((app) => {
              const Icon = app.icon;
              return (
                <Card key={app.id} className={`hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${app.gradient} border-2 hover:border-primary/20 hover:scale-105`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-white/80 shadow-sm">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-black">{app.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-black border-black/20">
                          {app.category}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-black/80 font-medium">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-black/70 leading-relaxed">
                      {app.longDescription}
                    </p>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Key Features:</h4>
                      <ul className="space-y-1">
                        {app.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-black/70">{feature}</span>
                          </li>
                        ))}
                        {app.features.length > 3 && (
                          <li className="text-xs text-black/60 font-medium">
                            +{app.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" onClick={() => window.location.href = app.demoUrl}>
                        <Play className="mr-1 h-3 w-3" />
                        Demo
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = app.pageUrl}>
                        Learn More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Built for Your Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our security solutions are designed to meet the specific needs and compliance requirements 
              of different business types and industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{industry.name}</CardTitle>
                    <CardDescription className="text-base">
                      {industry.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-2">
                      {industry.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Seamless Integration & Deployment
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Deploy as standalone applications or integrate with your existing security stack. 
              Our solutions work with your current tools and processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "API-First Design",
                description: "RESTful APIs for seamless integration with existing systems",
                icon: Zap
              },
              {
                title: "SSO Integration",
                description: "Single sign-on support for streamlined user management",
                icon: Lock
              },
              {
                title: "Real-Time Alerts",
                description: "Instant notifications via email, SMS, or webhook",
                icon: Bell
              },
              {
                title: "Custom Dashboards",
                description: "Tailored reporting and analytics for your specific needs",
                icon: BarChart3
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Business?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Start with individual applications or deploy our complete security suite. 
                Let's discuss which solutions are right for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '#contact'}>
                  <Shield className="mr-2 h-5 w-5" />
                  Get Security Assessment
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '/demos'}>
                  <Play className="mr-2 h-5 w-5" />
                  Try All Demos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Solutions;