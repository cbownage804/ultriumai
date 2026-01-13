import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductPurchaseCard from "@/components/ProductPurchaseCard";
import { 
  Brain, Package, Shield, ArrowRight
} from "lucide-react";
import { Link } from 'react-router-dom';
import { STANDALONE_PRODUCTS } from '@/config/productPricing';

// Product features for each item
const productFeatures: Record<string, { features: string[]; tags: string[] }> = {
  safescan: {
    features: ["Email scanning", "Link analysis", "Document security", "AI threat detection"],
    tags: ["Security", "AI Analysis", "Multi-Vector"]
  },
  safepass: {
    features: ["Secure generation", "Breach monitoring", "Team sharing", "MFA support"],
    tags: ["Password Security", "Enterprise"]
  },
  safenet: {
    features: ["Network discovery", "Topology mapping", "Vulnerability scanning", "Asset inventory"],
    tags: ["Network Security", "Discovery"]
  },
  safeweb: {
    features: ["Credential monitoring", "Breach detection", "Brand protection", "Executive alerts"],
    tags: ["Dark Web", "Threat Intel"]
  },
  safemdr: {
    features: ["24/7 monitoring", "AI SOC analysis", "Incident response", "Threat hunting"],
    tags: ["MDR", "SOC", "24/7"]
  },
  safeshield: {
    features: ["Real-time protection", "AI threat prevention", "Quarantine", "Rollback"],
    tags: ["Antivirus", "EDR"]
  },
  rmm: {
    features: ["Remote desktop", "Device monitoring", "Script execution", "Multi-client"],
    tags: ["RMM", "Remote Management"]
  },
  helpdesk: {
    features: [
      "Tier 1 AI Auto-Resolution",
      "Smart Escalation Engine",
      "Multi-Channel Support",
      "Self-Service Portal"
    ],
    tags: ["AI Agent", "Helpdesk", "Automation"]
  },
  safetrack: {
    features: ["Asset lifecycle", "Depreciation tracking", "QR codes", "Maintenance schedules"],
    tags: ["ITAM", "Asset Management"]
  },
  ultriumgpt: {
    features: ["Custom AI training", "Document analysis", "Multi-language", "API integrations"],
    tags: ["AI Assistant", "Custom GPT", "Unlimited Users"]
  },
};

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "security", "operations", "ai"];
  
  const filteredProducts = selectedCategory === "all" 
    ? Object.values(STANDALONE_PRODUCTS)
    : Object.values(STANDALONE_PRODUCTS).filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-4">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Security & Operations
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6">
              Product Portfolio
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Enterprise-grade tools at startup prices. Purchase individually or bundle in Vanguard Suite.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>Security & Operations products also available in</span>
              <Link to="/vanguard/suite" className="text-primary font-medium hover:underline">
                Ultrium Vanguard Suite →
              </Link>
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid w-full max-w-lg mx-auto grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="ai">AI</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductPurchaseCard
                  key={product.id}
                  product={product}
                  features={productFeatures[product.id]?.features || []}
                  tags={productFeatures[product.id]?.tags || []}
                />
              ))}
            </div>
          </div>
        </section>

        {/* AI Helpdesk Feature Highlight */}
        <section className="py-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-y border-primary/20">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Support
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ultrium AI Helpdesk™
              </h2>
              <p className="text-xl text-muted-foreground">
                Let AI handle Tier 1 support—automatically resolve routine tickets while escalating complex issues intelligently.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-background/60 rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary mb-1">85%+</div>
                <div className="text-sm text-muted-foreground">Auto-resolution for routine tickets</div>
              </div>
              <div className="bg-background/60 rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">AI agent always available</div>
              </div>
              <div className="bg-background/60 rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary mb-1">3 min</div>
                <div className="text-sm text-muted-foreground">Avg. first response time</div>
              </div>
              <div className="bg-background/60 rounded-lg p-4 border border-border/50">
                <div className="text-3xl font-bold text-primary mb-1">47%</div>
                <div className="text-sm text-muted-foreground">Cheaper than Zendesk</div>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-background/80 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-3">🤖 Tier 1 Auto-Resolution</h3>
                <p className="text-muted-foreground text-sm">
                  AI analyzes incoming tickets and automatically resolves routine issues—password resets, 
                  how-to questions, common troubleshooting. Users receive instant AI-generated solutions 
                  via email with feedback buttons.
                </p>
              </div>
              <div className="bg-background/80 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-3">📊 Smart Escalation</h3>
                <p className="text-muted-foreground text-sm">
                  For complex issues, AI triages the ticket with full context, suggests solutions to 
                  technicians, and routes to the right specialist. Techs can Accept, Edit, or Reject 
                  AI suggestions before responding.
                </p>
              </div>
              <div className="bg-background/80 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-3">📱 Multi-Channel AI</h3>
                <p className="text-muted-foreground text-sm">
                  AI handles tickets from email, live chat, and even phone call transcripts. 
                  Same intelligent routing and resolution across all channels with unified 
                  conversation history.
                </p>
              </div>
              <div className="bg-background/80 rounded-lg p-6 border border-border/50">
                <h3 className="font-semibold text-lg mb-3">🔍 Self-Service Portal</h3>
                <p className="text-muted-foreground text-sm">
                  AI-powered knowledge base deflects tickets before they're created. Users search 
                  and get instant answers, reducing ticket volume by up to 40%. Portal customizable 
                  per client.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Vanguard Suite CTA */}
        <section className="py-12 bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border-y border-primary/20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              <Package className="h-4 w-4 mr-2" />
              Save More with Bundle
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Everything in Vanguard Suite
            </h2>
            <p className="text-xl text-muted-foreground mb-2">
              SafeScan + SafePass + RMM + AI Helpdesk + SafeWeb + Network Monitoring + AI SOC
            </p>
            <p className="text-muted-foreground mb-6">
              <span className="text-primary font-semibold">Save up to 40%</span> vs. individual purchases
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-sm">
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <div className="font-semibold">Starter</div>
                <div className="text-2xl font-bold text-primary">$5<span className="text-sm text-muted-foreground">/user/mo</span></div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-primary/30">
                <div className="font-semibold">Professional</div>
                <div className="text-2xl font-bold text-primary">$12<span className="text-sm text-muted-foreground">/user/mo</span></div>
              </div>
              <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                <div className="font-semibold">Enterprise</div>
                <div className="text-2xl font-bold text-primary">$20<span className="text-sm text-muted-foreground">/user/mo</span></div>
              </div>
            </div>
            <Link to="/vanguard/suite">
              <Button size="lg" className="text-lg px-8">
                <Package className="mr-2 h-5 w-5" />
                View Vanguard Suite Pricing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-4">
              Note: UltriumGPT is a separate AI platform and not included in Vanguard Suite
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;
