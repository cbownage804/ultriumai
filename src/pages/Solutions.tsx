import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  Shield, 
  Lock, 
  Search, 
  Globe, 
  FileText, 
  Users, 
  Zap,
  ArrowRight,
  Play,
  Network,
  CheckCircle,
  Star,
  Building,
  Settings,
  Bell,
  BarChart3,
  Brain,
  TrendingUp,
  Headphones
} from "lucide-react";

const Solutions = () => {
  const securityApps = [
    {
      id: "safescan",
      name: "Ultrium SafeScan™",
      category: "Unified Threat Detection",
      description: "Complete AI-powered scanning suite for emails, documents, and URLs",
      longDescription: "Comprehensive security scanning platform that combines email analysis, document scanning, and URL verification into one unified solution with AI-powered threat detection.",
      icon: Shield,
      features: [
        "Email phishing detection",
        "Document malware scanning", 
        "URL reputation analysis",
        "Social engineering detection",
        "Real-time threat intelligence",
        "API integration ready",
        "Bulk scanning capabilities",
        "Scheduled scanning"
      ],
      demoUrl: "/demos/safescan",
      pageUrl: "/products/safescan",
      gradient: "from-blue-100 to-indigo-100"
    },
    {
      id: "safeshield",
      name: "Ultrium SafeShield™",
      category: "Endpoint Security",
      description: "Unified endpoint protection with EDR, MDR, and AI-powered antivirus",
      longDescription: "Complete endpoint security platform combining AI-powered antivirus (SafeAV), endpoint detection and response (SafeEDR), and managed detection services.",
      icon: Shield,
      features: [
        "AI-powered SafeAV protection",
        "Endpoint Detection & Response (EDR)",
        "Managed Detection & Response (MDR)",
        "Real-time threat monitoring",
        "Automated incident response",
        "Behavioral analysis",
        "Zero-day protection",
        "Centralized management"
      ],
      demoUrl: "/demos/safeshield",
      pageUrl: "/products/safeshield", 
      gradient: "from-red-100 to-pink-100"
    },
    {
      id: "safecenter",
      name: "Ultrium SafeCenter™",
      category: "IT Service Management",
      description: "Complete IT service management platform with RMM and helpdesk",
      longDescription: "Integrated IT service management solution combining remote monitoring and management (RMM), helpdesk ticketing, asset management, and automation tools.",
      icon: Settings,
      features: [
        "Remote monitoring & management",
        "Integrated helpdesk ticketing",
        "Asset management & tracking",
        "Automated patch management",
        "Performance monitoring",
        "Service desk automation",
        "Multi-tenant MSP support",
        "Mobile technician apps"
      ],
      demoUrl: "/demos/safecenter",
      pageUrl: "/msps",
      gradient: "from-green-100 to-emerald-100"
    },
    {
      id: "safekb",
      name: "Ultrium SafeKB™", 
      category: "Knowledge Management",
      description: "AI-powered knowledge base and documentation platform",
      longDescription: "Intelligent knowledge management system that organizes documentation, provides AI-powered search, and integrates with your existing workflows.",
      icon: FileText,
      features: [
        "AI-powered knowledge search",
        "Smart document organization",
        "Workflow integration",
        "Team collaboration tools",
        "Version control",
        "Access management",
        "Custom GPT integration",
        "Multi-format support"
      ],
      demoUrl: "/demos/safekb",
      pageUrl: "/products/safekb",
      gradient: "from-purple-100 to-violet-100"
    },
    {
      id: "safepass",
      name: "Ultrium SafePass™",
      category: "Password Security",
      description: "Enterprise password management and security platform",
      longDescription: "Comprehensive password management solution with enterprise-grade security, automated password generation, and breach monitoring.",
      icon: Lock,
      features: [
        "Secure password generation",
        "Breach monitoring",
        "Team password sharing",
        "Multi-factor authentication",
        "Password health scoring",
        "Compliance reporting",
        "SSO integration",
        "Automated password rotation"
      ],
      demoUrl: "/demos/safepass",
      pageUrl: "/products/safepass",
      gradient: "from-orange-100 to-red-100"
    },
    {
      id: "safenet",
      name: "Ultrium SafeNet™",
      category: "Network Security",
      description: "Advanced network discovery and security monitoring platform",
      longDescription: "Comprehensive network security tool that discovers devices, maps network topology, monitors performance, and identifies vulnerabilities with real-time threat detection.",
      icon: Network,
      features: [
        "Network topology mapping",
        "Device discovery & profiling",
        "Vulnerability assessment",
        "Performance monitoring",
        "Real-time security scanning",
        "Meraki integration",
        "SNMP monitoring",
        "Automated alerts"
      ],
      demoUrl: "/demos/safenet",
      pageUrl: "/products/safenet",
      gradient: "from-teal-100 to-cyan-100"
    },
    {
      id: "safescore",
      name: "Ultrium SafeScore™",
      category: "Compliance Management",
      description: "Comprehensive compliance management and audit platform",
      longDescription: "Enterprise compliance management solution that automates compliance monitoring, conducts security audits, and tracks regulatory requirements across multiple frameworks.",
      icon: BarChart3,
      features: [
        "Multi-framework compliance",
        "Automated audit processes",
        "Risk assessment tools",
        "Evidence collection",
        "Compliance reporting",
        "Remediation tracking",
        "Policy management",
        "Continuous monitoring"
      ],
      demoUrl: "/demos/safescore",
      pageUrl: "/products/safescore",
      gradient: "from-pink-100 to-rose-100"
    },
    {
      id: "safeintel",
      name: "Ultrium SafeIntel™",
      category: "Threat Intelligence",
      description: "Dark web monitoring and threat intelligence platform",
      longDescription: "Advanced threat intelligence platform that monitors dark web activities, tracks compromised credentials, and provides early warning of emerging cyber threats.",
      icon: Search,
      features: [
        "Dark web monitoring",
        "Credential breach detection",
        "Threat actor tracking",
        "Brand protection",
        "Executive monitoring",
        "Intelligence feeds",
        "Automated alerts",
        "Threat hunting tools"
      ],
      demoUrl: "/demos/safeintel",
      pageUrl: "/products/safeintel",
      gradient: "from-indigo-100 to-blue-100"
    },
    {
      id: "soc-dashboard",
      name: "SafeSOC",
      category: "Security Operations",
      description: "Complete SOC dashboard with real-time threat intelligence",
      longDescription: "Centralized SafeSOC providing real-time monitoring, threat intelligence, compliance tracking, and incident response coordination.",
      icon: BarChart3,
      features: [
        "Real-time security monitoring",
        "Threat intelligence feeds",
        "Incident response coordination",
        "Compliance tracking",
        "Security analytics",
        "Custom alerting",
        "Multi-client management",
        "Executive reporting"
      ],
      demoUrl: "/demos/safesoc",
      pageUrl: "/security-dashboard",
      gradient: "from-gray-100 to-slate-100"
    },
    {
      id: "ultrium-gpt",
      name: "Ultrium GPT™",
      category: "AI Security Assistant",
      description: "Advanced AI assistant for cybersecurity operations and threat analysis",
      longDescription: "Intelligent AI assistant specialized in cybersecurity operations, threat analysis, incident response, and security automation with natural language processing.",
      icon: Zap,
      features: [
        "Natural language security queries",
        "Automated threat analysis",
        "Incident response assistance",
        "Security policy generation",
        "Vulnerability assessment",
        "Compliance guidance",
        "Real-time security insights",
        "Integration with security tools"
      ],
      demoUrl: "/demos/ultriumgpt",
      pageUrl: "/ultrium-gpt",
      gradient: "from-violet-100 to-purple-100"
    },
    {
      id: "ai-studio",
      name: "Ultrium AI Studio™",
      category: "Business Intelligence",
      description: "Advanced AI platform for security operations analysis and automation",
      longDescription: "Comprehensive AI-powered business intelligence platform that enhances security operations with advanced analytics, automated reporting, policy generation, and workflow optimization.",
      icon: Brain,
      features: [
        "Security data analysis & insights",
        "Automated policy generation",
        "Threat research & intelligence",
        "Compliance report automation",
        "Workflow optimization",
        "Training content creation",
        "Risk assessment modeling",
        "Executive dashboard analytics"
      ],
      demoUrl: "/demos/ai-studio",
      pageUrl: "/ai-studio",
      gradient: "from-emerald-100 to-teal-100"
    }
  ];

  const industries = [
    {
      name: "Managed Service Providers (MSPs)",
      icon: Settings,
      description: "Comprehensive security toolkit for MSPs managing multiple client environments",
      benefits: [
        "Multi-tenant client management",
        "Centralized security monitoring",
        "Automated compliance reporting",
        "White-label deployment options"
      ]
    },
    {
      name: "Small & Medium Businesses",
      icon: Building,
      description: "Enterprise-grade security solutions designed for SMB budgets and complexity",
      benefits: [
        "Easy deployment and management",
        "Cost-effective security coverage",
        "Minimal IT overhead required",
        "Scalable as business grows"
      ]
    },
    {
      name: "Enterprise Organizations",
      icon: Globe,
      description: "Advanced security solutions for complex organizational structures",
      benefits: [
        "Enterprise-grade integrations",
        "Advanced analytics and reporting",
        "Custom deployment options",
        "Dedicated support and training"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Custom GPT Builder Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 mb-12">
            <Badge variant="secondary" className="animate-pulse">
              <Zap className="h-4 w-4 mr-2" />
              Revolutionary AI Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              Custom GPT Builder™
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Build your own AI workforce in minutes, not months. Deploy intelligent assistants that know your business inside and out, reduce operational costs by 60%, and scale your expertise instantly.
            </p>
          </div>

          {/* Custom GPT Builder Feature Card */}
          <Card className="max-w-6xl mx-auto bg-gradient-to-br from-white/80 to-primary/5 border-2 border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Revolutionary No-Code AI</h3>
                      <p className="text-muted-foreground">Build enterprise AI without a single line of code</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-foreground">
                        <strong>Drag & drop AI builder</strong> - Create assistants in under 5 minutes
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-foreground">
                        <strong>Upload unlimited knowledge</strong> - PDFs, docs, websites, databases
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-foreground">
                        <strong>White-label deployment</strong> - Your brand, your domain, your customers
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-foreground">
                        <strong>Advanced integrations</strong> - API, webhooks, CRM, helpdesk systems
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-foreground">
                        <strong>Enterprise security</strong> - SOC 2, GDPR compliant, encrypted data
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">ROI Impact</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Support cost reduction:</span>
                        <span className="font-bold text-green-800">-60%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Response time improvement:</span>
                        <span className="font-bold text-green-800">-85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700">Customer satisfaction:</span>
                        <span className="font-bold text-green-800">+40%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/60 rounded-lg border">
                      <div className="text-2xl font-bold text-primary">5 min</div>
                      <div className="text-sm text-muted-foreground">Setup Time</div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">24/7</div>
                      <div className="text-sm text-muted-foreground">Always Online</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-primary">500+ Companies Trust Us</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From startups to Fortune 500s - powering AI transformation worldwide
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-6 border-t border-primary/20">
                <Button size="lg" className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => window.location.href = '/demos/custom-gpt-builder'}>
                  <Play className="mr-2 h-5 w-5" />
                  Try Live Demo
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-2 border-primary hover:bg-primary/5" onClick={() => window.location.href = '/pricing#gpt-pricing'}>
                  <Star className="mr-2 h-5 w-5" />
                  View Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Custom GPT Use Cases & Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Transform Every Department with AI</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Create specialized AI assistants for any business function. No technical skills required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Customer Support */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Headphones className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Customer Support GPT</CardTitle>
                <CardDescription>Handle 80% of support tickets automatically</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Instant responses 24/7
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Escalate complex issues to humans
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Multi-language support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Learn from your FAQ & docs
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Sales Assistant */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Sales Assistant GPT</CardTitle>
                <CardDescription>Qualify leads and accelerate your sales cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Lead qualification & scoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Product recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Pricing information & quotes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    CRM integration
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* HR Assistant */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">HR Assistant GPT</CardTitle>
                <CardDescription>Streamline employee onboarding & support</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Policy & procedure guidance
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Benefits enrollment help
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Employee self-service
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Training & compliance
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Success Story */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Customer Success Story
                </Badge>
                <blockquote className="text-xl font-medium text-foreground">
                  "We reduced our support ticket volume by 75% and improved customer satisfaction scores by 40% within the first month. Our GPT handles everything from password resets to complex product questions."
                </blockquote>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">VP of Customer Success, TechCorp</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">75%</div>
                    <div className="text-sm text-muted-foreground">Fewer Support Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">40%</div>
                    <div className="text-sm text-muted-foreground">Higher CSAT Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">$50K</div>
                    <div className="text-sm text-muted-foreground">Annual Savings</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Applications Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="mb-4">
                <Shield className="h-4 w-4 mr-2" />
                AI Security Solutions
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
                Complete AI Security Suite
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                From email protection to dark web monitoring—our comprehensive AI security applications 
                protect your business from today's cyber threats while streamlining your security operations.
              </p>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold text-primary">10 Integrated Security Applications</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-lg font-medium text-foreground">
                Deploy individually or as a complete security ecosystem. Each app works independently while integrating seamlessly with the others.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '/demos'}>
                <Play className="mr-2 h-5 w-5" />
                Try Security Demos
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '/contact'}>
                <Shield className="mr-2 h-5 w-5" />
                Schedule Security Assessment
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Applications Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              AI-Powered Security Applications
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each application is designed to address specific security challenges while providing 
              intelligent automation and real-time threat detection capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {securityApps.map((app) => {
              const Icon = app.icon;
              return (
                <Card key={app.id} className={`hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${app.gradient} border-2 hover:border-primary/20 hover:scale-105`}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-lg bg-white/80 shadow-sm">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-black">{app.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-black border-black/20">
                          {app.category}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-black/80 font-medium">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-black/70 leading-relaxed">
                      {app.longDescription}
                    </p>
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-black">Key Features:</h4>
                      <ul className="space-y-1">
                        {app.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-black/70">{feature}</span>
                          </li>
                        ))}
                        {app.features.length > 3 && (
                          <li className="text-xs text-black/60 font-medium">
                            +{app.features.length - 3} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" onClick={() => window.location.href = app.demoUrl}>
                        <Play className="mr-1 h-3 w-3" />
                        Demo
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = app.pageUrl}>
                        Learn More
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Built for Your Industry
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our security solutions are designed to meet the specific needs and compliance requirements 
              of different business types and industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {industries.map((industry, index) => {
              const Icon = industry.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{industry.name}</CardTitle>
                    <CardDescription className="text-base">
                      {industry.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-2">
                      {industry.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Seamless Integration & Deployment
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Deploy as standalone applications or integrate with your existing security stack. 
              Our solutions work with your current tools and processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "API-First Design",
                description: "RESTful APIs for seamless integration with existing systems",
                icon: Zap
              },
              {
                title: "SSO Integration",
                description: "Single sign-on support for streamlined user management",
                icon: Lock
              },
              {
                title: "Real-Time Alerts",
                description: "Instant notifications via email, SMS, or webhook",
                icon: Bell
              },
              {
                title: "Custom Dashboards",
                description: "Tailored reporting and analytics for your specific needs",
                icon: BarChart3
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">Ready to Secure Your Business?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Start with individual applications or deploy our complete security suite. 
                Let's discuss which solutions are right for your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 h-auto btn-glow" onClick={() => window.location.href = '/contact'}>
                  <Shield className="mr-2 h-5 w-5" />
                  Get Security Assessment
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" onClick={() => window.location.href = '/demos'}>
                  <Play className="mr-2 h-5 w-5" />
                  Try All Demos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Solutions;