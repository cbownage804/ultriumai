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
import { useScrollAnimation, getAnimationClasses, useStaggeredScrollAnimation } from "@/hooks/useScrollAnimation";

const Features = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, visibleItems: cardsVisible } = useStaggeredScrollAnimation(9, 100);

  const features = [
    {
      icon: MessageSquare,
      title: "Custom AI Agents",
      description: "Built specifically for your business workflows, trained on your actual policies and procedures."
    },
    {
      icon: Shield,
      title: "Security-First Design", 
      description: "Every GPT comes with built-in cybersecurity features, threat detection, and data protection protocols."
    },
    {
      icon: Users,
      title: "Multi-Industry Expertise",
      description: "Specialized solutions for IT teams, MSPs, accounting firms, automotive shops, and SMBs."
    },
    {
      icon: Zap,
      title: "Automated Support",
      description: "Reduce helpdesk tickets by 20-30% with intelligent automation that handles common requests instantly."
    },
    {
      icon: Settings,
      title: "Seamless Integration",
      description: "Connect with your existing tools, RMM platforms, PSA systems, and business applications."
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track performance, measure ROI, and optimize your AI agents with comprehensive reporting."
    },
    {
      icon: Globe,
      title: "White-Glove Setup",
      description: "Our team handles everything from initial setup to ongoing support and optimization."
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Your AI agents reflect your brand with custom colors, logos, and messaging."
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description: "Transform your existing documentation into interactive, searchable knowledge bases."
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={getAnimationClasses(headerVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Comprehensive AI Solutions for Modern Business
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From custom GPT development to AI-powered security scanning, UltriumAI delivers enterprise-grade 
              solutions that are secure, scalable, and tailored to your specific business needs.
            </p>
          </div>
        </div>
        
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`p-6 hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 card-glow group ${getAnimationClasses(cardsVisible[index], 'fadeUp')}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <feature.icon className="w-6 h-6 text-primary group-hover:animate-glow" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-gradient transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
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