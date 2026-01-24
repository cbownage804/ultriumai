/**
 * SafePass Product Page
 * Individual landing page for the password manager module
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Lock, 
  Users, 
  Shield, 
  Fingerprint, 
  Globe, 
  History,
  Key,
  CheckCircle2
} from 'lucide-react';
import safepassLogo from '@/assets/safepass-logo.png';
import heroPassword from '@/assets/hero-password.jpg';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';

const features = [
  { icon: Lock, title: "Zero-Knowledge Encryption", description: "Your master password never leaves your device. We can't see your data, ever." },
  { icon: Users, title: "Secure Sharing", description: "Share credentials with team members safely using encrypted sharing links." },
  { icon: Shield, title: "Breach Monitoring", description: "Get instant alerts if your credentials appear in known data breaches." },
  { icon: Fingerprint, title: "Biometric Unlock", description: "Use fingerprint or face ID for quick, secure access on all devices." },
  { icon: Globe, title: "Browser Extension", description: "Auto-fill passwords across Chrome, Firefox, Safari, and Edge." },
  { icon: History, title: "Password History", description: "Track changes and recover previous passwords when needed." },
];

const highlights = [
  "Military-grade AES-256 encryption",
  "Unlimited password storage",
  "Cross-device sync",
  "Secure password generator",
  "Emergency access for trusted contacts",
  "Two-factor authentication support"
];

export default function SafePassProduct() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-amber-500/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center overflow-hidden border border-amber-500/20">
              <img src={safepassLogo} alt="SafePass" className="h-full w-full object-contain" />
            </div>
            <span className="font-semibold text-amber-400">SafePass</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to SafeSuite
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
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
          style={{ backgroundImage: `url(${heroPassword})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <Badge className="mb-6 bg-amber-500/10 text-amber-400 border-amber-500/30">
            Included with SafeSuite
          </Badge>
          <div className="flex justify-center mb-8">
            <div className="bg-black px-12 py-6 rounded-xl shadow-[0_0_60px_rgba(245,158,11,0.3)] border border-amber-500/20">
              <img 
                src={safepassLogo} 
                alt="SafePass" 
                className="h-24 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Secure Password Management
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Military-grade encryption for all your credentials with zero-knowledge architecture. 
            Your passwords, secured the way they should be.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black gap-2">
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
              Everything You Need for Password Security
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              SafePass combines enterprise-grade security with consumer-friendly simplicity.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#141414] border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-amber-400" />
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
              Why Choose SafePass?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-[#141414] border border-amber-500/10">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
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
            SafePass is Included with SafeSuite
          </h2>
          <p className="text-gray-400 mb-8">
            Get SafePass plus SafeScan, SafeWeb, and SafeTrack — all in one unified security suite.
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
          © {new Date().getFullYear()} UltriumAI. SafePass is part of the SafeSuite security bundle.
        </div>
      </footer>
    </div>
  );
}
