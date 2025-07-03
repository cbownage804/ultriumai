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
      title: "MSP Multi-Tenant Architecture", 
      description: "Isolated knowledge bases for each client with complete data separation and privacy controls."
    },
    {
      icon: Palette,
      title: "White-Label Client Portals",
      description: "Fully branded experience with your MSP's colors, logos, and custom domain integration."
    },
    {
      icon: Zap,
      title: "Instant Client Support",
      description: "Deliver accurate answers from client documentation in seconds. Reduce tier-1 tickets by 20-30%."
    },
    {
      icon: Shield,
      title: "MSP-Grade Security",
      description: "SOC 2 Type II compliant with encryption, role-based access, and comprehensive audit trails."
    },
    {
      icon: BarChart3,
      title: "MSP Performance Analytics",
      description: "Track client usage, ticket reduction metrics, and ROI reporting across all tenants."
    },
    {
      icon: Settings,
      title: "Streamlined Knowledge Ops",
      description: "Bulk upload client documentation, runbooks, and procedures. AI handles indexing automatically."
    },
    {
      icon: Globe,
      title: "RMM & PSA Integration",
      description: "Connect with ConnectWise, Autotask, Kaseya, and other MSP platforms via REST API."
    },
    {
      icon: FileText,
      title: "Smart Documentation Processing",
      description: "AI automatically extracts knowledge from client SOPs, network diagrams, and troubleshooting guides."
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Built for MSPs and MSSPs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade AI knowledge management designed specifically for managed service providers. 
            Scale your support operations while delivering exceptional client experiences.
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