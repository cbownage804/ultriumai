import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
  Check
} from "lucide-react";

const UltriumGPT = () => {
  const creationPaths = [
    {
      title: "Build It Yourself",
      subtitle: "DIY GPT Builder Platform",
      description: "Our intuitive platform empowers you to create custom GPTs without coding expertise.",
      icon: Wrench,
      gradient: "from-blue-100 to-indigo-100",
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
      gradient: "from-purple-100 to-violet-100",
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                <Brain className="h-4 w-4 mr-2" />
                Ultrium GPT Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Advanced AI Platform for Security Operations Analysis
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Comprehensive AI-powered business intelligence platform that enhances security operations with advanced analytics, automated reporting, policy generation, and workflow optimization.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-primary">Business Intelligence Platform</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Transform your security operations with AI-powered insights, automated analysis, and intelligent workflow optimization.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '/ai-studio'}>
                <Play className="mr-2 h-5 w-5" />
                Launch Ultrium GPT Platform
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '/demos/ultriumgpt'}>
                <Play className="mr-2 h-5 w-5" />
                View Demo
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '/contact'}>
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Built for Security Operations. Designed for Intelligence.
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ultrium GPT comes with enterprise-grade features that ensure your business intelligence 
              platform is secure, scalable, and perfectly integrated with your security operations.
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

export default UltriumGPT;