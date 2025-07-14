import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Shield, 
  Lock, 
  Search, 
  Globe, 
  Bot, 
  FileText, 
  Users, 
  Zap,
  ArrowRight,
  ExternalLink,
  Play,
  Network,
  Wrench,
  MessageSquare,
  Eye
} from "lucide-react";

interface DemoApp {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  icon: React.ComponentType<any>;
  features: string[];
  demoUrl: string;
  isLive: boolean;
  tags: string[];
  useCases: string[];
}

const demoApps: DemoApp[] = [
  {
    id: "ultrium-safescan",
    name: "Ultrium SafeScan™",
    category: "Unified Security",
    description: "Revolutionary AI-powered unified security scanning platform for emails, links, and documents",
    longDescription: "Next-generation security scanning platform that unifies email, document, and URL analysis with advanced AI behavioral analysis, real-time threat intelligence, and cross-reference detection capabilities. Combines the power of SafeMail, SafeLink, and SafeDoc into one comprehensive security solution.",
    icon: Shield,
    features: [
      "Unified email, link, and document scanning",
      "Real-time phishing and malware detection", 
      "AI behavioral pattern recognition",
      "Cross-reference threat analysis",
      "Multi-format document analysis",
      "SSL certificate validation",
      "Social engineering detection",
      "Predictive threat modeling",
      "Global reputation scoring",
      "Automated forensic reporting"
    ],
    demoUrl: "/demos/safescan",
    isLive: true,
    tags: ["Unified Security", "AI Analysis", "Multi-Vector Scanning", "Revolutionary"],
    useCases: [
      "Unified email, document, and URL protection",
      "Advanced threat intelligence analysis", 
      "Cross-platform security scanning",
      "AI-powered behavioral detection",
      "Enterprise security automation",
      "MSP client protection"
    ]
  },
  {
    id: "ultrium-safepass",
    name: "Ultrium SafePass™",
    category: "Password Security",
    description: "Enterprise password management and security platform",
    longDescription: "Comprehensive password management solution with enterprise-grade security, automated password generation, breach monitoring, and team collaboration features for secure credential management.",
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
    isLive: true,
    tags: ["Password Security", "Credential Management", "Enterprise"],
    useCases: [
      "Corporate password management",
      "Team credential sharing",
      "Compliance requirements",
      "Security auditing"
    ]
  },
  {
    id: "ultrium-safenet",
    name: "Ultrium SafeNet™",
    category: "Network Security",
    description: "Advanced network discovery and topology mapping platform",
    longDescription: "Comprehensive network security tool that discovers devices, maps network topology, monitors performance, and identifies security vulnerabilities across your infrastructure with real-time scanning capabilities.",
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
    isLive: true,
    tags: ["Network Security", "Infrastructure", "Monitoring"],
    useCases: [
      "Network asset discovery",
      "Security vulnerability assessment",
      "Performance monitoring",
      "Compliance network auditing"
    ]
  },
  {
    id: "ultrium-safescore",
    name: "Ultrium SafeScore™",
    category: "Compliance Management",
    description: "Comprehensive compliance management and audit platform",
    longDescription: "Enterprise compliance management solution that automates compliance monitoring, conducts security audits, tracks regulatory requirements, and provides detailed reporting for various frameworks including SOC 2, HIPAA, and GDPR.",
    icon: Users,
    features: [
      "Compliance monitoring",
      "Audit automation",
      "Risk assessment",
      "Multi-framework support",
      "Automated reporting",
      "Remediation tracking"
    ],
    demoUrl: "/demos/safescore",
    isLive: true,
    tags: ["Compliance", "Audit", "Risk Management"],
    useCases: [
      "SOC 2 compliance monitoring",
      "HIPAA compliance tracking",
      "GDPR compliance management",
      "Internal security audits"
    ]
  },
  {
    id: "ultrium-safeweb",
    name: "Ultrium SafeWeb™",
    category: "Threat Intelligence",
    description: "Dark web monitoring and threat intelligence platform",
    longDescription: "Comprehensive dark web monitoring solution that scans for compromised credentials, corporate data breaches, threat actor discussions, and emerging cyber threats targeting your organization.",
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
    isLive: true,
    tags: ["Dark Web", "Threat Intelligence", "Monitoring"],
    useCases: [
      "Executive protection",
      "Corporate security monitoring",
      "Incident response",
      "Compliance reporting"
    ]
  },
  {
    id: "ultrium-rmm",
    name: "Ultrium RMM™",
    category: "Remote Management", 
    description: "Next-generation RMM with web-based agent and Windows Defender integration",
    longDescription: "Advanced RMM solution featuring web-based agent deployment, real-time device monitoring, remote desktop control, Windows Defender endpoint management, and comprehensive IT automation for MSPs and IT professionals.",
    icon: Wrench,
    features: [
      "Web-based agent deployment",
      "Real-time device monitoring", 
      "Remote desktop & file transfer",
      "Windows Defender integration",
      "Automated script execution",
      "Multi-client dashboard",
      "Screen sharing & control",
      "Endpoint threat management"
    ],
    demoUrl: "/demos/rmm",
    isLive: true,
    tags: ["RMM", "Remote Management", "Windows Defender", "Web Agent"],
    useCases: [
      "Device registration via web interface",
      "Remote desktop support sessions",
      "Centralized Windows Defender management", 
      "Proactive endpoint monitoring",
      "Automated security deployments"
    ]
  },
  {
    id: "ultrium-ticketing",
    name: "Ultrium Helpdesk™",
    category: "Service Management",
    description: "AI-powered ticketing and helpdesk automation platform",
    longDescription: "Comprehensive helpdesk solution with intelligent ticket routing, automated responses, SLA management, and integrated communication tools for superior customer service.",
    icon: MessageSquare,
    features: [
      "Intelligent ticket routing",
      "Automated response templates",
      "SLA tracking & alerts",
      "Multi-channel support",
      "Analytics & reporting",
      "Team collaboration"
    ],
    demoUrl: "/demos/ticketing",
    isLive: true,
    tags: ["Helpdesk", "Ticketing", "Customer Service"],
    useCases: [
      "IT support ticket management",
      "Customer service automation",
      "SLA compliance tracking",
      "Team productivity optimization"
    ]
  },
  {
    id: "ultrium-safeav",
    name: "Ultrium SafeAV™",
    category: "Endpoint Security",
    description: "AI-powered endpoint protection with Windows Defender integration",
    longDescription: "Advanced endpoint security platform featuring native Windows Defender integration, real-time threat detection, behavioral analysis, and centralized management through SafeShield for complete endpoint protection.",
    icon: Shield,
    features: [
      "Windows Defender integration",
      "Real-time threat monitoring",
      "Centralized endpoint management",
      "Automated threat quarantine",
      "Security policy deployment",
      "Compliance reporting",
      "Multi-client dashboard"
    ],
    demoUrl: "/safeshield",
    isLive: true,
    tags: ["SafeAV", "Windows Defender", "Endpoint Security", "SafeShield"],
    useCases: [
      "Windows endpoint protection",
      "Defender policy management",
      "Threat detection & response",
      "Security compliance monitoring",
      "MSP endpoint security"
    ]
  },
  {
    id: "ultrium-safeedr",
    name: "Ultrium SafeShield™",
    category: "Revolutionary AI Security",
    description: "World's first unified AI-powered security platform with revolutionary behavioral analysis",
    longDescription: "Revolutionary AI-powered security platform that combines EDR, MDR, Antivirus, and Behavioral Analysis into one unified system. Features groundbreaking machine learning capabilities, autonomous threat hunting, and real-time AI response automation.",
    icon: Eye,
    features: [
      "Revolutionary AI Behavioral Engine",
      "Unified EDR + MDR + Antivirus platform",
      "Autonomous 24/7 threat hunting",
      "Real-time AI response automation",
      "Advanced machine learning detection",
      "Predictive threat modeling",
      "Behavioral pattern recognition",
      "Cross-platform threat correlation"
    ],
    demoUrl: "/safeshield",
    isLive: true,
    tags: ["SafeShield", "Revolutionary AI", "Unified Security", "Behavioral Analysis"],
    useCases: [
      "Enterprise-wide unified security",
      "AI-powered autonomous monitoring",
      "Advanced behavioral threat detection",
      "Predictive security automation",
      "Multi-platform threat correlation"
    ]
  },
  {
    id: "ultrium-gpt",
    name: "UltriumGPT",
    category: "AI Assistant",
    description: "Intelligent business assistant for MSPs and IT professionals",
    longDescription: "Specialized AI assistant trained on MSP procedures, IT documentation, and business processes. Provides instant answers to common IT questions, troubleshooting guidance, and operational support.",
    icon: Bot,
    features: [
      "MSP procedure knowledge",
      "IT troubleshooting assistance",
      "Document analysis",
      "Custom training capabilities",
      "Multi-language support",
      "Integration ready"
    ],
    demoUrl: "/demos/ultriumgpt",
    isLive: true,
    tags: ["AI Assistant", "MSP", "IT Support"],
    useCases: [
      "Help desk automation",
      "Staff training",
      "Knowledge management",
      "Client support"
    ]
  }
];

const LiveDemos = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "Unified Security", "Password Security", "Network Security", "Compliance Management", "Threat Intelligence", "Remote Management", "Service Management", "Endpoint Security", "Revolutionary AI Security", "AI Assistant"];
  
  const filteredApps = selectedCategory === "all" 
    ? demoApps 
    : demoApps.filter(app => app.category === selectedCategory);

  const handleDemoClick = (app: DemoApp) => {
    if (app.demoUrl.startsWith('/')) {
      window.location.href = app.demoUrl;
    } else {
      window.open(app.demoUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
              UltriumAI Complete Platform Demo
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
              Experience our unified cybersecurity platform. All tools work together seamlessly - purchase once, access everything, manage from one dashboard.
            </p>
            <div className="flex items-center justify-center gap-6 text-lg font-medium">
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-6 w-6" />
                <span>Complete Platform • Single Login • Unified Dashboard</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg max-w-2xl mx-auto">
              <p className="text-lg font-semibold text-primary">🎯 One Platform, All Tools Included</p>
              <p className="text-muted-foreground">No more managing multiple vendors - everything you need in one place</p>
            </div>
          </div>
        </section>

        {/* Platform Overview */}
        <section className="py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Complete Security Platform</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                All these tools are included in every UltriumAI plan. No add-ons, no extra fees - just one comprehensive platform.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-card rounded-lg">
                <div className="text-2xl font-bold text-primary">12+</div>
                <div className="text-sm text-muted-foreground">Security Tools</div>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <div className="text-2xl font-bold text-success">1</div>
                <div className="text-sm text-muted-foreground">Dashboard</div>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <div className="text-2xl font-bold text-info">1</div>
                <div className="text-sm text-muted-foreground">Login</div>
              </div>
              <div className="p-4 bg-card rounded-lg">
                <div className="text-2xl font-bold text-warning">1</div>
                <div className="text-sm text-muted-foreground">Price</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Categories */}
        <section className="py-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "All Tools" : category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Explore Each Tool</h2>
              <p className="text-lg text-muted-foreground">Every tool is part of your UltriumAI platform - try them individually or use them together</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApps.map((app) => (
                <Card key={app.id} className="card-glow hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <app.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {app.category}
                          </Badge>
                        </div>
                      </div>
                      {app.isLive && (
                        <div className="flex items-center gap-1 text-success text-sm">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                          Live
                        </div>
                      )}
                    </div>
                    <CardDescription className="mt-3">
                      {app.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {app.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {app.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{app.features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Use Cases</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {app.useCases.slice(0, 2).map((useCase, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      onClick={() => handleDemoClick(app)}
                      className="w-full btn-glow"
                      disabled={!app.isLive}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {app.isLive ? "Try Live Demo" : "Coming Soon"}
                      {app.demoUrl.startsWith('http') && (
                        <ExternalLink className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Integrate These Solutions?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              All demos are backed by production-ready APIs. Contact us to discuss custom implementations, white-label solutions, or enterprise deployments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="btn-glow" onClick={() => window.location.href = '/contact'}>
                <Users className="mr-2 h-5 w-5" />
                Schedule Demo Call
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = '/ultriumgpt'}>
                <Zap className="mr-2 h-5 w-5" />
                Explore UltriumGPT
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LiveDemos;