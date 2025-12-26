import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Eye, 
  Shield,
  Monitor, 
  Cpu,
  ArrowRight,
  Lock,
  BarChart3,
  Zap,
  Network,
  Crosshair,
  Activity,
  Wifi,
  Bot,
  Layers,
  Globe,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import vanguardLogo from '@/assets/vanguard-logo.png';

export default function VanguardLanding() {
  const navigate = useNavigate();

  const coreFeatures = [
    {
      icon: Target,
      title: 'AI-Powered Threat Detection',
      description: 'Advanced behavioral analysis detects threats before they cause damage'
    },
    {
      icon: Eye,
      title: 'Real-Time Monitoring',
      description: '24/7 SOC operations with autonomous response capabilities'
    },
    {
      icon: Shield,
      title: 'Penetration Testing',
      description: 'Automated vulnerability scanning and security assessments'
    },
    {
      icon: Monitor,
      title: 'Endpoint Protection',
      description: 'Comprehensive device management and security enforcement'
    },
    {
      icon: Cpu,
      title: 'Edge AI Processing',
      description: 'On-device threat analysis with Hailo AI acceleration'
    },
    {
      icon: BarChart3,
      title: 'Compliance Reporting',
      description: 'Automated compliance monitoring and audit-ready reports'
    }
  ];

  const v4Features = [
    {
      icon: Crosshair,
      title: 'Deception & Honeypots',
      description: 'Deploy decoy services to detect and analyze attacker behavior in real-time'
    },
    {
      icon: Activity,
      title: 'Continuous Monitoring',
      description: 'File integrity, process monitoring, and configuration drift detection'
    },
    {
      icon: Wifi,
      title: 'Traffic Analysis',
      description: 'Deep packet inspection, anomaly detection, and DNS tunneling prevention'
    },
    {
      icon: Layers,
      title: 'Agent Mesh Coordination',
      description: 'Distributed threat intelligence sharing across all deployed agents'
    },
    {
      icon: Bot,
      title: 'AI Security Copilot',
      description: 'Conversational AI for threat investigation and automated response'
    },
    {
      icon: Globe,
      title: 'Integration Connectors',
      description: 'Connect to SIEM, SOAR, and third-party security tools'
    }
  ];

  const stats = [
    { value: '99.97%', label: 'Detection Rate' },
    { value: '<0.1s', label: 'Response Time' },
    { value: '50K+', label: 'Endpoints Protected' },
    { value: '24/7', label: 'SOC Coverage' }
  ];

  const capabilities = [
    'XDR/EDR Protection',
    'Network Scanning',
    'Vulnerability Assessment',
    'Penetration Testing',
    'Compliance Auditing',
    'Threat Intelligence',
    'Incident Response',
    'AI-Powered Analysis'
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={vanguardLogo} alt="Vanguard" className="h-10 w-auto" />
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/10">
              <a href="https://ultriumai.com/ultrium-vanguard">Learn More</a>
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
            >
              <Lock className="h-4 w-4 mr-2" />
              Login to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-[#0a0a0f]" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border-cyan-500/30 mb-6">
              <Zap className="h-3 w-3 mr-1" />
              v4.0 Enterprise Plus - Now Available
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Enterprise Security,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Simplified</span>
            </h1>
            
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Ultrium Vanguard combines AI-powered threat detection, autonomous response, 
              and comprehensive endpoint protection in a single unified platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/auth')} 
                className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
              >
                Access Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
              >
                <a href="https://ultriumai.com/contact">Request Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/10 bg-white/5">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* v4.0 Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 border-purple-500/30 mb-4">
              NEW IN v4.0
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Enterprise Plus Capabilities
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Advanced features for comprehensive security operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {v4Features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 border-purple-500/20 hover:border-purple-500/40"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 mb-4">
                    <feature.icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Complete Security Coverage
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Everything you need to protect your organization from modern cyber threats
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1 bg-white/5 border-white/10 hover:border-cyan-500/30"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 mb-4">
                    <feature.icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/60">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-16 bg-white/5 border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
              All-in-One Security Platform
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {capabilities.map((cap, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full border border-white/10"
              >
                <CheckCircle className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-white/80">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-[#0a0a0f]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Secure Your Infrastructure?
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Request access to your Vanguard dashboard to manage your security appliances, 
            monitor threats, and protect your organization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
            >
              <Lock className="h-5 w-5 mr-2" />
              Request Access
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              asChild 
              className="text-lg px-8 border-white/20 text-white hover:bg-white/10"
            >
              <a href="https://ultriumai.com/ultrium-vanguard">View Full Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={vanguardLogo} alt="Vanguard" className="h-8 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="https://ultriumai.com/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="https://ultriumai.com/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="https://ultriumai.com/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
