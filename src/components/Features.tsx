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
      title: "Custom AI Agents & GPTs",
      description: "Build powerful AI assistants tailored to your business workflows, complete with knowledge bases and custom actions."
    },
    {
      icon: Shield,
      title: "Mobile Technician Apps", 
      description: "iOS & Android field operations apps with GPS tracking, camera integration, and real-time alert management."
    },
    {
      icon: Users,
      title: "White-Label Solutions",
      description: "Complete white-label platform for MSPs and partners with custom branding, colors, and co-management capabilities."
    },
    {
      icon: Zap,
      title: "8 Security Applications",
      description: "Enterprise-grade security suite including SafeMail, SafeDoc, SafeNet, SafePass, and 4 more protection tools."
    },
    {
      icon: Settings,
      title: "RMM & SafeDesk Integration",
      description: "Seamless integration with existing RMM platforms, PSA systems, and SafeDesk automation workflows."
    },
    {
      icon: BarChart3,
      title: "SIEM & Compliance Tools",
      description: "Advanced security monitoring, incident management, and automated compliance reporting for multiple frameworks."
    },
    {
      icon: Globe,
      title: "API & Developer Platform",
      description: "Full REST API access, webhook integrations, and developer tools for custom integrations and automation."
    },
    {
      icon: Palette,
      title: "MSP Client Management",
      description: "Complete MSP portal with client management, billing integration, and co-managed service delivery."
    },
    {
      icon: FileText,
      title: "Knowledge Management",
      description: "Transform documents into intelligent, searchable knowledge bases with AI-powered content analysis."
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