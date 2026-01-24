/**
 * SafeScan Product Page
 * Individual landing page for the threat scanner module
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Mail, 
  FileText, 
  LinkIcon, 
  Brain, 
  Eye, 
  AlertTriangle,
  Shield,
  CheckCircle2
} from 'lucide-react';
import safescanLogo from '@/assets/safescan-logo.png';
import heroScan from '@/assets/hero-scan.jpg';
import { safesuiteLogo } from '@/components/safesuite/SafeSuiteProductIcons';

const features = [
  { icon: Mail, title: "Email Scanner", description: "Detect phishing attempts, spoofed senders, and malicious attachments before they reach your inbox." },
  { icon: FileText, title: "Document Scanner", description: "Analyze PDFs, Office files, and other documents for hidden macros and embedded threats." },
  { icon: LinkIcon, title: "URL Analyzer", description: "Check any link for malware, reputation issues, and redirect chains." },
  { icon: Brain, title: "AI Detection", description: "Machine learning models trained on millions of threat samples for accurate detection." },
  { icon: Eye, title: "Behavioral Analysis", description: "Identify sophisticated social engineering and zero-day attacks." },
  { icon: AlertTriangle, title: "Real-Time Alerts", description: "Instant notifications when threats are detected." },
];

const highlights = [
  "Real-time phishing detection",
  "Malware analysis engine",
  "Threat intelligence feeds",
  "Sandbox detonation",
  "API integration available",
  "Detailed threat reports"
];

export default function SafeScanProduct() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-red-500/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center overflow-hidden border border-red-500/20">
              <img src={safescanLogo} alt="SafeScan" className="h-full w-full object-contain" />
            </div>
            <span className="font-semibold text-red-400">SafeScan</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                ← Back to SafeSuite
              </Button>
            </Link>
            <Link to="/auth?tab=signup">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
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
          style={{ backgroundImage: `url(${heroScan})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <Badge className="mb-6 bg-red-500/10 text-red-400 border-red-500/30">
            Included with SafeSuite
          </Badge>
          <div className="inline-block bg-black px-12 py-6 rounded-xl mb-8 shadow-[0_0_60px_rgba(239,68,68,0.3)] border border-red-500/20">
            <img 
              src={safescanLogo} 
              alt="SafeScan" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI-Powered Threat Scanner
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Unified scanning for emails, documents, and URLs with real-time AI threat detection.
            Stop phishing, malware, and social engineering attacks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?tab=signup">
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white gap-2">
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
              Complete Threat Detection Suite
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              SafeScan uses advanced AI to protect you from the latest cyber threats.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#141414] border-red-500/10 hover:border-red-500/30 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-red-400" />
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
              Why Choose SafeScan?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((highlight, index) => (
              <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-[#141414] border border-red-500/10">
                <CheckCircle2 className="h-5 w-5 text-red-400 flex-shrink-0" />
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
            SafeScan is Included with SafeSuite
          </h2>
          <p className="text-gray-400 mb-8">
            Get SafeScan plus SafePass, SafeWeb, and SafeTrack — all in one unified security suite.
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
          © {new Date().getFullYear()} UltriumAI. SafeScan is part of the SafeSuite security bundle.
        </div>
      </footer>
    </div>
  );
}
