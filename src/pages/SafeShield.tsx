import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Monitor, 
  Activity, 
  AlertTriangle,
  Zap,
  Eye,
  Lock,
  Bot,
  Play,
  Users,
  Building,
  CheckCircle2,
  ArrowRight,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const stats = {
  endpoints_protected: 15000,
  threats_blocked: 8500,
  msp_partners: 250,
  detection_rate: 99.8
};

const features = [
  {
    icon: Bot,
    title: "AI-Powered Detection",
    description: "Advanced machine learning algorithms detect threats with 99.8% accuracy"
  },
  {
    icon: Shield,
    title: "Real-time Protection",
    description: "Continuous monitoring and instant response to security threats"
  },
  {
    icon: Monitor,
    title: "Endpoint Management",
    description: "Centralized management of all endpoints across your organization"
  },
  {
    icon: Activity,
    title: "Threat Analytics",
    description: "Comprehensive analytics and reporting for security insights"
  },
  {
    icon: Users,
    title: "MSP Ready",
    description: "Multi-tenant architecture designed for Managed Service Providers"
  },
  {
    icon: Lock,
    title: "Automated Response",
    description: "Intelligent automated responses to contain and neutralize threats"
  }
];

const testimonials = [
  {
    name: "Michael Chen",
    role: "IT Director",
    company: "TechCorp Solutions",
    quote: "SafeShield has revolutionized our security posture. The AI-driven insights are incredible."
  },
  {
    name: "Sarah Johnson",
    role: "MSP Owner",
    company: "SecureIT Partners",
    quote: "Managing security for 50+ clients has never been easier. SafeShield is a game-changer."
  },
  {
    name: "David Rodriguez",
    role: "CISO",
    company: "Financial Services Inc",
    quote: "The real-time threat detection and response capabilities are outstanding."
  }
];

export default function SafeShield() {
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const { toast } = useToast();

  const runLiveDemo = async () => {
    setDemoRunning(true);
    setDemoStep(1);
    
    toast({
      title: "🛡️ SafeShield Demo Started",
      description: "Simulating real-time threat detection...",
    });

    // Step 1: Endpoint Registration
    setTimeout(() => {
      setDemoStep(2);
      toast({
        title: "✅ Endpoint Registered",
        description: "New endpoint 'DEMO-WORKSTATION' added to SafeShield",
      });
    }, 1500);

    // Step 2: Threat Detection
    setTimeout(() => {
      setDemoStep(3);
      toast({
        title: "🚨 Threat Detected!",
        description: "Ransomware detected on DEMO-WORKSTATION - Confidence: 96%",
        variant: "destructive",
      });
    }, 3000);

    // Step 3: AI Analysis
    setTimeout(() => {
      setDemoStep(4);
      toast({
        title: "🤖 AI Analysis Complete",
        description: "Threat analyzed, containment strategy generated",
      });
    }, 4500);

    // Step 4: Automated Response
    setTimeout(() => {
      setDemoStep(5);
      toast({
        title: "🔒 Endpoint Isolated",
        description: "Automatic isolation deployed, threat contained",
      });
    }, 6000);

    // Reset demo
    setTimeout(() => {
      setDemoRunning(false);
      setDemoStep(0);
      toast({
        title: "✨ Demo Complete",
        description: "SafeShield successfully neutralized the threat!",
      });
    }, 7500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-16 w-16 text-blue-600 mr-4" />
              <h1 className="text-5xl font-bold text-gray-900">SafeShield EDR</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Next-generation AI-powered Endpoint Detection & Response platform that protects your business 
              from advanced threats with real-time monitoring and intelligent response capabilities.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={runLiveDemo} disabled={demoRunning}>
                <Play className="h-5 w-5 mr-2" />
                {demoRunning ? 'Demo Running...' : 'Live Demo'}
              </Button>
              <Link to="/auth">
                <Button variant="outline" size="lg">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Demo Dashboard */}
          {demoRunning && (
            <div className="bg-white rounded-lg shadow-xl p-6 mb-12 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  Live SafeShield Demo
                </h3>
                <Badge variant="secondary">Step {demoStep}/5</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className={demoStep >= 1 ? "border-green-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Monitor className={`h-8 w-8 ${demoStep >= 1 ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold">Endpoints</p>
                        <p className="text-2xl font-bold">{demoStep >= 1 ? '1' : '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={demoStep >= 3 ? "border-red-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className={`h-8 w-8 ${demoStep >= 3 ? 'text-red-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold">Threats</p>
                        <p className="text-2xl font-bold">{demoStep >= 3 ? '1' : '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={demoStep >= 4 ? "border-blue-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Bot className={`h-8 w-8 ${demoStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold">AI Analysis</p>
                        <p className="text-2xl font-bold">{demoStep >= 4 ? '96%' : '0%'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={demoStep >= 5 ? "border-orange-500" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Lock className={`h-8 w-8 ${demoStep >= 5 ? 'text-orange-600' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-semibold">Isolated</p>
                        <p className="text-2xl font-bold">{demoStep >= 5 ? '1' : '0'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Progress value={(demoStep / 5) * 100} className="mb-4" />
              <p className="text-center text-gray-600">
                {demoStep === 1 && "Registering new endpoint..."}
                {demoStep === 2 && "Monitoring for threats..."}
                {demoStep === 3 && "Analyzing threat behavior..."}
                {demoStep === 4 && "Generating response strategy..."}
                {demoStep === 5 && "Executing automated containment..."}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.endpoints_protected.toLocaleString()}+</div>
              <div className="text-gray-600">Endpoints Protected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.threats_blocked.toLocaleString()}+</div>
              <div className="text-gray-600">Threats Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.msp_partners}+</div>
              <div className="text-gray-600">MSP Partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.detection_rate}%</div>
              <div className="text-gray-600">Detection Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SafeShield combines cutting-edge AI technology with proven security practices 
              to deliver unparalleled endpoint protection.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
            <p className="text-gray-600">Trusted by hundreds of businesses and MSPs worldwide</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    <p className="text-sm text-gray-500">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of organizations that trust SafeShield to protect their endpoints
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}