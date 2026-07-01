/**
 * Watch Product Page
 * Individual landing page for the dark web monitoring module
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  Shield, 
  Users, 
  BarChart3, 
  Clock,
  Globe,
  CheckCircle2
} from 'lucide-react';
import safewebLogo from '@/assets/safeweb-logo.png';
import heroWeb from '@/assets/hero-web.jpg';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';

const features = [
  { icon: Search, title: "Dark Web Monitoring", description: "24/7 scanning of hacker forums, marketplaces, and paste sites for your exposed data." },
  { icon: AlertTriangle, title: "Breach Alerts", description: "Instant notification when your email, passwords, or personal data appears online." },
  { icon: Shield, title: "Domain Protection", description: "Monitor your business domain and employee emails for corporate leaks." },
  { icon: Users, title: "Employee Monitoring", description: "Track credential exposure across your entire organization." },
  { icon: BarChart3, title: "Risk Reports", description: "Detailed analytics showing your exposure level and remediation progress." },
  { icon: Clock, title: "Historical Data", description: "Track breaches over time with trend analysis and improvement metrics." },
];

const highlights = [
  "24/7 dark web surveillance",
  "Instant breach notifications",
  "Personal & business monitoring",
  "Remediation guidance",
  "Exposure risk scoring",
  "Historical breach tracking"
];

export default function WatchProduct() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-violet-500/10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/app" className="flex items-center">
            <div className="h-14 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-violet-500/20 px-4 shadow-lg shadow-violet-500/10">
              <img src={safewebLogo} alt="Watch" className="h-10 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/app">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to Wrayth
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-violet-500 hover:bg-violet-600 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroWeb})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background" />
        
        <div className="relative z-10 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-lg p-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_0_60px_rgba(139,92,246,0.3)]">
            {/* Product Logo - Large and prominent */}
            <div className="mb-8">
              <img 
                src={safewebLogo} 
                alt="Watch"
                className="h-24 md:h-28 w-auto mx-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Tier badge */}
            <div className="mb-6">
              <Badge 
                variant="outline" 
                className="text-sm px-4 py-1.5 font-medium border-violet-500/50 text-violet-400 bg-violet-500/10"
              >
                Included with Wrayth
              </Badge>
            </div>

            {/* CTA Button */}
            <div>
              <Link to="/auth?tab=signup">
                <Button 
                  size="lg"
                  className="gap-2 w-full text-lg py-6 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 font-semibold"
                >
                  Start Free with Wrayth
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              {/* Compare plans link */}
              <Link 
                to="/app" 
                className="inline-block mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Learn more about Wrayth
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Comprehensive Dark Web Protection
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Watch monitors the places criminals operate so you don't have to.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-violet-500/10 hover:border-violet-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose Watch?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-violet-500/10">
                <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                <span className="text-gray-300">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block bg-black px-8 py-4 rounded-lg mb-6 border border-emerald-500/20">
            <img src={safesuiteLogo} alt="Wrayth" className="h-16 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Watch is Included with Wrayth
          </h2>
          <p className="text-gray-400 mb-8">
            Get Watch plus Vault, and Scan — all in one unified security suite.
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2">
              Get Started with Wrayth
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} UltriumAI. Watch is part of the Wrayth security bundle.
        </div>
      </footer>
    </div>
  );
}
