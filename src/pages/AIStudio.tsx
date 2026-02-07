import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AIStudioDashboardHub } from "@/components/ai-studio/AIStudioDashboardHub";
import { AIStudioOnboardingWizard } from "@/components/ai-studio/AIStudioOnboardingWizard";
import { 
  Building, 
  Building2,
  Users, 
  Shield, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Phone,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Globe,
  Wrench,
  Lightbulb,
  Rocket,
  Target,
  Code,
  Brain,
  Play,
  Star,
  Crown,
  Check,
  BookOpen
} from "lucide-react";
import heroAi from "@/assets/hero-ai.jpg";
import ultriumGPTLogo from "@/assets/ultrium-gpt-logo.png";

const AIStudio = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("ai-studio-onboarding-dismissed");
  });

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("ai-studio-onboarding-dismissed", "true");
  };

  const creationPaths = [
    {
      title: "Build It Yourself",
      subtitle: "DIY GPT Builder Platform",
      description: "Our intuitive platform empowers you to create custom GPTs without coding expertise.",
      icon: Wrench,
      gradient: "from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10",
      textColor: "text-foreground",
      features: [
        "Drag-and-drop GPT builder",
        "Pre-built templates for common use cases", 
        "Step-by-step guided setup",
        "Real-time testing and refinement",
        "Knowledge base integration tools",
        "Client-specific customization options"
      ],
      benefits: [
        "Complete control over your GPT",
        "Learn and iterate at your own pace",
        "Cost-effective for multiple GPTs",
        "Immediate deployment capability"
      ],
      cta: "Start Building Free",
      audience: "Perfect for tech-savvy MSPs and businesses who want hands-on control"
    },
    {
      title: "We Build It For You",
      subtitle: "Full-Service GPT Development",
      description: "Our expert team creates custom GPTs tailored to your exact specifications and business needs.",
      icon: Rocket,
      gradient: "from-secondary/50 to-muted/50 dark:from-secondary/30 dark:to-muted/30",
      textColor: "text-foreground",
      features: [
        "Dedicated development team",
        "Custom training on your data",
        "Advanced integrations and workflows",
        "White-label branding options",
        "Ongoing optimization and updates",
        "Enterprise-grade security implementation"
      ],
      benefits: [
        "Professional, polished results",
        "Faster time to deployment",
        "Expert optimization for performance",
        "Comprehensive support and maintenance"
      ],
      cta: "Get Custom Quote",
      audience: "Ideal for busy MSPs and businesses who want professional results without the learning curve"
    }
  ];

  const useCases = [
    {
      title: "For MSPs",
      icon: Settings,
      subtitle: "Multiply Your Service Capacity",
      scenarios: [
        {
          name: "Client Support GPTs",
          description: "Create dedicated GPTs for each client with their specific IT environment, policies, and procedures"
        },
        {
          name: "Internal Operations GPT", 
          description: "Automate your own help desk, onboarding, and standard operating procedures"
        },
        {
          name: "White-Label GPTs",
          description: "Offer GPT services to clients under your brand as a new revenue stream"
        }
      ]
    },
    {
      title: "For Businesses",
      icon: Building,
      subtitle: "Get Enterprise-Level AI Without the Enterprise Cost",
      scenarios: [
        {
          name: "Employee Assistant GPT",
          description: "Handle HR questions, IT support, and company policy guidance 24/7"
        },
        {
          name: "Customer Service GPT",
          description: "Provide instant support to customers with your specific product knowledge"
        },
        {
          name: "Process Automation GPT",
          description: "Streamline workflows, approvals, and routine business processes"
        }
      ]
    }
  ];

  const platformFeatures = [
    {
      icon: Brain,
      title: "Smart Knowledge Training",
      description: "Upload your documents, policies, and procedures. Our platform intelligently processes and trains your GPT."
    },
    {
      icon: Shield,
      title: "Security-First Design", 
      description: "Built-in data protection, access controls, and compliance features for business-grade security."
    },
    {
      icon: Code,
      title: "No-Code Integration",
      description: "Connect to your existing tools and systems without writing a single line of code."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track usage, measure ROI, and optimize your GPT's performance with detailed insights."
    },
    {
      icon: Users,
      title: "Multi-User Management",
      description: "Set up different access levels for employees, clients, and administrators."
    },
    {
      icon: Target,
      title: "Continuous Learning",
      description: "Your GPT gets smarter over time, learning from interactions and feedback."
    }
  ];

  return (
    <div className="min-h-screen bg-background safe-area-inset-bottom">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-12 sm:pb-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroAi} 
            alt="AI neural network"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-violet-500/15 rounded-full blur-[60px] sm:blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 sm:space-y-10">
            <div className="space-y-6 sm:space-y-8">
              {/* Logo */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-violet-500 rounded-2xl sm:rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative px-6 py-4 sm:px-14 sm:py-8 bg-black rounded-xl sm:rounded-2xl shadow-2xl shadow-primary/30">
                    <img src={ultriumGPTLogo} alt="AI Studio" className="h-16 sm:h-24 md:h-32 w-auto object-contain" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-muted-foreground px-2">
                Custom GPT Builder Platform
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
                Build intelligent AI assistants in minutes, not months. Deploy custom GPTs trained on YOUR data, 
                YOUR processes, YOUR way—whether you're an MSP scaling services or a business automating operations.
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/10 to-primary/20 rounded-2xl blur-sm" />
              <div className="relative bg-gradient-to-r from-primary/10 via-violet-500/5 to-primary/10 rounded-2xl p-8 max-w-3xl mx-auto border border-primary/20">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span className="font-semibold text-primary text-lg">Two Paths to Success</span>
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  Build it yourself with our platform, or let our experts build it for you. Either way, you get GPTs that know your business inside and out.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center flex-wrap px-4">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 h-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 touch-target tap-scale" onClick={() => navigate('/ai-studio/assistant')}>
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Launch AI Studio
              </Button>
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 h-auto border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 touch-target tap-scale" onClick={() => navigate('/demos/custom-gpt-builder')}>
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                View Demo
              </Button>
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 h-auto border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 touch-target tap-scale" onClick={() => navigate('/docs/ai-studio')}>
                <BookOpen className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Documentation
              </Button>
              <Button variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-7 h-auto border-border/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all duration-300 touch-target tap-scale" onClick={() => navigate('/contact')}>
                <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Hub */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {showOnboarding && (
            <div className="mb-6">
              <AIStudioOnboardingWizard 
                onComplete={handleDismissOnboarding} 
                onDismiss={handleDismissOnboarding} 
              />
            </div>
          )}
          <AIStudioDashboardHub />
        </div>
      </section>

      {/* Creation Paths Section */}
      <section className="py-12 sm:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4 sm:mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Choose Your Path</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground px-2">
              Choose Your GPT Creation Path
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
              Two distinct approaches to get you the custom GPT your business needs—both designed to deliver professional, 
              security-focused results that integrate seamlessly with your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
            {creationPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <Card key={index} className={`hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-gradient-to-br ${path.gradient} border-2 border-border/50 hover:border-primary/30 hover-lift`}>
                  <CardHeader className="text-center px-4 sm:px-6">
                    <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl">{path.title}</CardTitle>
                    <CardDescription className="text-base sm:text-lg font-semibold text-primary">
                      {path.subtitle}
                    </CardDescription>
                    <p className="text-muted-foreground mt-2">
                      {path.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-foreground">What You Get:</h4>
                      <ul className="space-y-2">
                        {path.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-foreground">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {path.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground font-medium mb-4">{path.audience}</p>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          if (path.cta === "Start Building Free") {
                            navigate('/auth');
                          } else if (path.cta === "Get Custom Quote") {
                            navigate('/contact');
                          }
                        }}
                      >
                        {path.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Real-World GPT Applications
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how businesses like yours are using custom GPTs to transform their operations, 
              reduce costs, and deliver better service to their customers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                        <CardDescription className="text-lg font-medium text-primary">
                          {useCase.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {useCase.scenarios.map((scenario, idx) => (
                        <div key={idx} className="border border-border/50 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <h5 className="font-semibold text-foreground mb-2">{scenario.name}</h5>
                          <p className="text-sm text-muted-foreground">{scenario.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Built for Business. Designed for Success.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every AI Studio GPT comes with enterprise-grade features that ensure your AI assistant 
              is secure, scalable, and perfectly integrated with your business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIStudio;