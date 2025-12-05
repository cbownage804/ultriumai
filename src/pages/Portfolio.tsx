import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Shield, Lock, Search, Bot, Network, Wrench, MessageSquare, Eye, 
  Play, ArrowRight, Brain, CheckCircle
} from "lucide-react";
import { Link } from 'react-router-dom';

interface PortfolioItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  demoUrl: string;
  tags: string[];
}

const portfolioItems: PortfolioItem[] = [
  {
    id: "safescan",
    name: "Ultrium SafeScan™",
    category: "Security Tools",
    description: "AI-powered unified security scanner for emails, links, and documents with real-time threat detection",
    icon: Shield,
    features: ["Email scanning", "Link analysis", "Document security", "AI threat detection"],
    demoUrl: "/demos/safescan",
    tags: ["Security", "AI Analysis", "Multi-Vector"]
  },
  {
    id: "ultriumgpt",
    name: "UltriumGPT",
    category: "AI Assistants",
    description: "Intelligent business assistant trained on MSP procedures and IT documentation",
    icon: Bot,
    features: ["IT troubleshooting", "Document analysis", "Multi-language support", "Custom training"],
    demoUrl: "/demos/ultriumgpt",
    tags: ["AI Assistant", "MSP", "IT Support"]
  },
  {
    id: "safepass",
    name: "Ultrium SafePass™",
    category: "Security Tools",
    description: "Enterprise password management with breach monitoring and team collaboration",
    icon: Lock,
    features: ["Secure generation", "Breach monitoring", "Team sharing", "MFA support"],
    demoUrl: "/demos/safepass",
    tags: ["Password Security", "Enterprise"]
  },
  {
    id: "safenet",
    name: "Ultrium SafeNet™",
    category: "Security Tools",
    description: "Network discovery, topology mapping, and vulnerability assessment platform",
    icon: Network,
    features: ["Topology mapping", "Device discovery", "Vulnerability scanning", "Performance monitoring"],
    demoUrl: "/demos/safenet",
    tags: ["Network Security", "Monitoring"]
  },
  {
    id: "helpdesk",
    name: "Ultrium Helpdesk™",
    category: "Operations Tools",
    description: "AI-powered ticketing and helpdesk automation with intelligent routing",
    icon: MessageSquare,
    features: ["Smart routing", "Auto-responses", "SLA tracking", "Multi-channel"],
    demoUrl: "/demos/ticketing",
    tags: ["Helpdesk", "Automation"]
  },
  {
    id: "rmm",
    name: "Ultrium RMM™",
    category: "Operations Tools",
    description: "Remote monitoring and management with web-based agent deployment",
    icon: Wrench,
    features: ["Remote desktop", "Device monitoring", "Script execution", "Multi-client"],
    demoUrl: "/demos/rmm",
    tags: ["RMM", "Remote Management"]
  },
  {
    id: "safeshield",
    name: "Ultrium SafeShield™",
    category: "Security Tools",
    description: "Unified AI-powered security platform combining EDR, MDR, and behavioral analysis",
    icon: Eye,
    features: ["AI behavioral engine", "Unified EDR/MDR", "Autonomous hunting", "Real-time response"],
    demoUrl: "/demos/safeshield",
    tags: ["EDR", "AI Security", "Unified Platform"]
  },
  {
    id: "safeweb",
    name: "Ultrium SafeWeb™",
    category: "Security Tools",
    description: "Dark web monitoring and threat intelligence platform for compromised credentials",
    icon: Search,
    features: ["Credential monitoring", "Breach detection", "Brand protection", "Executive protection"],
    demoUrl: "/demos/safeintel",
    tags: ["Dark Web", "Threat Intelligence"]
  }
];

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "Security Tools", "AI Assistants", "Operations Tools"];
  
  const filteredItems = selectedCategory === "all" 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">
              <Brain className="h-4 w-4 mr-2" />
              Our Work
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
              AI Portfolio
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real solutions we've built for real businesses. Each tool demonstrates what's possible when you partner with UltriumAI.
            </p>
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
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "All Solutions" : category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Portfolio Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4">{item.name}</CardTitle>
                    <CardDescription className="text-sm">{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-2 mb-6 flex-1">
                      {item.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Link to={item.demoUrl} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Play className="mr-2 h-4 w-4" /> Try Demo
                        </Button>
                      </Link>
                      <Link to="/contact">
                        <Button size="icon" variant="ghost">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Like What You See?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let's build something amazing for your business. Start with our AI Studio or schedule a consultation for custom development.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ai-studio">
                <Button size="lg" className="text-lg px-8">
                  <Brain className="mr-2 h-5 w-5" />
                  Start Building on AI Studio
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Schedule Consultation
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;
