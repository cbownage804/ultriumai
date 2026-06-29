/**
 * SafeTrack Product Page
 * Individual landing page for the asset tracking module
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Laptop, 
  QrCode, 
  DollarSign, 
  Calendar, 
  History, 
  BarChart3,
  Package,
  CheckCircle2,
  Sparkles,
  Shield
} from 'lucide-react';
import safetrackLogo from '@/assets/safetrack-logo.png';
import heroTrack from '@/assets/hero-track.jpg';
import { safesuiteLogo } from '@/components/safesuite/WraythProductIcons';

const features = [
  { icon: Sparkles, title: "AI Warranty Lookup", description: "Instantly retrieve warranty status by serial number using AI-powered web scraping.", featured: true },
  { icon: Laptop, title: "Hardware Inventory", description: "Track all physical IT assets including computers, monitors, and peripherals." },
  { icon: QrCode, title: "QR Code Scanning", description: "Instant asset lookup with mobile QR code scanning for quick audits." },
  { icon: DollarSign, title: "Depreciation Tracking", description: "Automatic depreciation calculations for accounting and tax purposes." },
  { icon: Calendar, title: "Maintenance Schedules", description: "Set up preventive maintenance reminders and warranty expiration alerts." },
  { icon: History, title: "Audit Trail", description: "Complete history of every asset change, transfer, and update." },
  { icon: BarChart3, title: "Compliance Reports", description: "Generate detailed reports for ITAM audits and compliance requirements." },
];

const highlights = [
  "AI-powered warranty lookup by serial number",
  "Complete asset lifecycle management",
  "Automated depreciation calculations",
  "QR/barcode scanning support",
  "Warranty expiration alerts & history",
  "License management",
  "Custom reporting"
];

export default function SafeTrackProduct() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-emerald-500/10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/safesuite" className="flex items-center">
            <div className="h-14 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-emerald-500/20 px-4 shadow-lg shadow-emerald-500/10">
              <img src={safetrackLogo} alt="SafeTrack" className="h-10 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/safesuite">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to Wrayth
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-black">
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
          style={{ backgroundImage: `url(${heroTrack})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            Included with Wrayth
          </Badge>
          <div className="flex justify-center mb-8">
            <div className="bg-black px-12 py-6 rounded-xl shadow-[0_0_60px_rgba(16,185,129,0.3)] border border-emerald-500/20">
              <img 
                src={safetrackLogo} 
                alt="SafeTrack" 
                className="h-24 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Asset Lifecycle Management
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Complete IT asset tracking with depreciation, maintenance, and compliance reporting.
            Know exactly what you have, where it is, and what it's worth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2">
                Start Free with Wrayth
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
              Complete Asset Management Solution
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              SafeTrack helps you manage every asset from procurement to retirement.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`bg-[#141414] border-emerald-500/10 hover:border-emerald-500/30 transition-all ${
                  feature.featured ? 'ring-2 ring-emerald-500/30 relative overflow-hidden' : ''
                }`}
              >
                {feature.featured && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-emerald-500 text-black text-xs">
                      NEW
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${
                    feature.featured ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20' : 'bg-emerald-500/10'
                  }`}>
                    <feature.icon className={`h-6 w-6 ${feature.featured ? 'text-emerald-300' : 'text-emerald-400'}`} />
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
              Why Choose SafeTrack?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-[#141414] border border-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
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
            SafeTrack is Included with Wrayth
          </h2>
          <p className="text-gray-400 mb-8">
            Get SafeTrack plus SafePass, SafeScan, and SafeWeb — all in one unified security suite.
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
          © {new Date().getFullYear()} UltriumAI. SafeTrack is part of the Wrayth security bundle.
        </div>
      </footer>
    </div>
  );
}
