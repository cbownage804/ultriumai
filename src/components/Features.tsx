import { Card } from "@/components/ui/card";
import { 
  MessageSquare, 
  Users, 
  Palette, 
  Zap, 
  Shield, 
  BarChart3,
  Settings,
  Globe,
  FileText
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Multi-Platform Embedding",
      description: "Seamlessly embed in Microsoft Teams, Slack, or any custom application with our widget SDK."
    },
    {
      icon: Users,
      title: "Multi-Tenant Architecture", 
      description: "Separate knowledge bases for each customer with isolated data and complete privacy."
    },
    {
      icon: Palette,
      title: "White-Label Branding",
      description: "Customize colors, logos, and branding for each customer's unique identity."
    },
    {
      icon: Zap,
      title: "Instant AI Responses",
      description: "Get accurate answers from your docs in seconds. Reduce support tickets by 20-30%."
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliant with data encryption, role-based access, and audit trails."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track usage, popular queries, and ROI metrics for each customer tenant."
    },
    {
      icon: Settings,
      title: "Easy Knowledge Management",
      description: "Upload docs, PDFs, wikis, and runbooks. AI automatically indexes and optimizes."
    },
    {
      icon: Globe,
      title: "API & Webhooks",
      description: "Integrate with existing tools and workflows via REST API and webhook notifications."
    },
    {
      icon: FileText,
      title: "Smart Document Processing",
      description: "Automatically extract and structure knowledge from PDFs, Word docs, and web pages."
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Everything You Need for AI Knowledge Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built for teams that need instant access to accurate information. 
            Scale across multiple customers with enterprise-grade features.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;