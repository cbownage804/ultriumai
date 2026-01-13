import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductPurchaseCard from "@/components/ProductPurchaseCard";
import { 
  Brain, Package, Shield, Bot, ArrowRight
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
  rmm: {
    features: ["Remote desktop", "Device monitoring", "Script execution", "Multi-client"],
    tags: ["RMM", "Remote Management"]
  },
  helpdesk: {
    features: ["Smart routing", "Auto-responses", "SLA tracking", "Multi-channel"],
    tags: ["Helpdesk", "Automation"]
  },
  safenet: {
    features: ["Topology mapping", "Device discovery", "Vulnerability scanning", "Performance monitoring"],
    tags: ["Network Security", "Monitoring"]
  },
  safeweb: {
    features: ["Credential monitoring", "Breach detection", "Brand protection", "Executive protection"],
    tags: ["Dark Web", "Threat Intelligence"]
  },
};

const Portfolio = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", "security", "operations"];
  
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
              Enterprise-grade tools at startup prices. Purchase individually or bundle everything in Vanguard Suite.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              <span>All products also available in</span>
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
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
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
            <p className="text-xl text-muted-foreground mb-6">
              All 6 products + AI SOC + 24/7 monitoring + unified dashboard. 
              <span className="text-primary font-semibold"> Save up to 40%</span> vs. individual purchases.
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
          </div>
        </section>

        {/* UltriumGPT / AI Studio CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              <Bot className="h-4 w-4 mr-2" />
              Custom AI Solutions
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Custom AI?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Build your own AI assistants and custom GPTs with UltriumAI Studio. 
              Or schedule a consultation for enterprise solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ai-studio">
                <Button size="lg" className="text-lg px-8">
                  <Brain className="mr-2 h-5 w-5" />
                  Try AI Studio
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
