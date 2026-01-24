/**
 * SafeWeb Product Page
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

export default function SafeWebProduct() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-violet-500/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center overflow-hidden border border-violet-500/20">
              <img src={safewebLogo} alt="SafeWeb" className="h-full w-full object-contain" />
            </div>
            <span className="font-semibold text-violet-400">SafeWeb</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to SafeSuite
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
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroWeb})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <Badge className="mb-6 bg-violet-500/10 text-violet-400 border-violet-500/30">
            Included with SafeSuite
          </Badge>
          <div className="inline-block bg-black px-12 py-6 rounded-xl mb-8 shadow-[0_0_60px_rgba(139,92,246,0.3)] border border-violet-500/20">
            <img 
              src={safewebLogo} 
              alt="SafeWeb" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Dark Web Intelligence
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Continuous monitoring of the dark web for your exposed credentials and data leaks.
            Know when you've been breached before criminals exploit your data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-violet-500 hover:bg-violet-600 text-white gap-2">
                Start Free with SafeSuite
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
              SafeWeb monitors the places criminals operate so you don't have to.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#141414] border-violet-500/10 hover:border-violet-500/30 transition-all">
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
      <section className="py-20 px-4 bg-[#0d0d0d]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose SafeWeb?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-[#141414] border border-violet-500/10">
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
            <img src={safesuiteLogo} alt="SafeSuite" className="h-16 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            SafeWeb is Included with SafeSuite
          </h2>
          <p className="text-gray-400 mb-8">
            Get SafeWeb plus SafePass, SafeScan, and SafeTrack — all in one unified security suite.
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2">
              Get Started with SafeSuite
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} UltriumAI. SafeWeb is part of the SafeSuite security bundle.
        </div>
      </footer>
    </div>
  );
}
