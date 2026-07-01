/**
 * Vault Product Page
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

export default function VaultProduct() {
  return (
    <div className="min-h-screen bg-background safe-area-inset-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-amber-500/10 safe-area-inset-top">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/app" className="flex items-center">
            <div className="h-10 sm:h-14 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-amber-500/20 px-3 sm:px-4 shadow-lg shadow-amber-500/10">
              <img src={safepassLogo} alt="Vault" className="h-7 sm:h-10 w-auto object-contain" />
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/app">
              <Button variant="ghost" className="text-gray-400 hover:text-white text-sm sm:text-base px-2 sm:px-4">
                <span className="hidden sm:inline">← Back to Wrayth</span>
                <span className="sm:hidden">← Back</span>
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black touch-target text-sm sm:text-base">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroPassword})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        
        <div className="relative z-10 text-center px-4 py-12 sm:py-20">
          <Badge className="mb-4 sm:mb-6 bg-amber-500/10 text-amber-400 border-amber-500/30">
            Included with Wrayth
          </Badge>
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-black px-8 sm:px-12 py-4 sm:py-6 rounded-xl shadow-[0_0_60px_rgba(245,158,11,0.3)] border border-amber-500/20">
              <img 
                src={safepassLogo} 
                alt="Vault" 
                className="h-16 sm:h-24 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4">
            Secure Password Management
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            Military-grade encryption for all your credentials with zero-knowledge architecture. 
            Your passwords, secured the way they should be.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-black gap-2 touch-target">
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
              Everything You Need for Password Security
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Vault combines enterprise-grade security with consumer-friendly simplicity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-amber-500/10 hover:border-amber-500/30 transition-all">
                <CardContent className="p-4 sm:p-6">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-12 sm:py-20 px-4 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Why Choose Vault?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-card border border-amber-500/10">
                <CheckCircle2 className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-block bg-black px-6 sm:px-8 py-3 sm:py-4 rounded-lg mb-4 sm:mb-6 border border-emerald-500/20">
            <img src={safesuiteLogo} alt="Wrayth" className="h-12 sm:h-16 w-auto" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Vault is Included with Wrayth
          </h2>
          <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base px-4">
            Get Vault plus Scan, and Watch — all in one unified security suite.
          </p>
          <Link to="/auth?tab=signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black gap-2 touch-target">
              Get Started with Wrayth
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 border-t border-gray-800 safe-area-inset-bottom">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} UltriumAI. Vault is part of the Wrayth security bundle.
        </div>
      </footer>
    </div>
  );
}
