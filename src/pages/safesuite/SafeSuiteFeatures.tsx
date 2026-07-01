/**
 * Wrayth Features - Unified page showcasing all Wrayth tools
 * Consolidates Vault, Scan, Watch, SafeTrack into one clean experience
 */

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield, Key, Mail, FileText, Link as LinkIcon, Globe, 
  Package, QrCode, Calendar, DollarSign, ArrowRight, Check,
  Brain, Eye, Fingerprint, AlertTriangle, Laptop, History,
  Lock, Scan, Users, Search, Clock, BarChart3
} from "lucide-react";
import heroSafesuite from "@/assets/hero-safesuite.jpg";
import safesuiteLogo from "@/assets/safesuite-logo.png";
import safepassLogo from "@/assets/safepass-logo.png";
import safescanLogo from "@/assets/safescan-logo.png";
import safewebLogo from "@/assets/safeweb-logo.png";
import safetrackLogo from "@/assets/safetrack-logo.png";

const tools = [
  {
    id: "safepass",
    name: "Vault",
    tagline: "Enterprise Password Management",
    description: "Military-grade encryption for all your credentials with zero-knowledge architecture.",
    icon: Key,
    logo: safepassLogo,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    shadowColor: "shadow-amber-500/20",
    features: [
      { icon: Lock, title: "Zero-Knowledge Encryption", description: "Your master password never leaves your device" },
      { icon: Users, title: "Secure Sharing", description: "Share credentials with team members safely" },
      { icon: Shield, title: "Breach Monitoring", description: "Get alerts if your credentials are exposed" },
      { icon: Fingerprint, title: "Biometric Unlock", description: "Use fingerprint or face ID on mobile" },
      { icon: Globe, title: "Browser Extension", description: "Auto-fill passwords across all browsers" },
      { icon: History, title: "Password History", description: "Track changes and recover old passwords" },
    ],
  },
  {
    id: "safescan",
    name: "Scan",
    tagline: "AI-Powered Threat Scanner",
    description: "Unified scanning for emails, documents, and URLs with real-time AI threat detection.",
    icon: Scan,
    logo: safescanLogo,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    shadowColor: "shadow-red-500/20",
    features: [
      { icon: Mail, title: "Email Scanner", description: "Detect phishing, spoofing, and malicious attachments" },
      { icon: FileText, title: "Document Scanner", description: "Analyze PDFs and Office files for hidden threats" },
      { icon: LinkIcon, title: "URL Analyzer", description: "Check links for malware and reputation issues" },
      { icon: Brain, title: "AI Detection", description: "Machine learning models trained on millions of threats" },
      { icon: Eye, title: "Behavioral Analysis", description: "Identify sophisticated social engineering attacks" },
      { icon: AlertTriangle, title: "Real-Time Alerts", description: "Instant notifications for detected threats" },
    ],
  },
  {
    id: "safeweb",
    name: "Watch",
    tagline: "Dark Web Intelligence",
    description: "Continuous monitoring of the dark web for your exposed credentials and data leaks.",
    icon: Globe,
    logo: safewebLogo,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    shadowColor: "shadow-purple-500/20",
    features: [
      { icon: Search, title: "Dark Web Monitoring", description: "24/7 scanning of hacker forums and marketplaces" },
      { icon: AlertTriangle, title: "Breach Alerts", description: "Instant notification when your data appears" },
      { icon: Shield, title: "Domain Protection", description: "Monitor your business domain for leaks" },
      { icon: Users, title: "Employee Monitoring", description: "Track exposure across your organization" },
      { icon: BarChart3, title: "Risk Reports", description: "Detailed analytics on your exposure level" },
      { icon: Clock, title: "Historical Data", description: "Track breaches over time with trend analysis" },
    ],
  },
];


export default function WraythFeatures() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroSafesuite})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <div className="inline-block bg-black px-12 py-6 rounded-lg mb-8 shadow-[0_0_60px_rgba(16,185,129,0.3)]">
            <img 
              src={safesuiteLogo} 
              alt="Wrayth" 
              className="h-28 w-auto"
            />
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Complete security suite with password management, threat scanning, dark web monitoring, and asset tracking
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/app/auth">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/app">
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Tabs Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="safepass" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-4 bg-transparent p-0 mb-12">
              {tools.map((tool) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${tool.borderColor} data-[state=active]:border-2 data-[state=active]:${tool.borderColor} data-[state=active]:bg-black hover:bg-black/50 transition-all`}
                >
                  <div className={`bg-black rounded-lg px-6 py-4 ${tool.shadowColor} shadow-lg flex items-center justify-center min-w-[160px] min-h-[80px]`}>
                    <img src={tool.logo} alt={tool.name} className="h-14 w-auto object-contain" />
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {tools.map((tool) => (
              <TabsContent key={tool.id} value={tool.id} className="mt-0">
                <div className="text-center mb-12">
                  <Badge className={`${tool.bgColor} ${tool.color} border-0 mb-4`}>
                    {tool.tagline}
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4">{tool.name}</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    {tool.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tool.features.map((feature, idx) => (
                    <Card key={idx} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-4`}>
                          <feature.icon className={`h-6 w-6 ${tool.color}`} />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Get All Tools in One Suite</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Wrayth includes Vault, Scan, Watch, and SafeTrack — all integrated and working together to protect your digital life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { tier: "Free", price: "$0", features: ["25 passwords", "5 scans/month", "Basic monitoring"] },
              { tier: "Pro", price: "$9.99", features: ["Unlimited passwords", "100 scans/month", "5 monitored assets"], popular: true },
              { tier: "Business", price: "$15", features: ["Per-seat pricing", "Unlimited everything", "Team features"], perUser: true },
            ].map((plan) => (
              <Card key={plan.tier} className={`relative ${plan.popular ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.tier}</CardTitle>
                  <div className="text-3xl font-bold">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.perUser ? "/user/mo" : "/mo"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/app/auth">
                    <Button className={`w-full ${plan.popular ? "bg-emerald-500 hover:bg-emerald-600" : ""}`} variant={plan.popular ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Enterprise or MSP? <Link to="/vanguard" className="text-primary hover:underline">Check out Vanguard Suite</Link> for multi-tenant management.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
