import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
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
  Play
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
    id: "ultrium-safeemail",
    name: "Ultrium SafeEmail",
    category: "Email Security",
    description: "AI-powered email analysis and threat detection",
    longDescription: "Advanced email security solution that uses AI to analyze incoming emails for phishing attempts, malware, suspicious links, and social engineering attacks. Provides real-time threat assessment with detailed risk scoring.",
    icon: Shield,
    features: [
      "Real-time phishing detection",
      "Malware scanning",
      "Link analysis and safety scoring",
      "Social engineering detection",
      "Detailed threat reports",
      "API integration ready"
    ],
    demoUrl: "https://safeemail-demo.ultriumai.com",
    isLive: true,
    tags: ["Email Security", "AI Detection", "Threat Analysis"],
    useCases: [
      "Corporate email protection",
      "MSP client security",
      "Personal email screening",
      "Compliance monitoring"
    ]
  },
  {
    id: "ultrium-safelink",
    name: "Ultrium SafeLink",
    category: "Link Security",
    description: "Comprehensive URL analysis and safety verification",
    longDescription: "Intelligent link analysis tool that scans URLs for malicious content, phishing sites, malware distribution, and reputation issues. Provides comprehensive safety reports with risk assessments.",
    icon: Lock,
    features: [
      "URL reputation analysis",
      "Malware detection",
      "Phishing site identification",
      "SSL certificate validation",
      "Domain age and history check",
      "Real-time scanning results"
    ],
    demoUrl: "https://safelink-demo.ultriumai.com",
    isLive: true,
    tags: ["URL Security", "Link Analysis", "Web Safety"],
    useCases: [
      "Browser extension integration",
      "Email link verification",
      "Social media safety",
      "Employee training tools"
    ]
  },
  {
    id: "ultrium-safedoc",
    name: "Ultrium SafeDoc",
    category: "Document Security",
    description: "Document analysis and content safety verification",
    longDescription: "Advanced document scanner that analyzes files for malicious content, embedded threats, suspicious macros, and data security issues. Supports multiple file formats with detailed security assessments.",
    icon: FileText,
    features: [
      "Multi-format document scanning",
      "Macro analysis",
      "Embedded threat detection",
      "Content safety verification",
      "Metadata analysis",
      "Quarantine recommendations"
    ],
    demoUrl: "https://safedoc-demo.ultriumai.com",
    isLive: true,
    tags: ["Document Security", "File Analysis", "Content Safety"],
    useCases: [
      "Email attachment screening",
      "File upload protection",
      "Document workflow security",
      "Compliance verification"
    ]
  },
  {
    id: "ultrium-darkweb",
    name: "Ultrium DarkWeb Scanner",
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
    demoUrl: "https://darkweb-demo.ultriumai.com",
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
    demoUrl: "/ultriumgpt",
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

  const categories = ["all", "Email Security", "Link Security", "Document Security", "Threat Intelligence", "AI Assistant"];
  
  const filteredApps = selectedCategory === "all" 
    ? demoApps 
    : demoApps.filter(app => app.category === selectedCategory);

  const handleDemoClick = (app: DemoApp) => {
    if (app.demoUrl.startsWith('http')) {
      window.open(app.demoUrl, '_blank');
    } else {
      window.location.href = app.demoUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
              Live AI Security Demos
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
              Experience our AI-powered security applications in action. Each demo showcases real capabilities you can integrate into your business today.
            </p>
            <div className="flex items-center justify-center gap-2 text-lg font-medium text-primary">
              <Shield className="h-6 w-6" />
              <span>Production-Ready • API Available • Enterprise-Grade</span>
            </div>
          </div>
        </section>

        {/* Category Filter */}
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
                  {category === "all" ? "All Demos" : category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredApps.map((app) => (
                <Card key={app.id} className="card-glow hover:scale-105 transition-all duration-300">
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
              <Button size="lg" className="btn-glow" onClick={() => window.location.href = '#contact'}>
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
    </div>
  );
};

export default LiveDemos;