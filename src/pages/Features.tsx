import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import {
  Bot, Shield, Monitor, Users, Database, Zap, Globe, Lock,
  Brain, Eye, Mic, FileText, Search, Wifi, Smartphone, Award,
  TrendingUp, BarChart, MessageSquare, Settings, Clock, Star,
  CheckCircle, X, ArrowRight
} from 'lucide-react';

const Features = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const coreFeatures = [
    {
      icon: Bot,
      title: "UltriumGPT AI Assistant",
      description: "Advanced AI-powered security co-pilot with reasoning, memory, and web browsing capabilities",
      features: ["Natural language security analysis", "Real-time threat intelligence", "Automated response suggestions", "Context-aware recommendations"],
      tier: "free",
      demo: "/demos/ultriumgpt"
    },
    {
      icon: Shield,
      title: "SafeShield™ Platform",
      description: "Comprehensive cybersecurity ecosystem with integrated threat detection and response",
      features: ["24/7 threat monitoring", "Incident response automation", "Compliance reporting", "Risk assessment tools"],
      tier: "premium",
      demo: "/demos/safeshield"
    },
    {
      icon: Monitor,
      title: "Remote Monitoring (RMM)",
      description: "Complete endpoint management and monitoring solution",
      features: ["Device inventory", "Performance monitoring", "Remote control", "Patch management"],
      tier: "premium",
      demo: "/demos/rmm"
    },
    {
      icon: Users,
      title: "MSP Management",
      description: "Multi-tenant platform designed for service providers",
      features: ["Client portal", "Billing integration", "Technician management", "Service automation"],
      tier: "enterprise",
      demo: "/demos/msp"
    }
  ];

  const securityApps = [
    {
      icon: Lock,
      title: "SafePass",
      description: "Enterprise password manager with zero-knowledge encryption",
      features: ["Password generation", "Secure sharing", "Breach monitoring", "SSO integration"],
      tier: "free",
      demo: "/demos/safepass"
    },
    {
      icon: Search,
      title: "SafeScan",
      description: "Advanced threat detection and analysis engine",
      features: ["File scanning", "URL analysis", "Email security", "Real-time protection"],
      tier: "premium",
      demo: "/demos/safescan"
    },
    {
      icon: Wifi,
      title: "SafeNet",
      description: "Network security monitoring and protection",
      features: ["Traffic analysis", "Intrusion detection", "Firewall management", "VPN monitoring"],
      tier: "premium",
      demo: "/demos/safenet"
    },
    {
      icon: Eye,
      title: "SafeIntel",
      description: "Dark web monitoring and threat intelligence",
      features: ["Data breach alerts", "Credential monitoring", "Threat feeds", "Intelligence reports"],
      tier: "enterprise",
      demo: "/demos/safeintel"
    }
  ];

  const aiCapabilities = [
    {
      icon: Brain,
      title: "AI Intelligence Hub",
      description: "Central AI command center with advanced analytics",
      features: ["Predictive analytics", "Behavior analysis", "Pattern recognition", "Automated insights"],
      tier: "premium"
    },
    {
      icon: Mic,
      title: "AI Voice Interface",
      description: "Voice-controlled security operations",
      features: ["Voice commands", "Audio alerts", "Hands-free operation", "Natural language queries"],
      tier: "enterprise"
    },
    {
      icon: Eye,
      title: "AI Vision Analyzer",
      description: "Computer vision for security analysis",
      features: ["Image analysis", "Facial recognition", "Object detection", "Video monitoring"],
      tier: "enterprise"
    }
  ];

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary">Free</Badge>;
      case 'premium':
        return <Badge variant="default">Premium</Badge>;
      case 'enterprise':
        return <Badge variant="destructive">Enterprise</Badge>;
      default:
        return null;
    }
  };

  const canAccess = (tier: string) => {
    if (tier === 'free') return true;
    if (tier === 'premium') return subscription.subscribed && ['premium', 'enterprise'].includes(subscription.subscription_tier || '');
    if (tier === 'enterprise') return subscription.subscribed && subscription.subscription_tier === 'enterprise';
    return false;
  };

  const FeatureCard = ({ feature, showDemo = false }: { feature: any, showDemo?: boolean }) => (
    <Card className={`h-full ${canAccess(feature.tier) ? '' : 'opacity-75'}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              {getTierBadge(feature.tier)}
            </div>
          </div>
          {!canAccess(feature.tier) && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {feature.features.map((feat: string, index: number) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              {canAccess(feature.tier) ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={!canAccess(feature.tier) ? 'text-muted-foreground' : ''}>
                {feat}
              </span>
            </li>
          ))}
        </ul>
        {showDemo && feature.demo && (
          <Link to={feature.demo}>
            <Button 
              variant={canAccess(feature.tier) ? "default" : "outline"} 
              className="w-full"
              disabled={!canAccess(feature.tier)}
            >
              {canAccess(feature.tier) ? "Try Demo" : "Upgrade to Access"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Platform Features</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Explore the comprehensive cybersecurity and management capabilities of the UltriumAI platform.
          From AI-powered assistance to enterprise-grade security tools.
        </p>
        {!user && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <p className="text-primary">
              <Link to="/auth" className="underline font-medium">Sign up for free</Link> to access premium features and start your security journey.
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="core" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core">Core Platform</TabsTrigger>
          <TabsTrigger value="security">Security Apps</TabsTrigger>
          <TabsTrigger value="ai">AI Capabilities</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {coreFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} showDemo />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {securityApps.map((feature, index) => (
              <FeatureCard key={index} feature={feature} showDemo />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {aiCapabilities.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Coming Soon
              </CardTitle>
              <CardDescription>
                Exciting new features in development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Advanced Analytics</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive security metrics and reporting dashboard
                  </p>
                  <Badge variant="outline">Q2 2024</Badge>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Mobile App</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Native iOS and Android applications for on-the-go management
                  </p>
                  <Badge variant="outline">Q3 2024</Badge>
                </div>
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Global SOC</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    24/7 Security Operations Center with global threat intelligence
                  </p>
                  <Badge variant="outline">Q4 2024</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade CTA */}
      {user && subscription.subscription_tier === 'free' && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Unlock Premium Features
            </CardTitle>
            <CardDescription>
              Upgrade your plan to access advanced security tools and AI capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pricing" className="flex-1">
                <Button className="w-full">
                  View Pricing Plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/demos">
                <Button variant="outline" className="w-full sm:w-auto">
                  Try Demos First
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Features;