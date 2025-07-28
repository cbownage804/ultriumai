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
                UltriumGPT Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Create Custom GPTs That Actually Work for Your Business
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Whether you're an MSP looking to scale your services or a business wanting to automate operations—
                build intelligent AI assistants trained on YOUR data, YOUR processes, YOUR way.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-primary">Two Paths to Success</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Build it yourself with our platform, or let our experts build it for you. Either way, you get GPTs that know your business inside and out.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '/ai-studio'}>
                <Play className="mr-2 h-5 w-5" />
                Launch UltriumGPT Studio
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

      {/* Creation Paths Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Choose Your GPT Creation Path
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Two distinct approaches to get you the custom GPT your business needs—both designed to deliver professional, 
              security-focused results that integrate seamlessly with your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {creationPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <Card key={index} className={`hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${path.gradient} border-2 hover:border-primary/20 hover:scale-105`}>
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-black">{path.title}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-black/80">
                      {path.subtitle}
                    </CardDescription>
                    <p className="text-black/70 mt-2">
                      {path.description}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3 text-black">What You Get:</h4>
                      <ul className="space-y-2">
                        {path.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-black/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 text-black">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {path.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-black/70">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-black/10">
                      <p className="text-sm text-black/60 font-medium mb-4">{path.audience}</p>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          if (path.cta === "Start Building Free") {
                            window.location.href = '/auth';
                          } else if (path.cta === "Get Custom Quote") {
                            window.location.href = '/contact';
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
              Every UltriumGPT comes with enterprise-grade features that ensure your AI assistant 
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

      {/* Custom GPT Builder™ Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 mb-12">
            <Badge variant="secondary" className="animate-pulse">
              <Zap className="h-4 w-4 mr-2" />
              Revolutionary AI Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              Custom GPT Builder™ Pricing
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Build unlimited custom AI assistants for your business. No coding required, 
              unlimited knowledge bases, white-label deployment included.
            </p>
          </div>

          {/* Custom GPT Builder Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Starter GPT Plan */}
            <Card className="bg-white/80 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Starter</CardTitle>
                <CardDescription className="text-base">Perfect for small teams</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$99</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">1 Custom GPT assistant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">500 queries per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">1GB knowledge base storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Up to 3 team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Basic analytics & usage tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">API access & webhooks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Email support</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => window.location.href = '/auth'}>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Professional GPT Plan - Most Popular */}
            <Card className="bg-gradient-to-br from-white/90 to-primary/5 border-2 border-primary shadow-lg scale-105 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
              
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Professional</CardTitle>
                <CardDescription className="text-base">Everything you need for business AI</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$499</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">5 Custom GPT assistants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">2,500 queries per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">5GB knowledge base storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Up to 10 team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Advanced analytics & insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">White-label deployment options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Remove "Powered by UltriumAI" branding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Advanced integrations</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" onClick={() => window.location.href = '/auth'}>
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise GPT Plan */}
            <Card className="bg-white/80 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Enterprise</CardTitle>
                <CardDescription className="text-base">For large-scale deployments</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">Custom</div>
                  <div className="text-sm text-muted-foreground">Contact for pricing</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">25 Custom GPT assistants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom query limits (high volume)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">25GB+ custom data storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Unlimited team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Enterprise security & compliance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">24/7 priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">On-premise deployment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom training & setup</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => window.location.href = '/contact'}>
                  Contact Sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Live Demo CTA */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-2xl p-8 border-2 border-primary/30 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-block">
                  <Badge variant="secondary" className="animate-pulse bg-green-100 text-green-800 text-sm px-4 py-2">
                    <Play className="mr-2 h-4 w-4" />
                    Interactive Demo Available
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  See Custom GPT Builder™ in Action
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Experience our revolutionary AI platform firsthand. Build your first custom GPT in under 5 minutes.
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => window.location.href = '/demos/custom-gpt-builder'}
                >
                  <Play className="mr-3 h-6 w-6" />
                  Try Live Demo Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UltriumGPT;