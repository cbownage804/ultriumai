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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import vanguardLogo from '@/assets/vanguard-logo.png';

export default function VanguardLanding() {
  const navigate = useNavigate();

  const features = [
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

  const stats = [
    { value: '99.97%', label: 'Detection Rate' },
    { value: '<0.1s', label: 'Response Time' },
    { value: '50K+', label: 'Endpoints Protected' },
    { value: '24/7', label: 'SOC Coverage' }
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
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-cyan-500/30">
              <Zap className="h-4 w-4" />
              AI-Powered Cybersecurity Appliance
            </div>
            
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

      {/* Features Section */}
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
            {features.map((feature, index) => (
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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-cyan-500/10 via-purple-600/5 to-[#0a0a0f]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Secure Your Infrastructure?
          </h2>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Login to your Vanguard dashboard to manage your security appliances, 
            monitor threats, and protect your organization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')} 
              className="text-lg px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white border-0"
            >
              <Lock className="h-5 w-5 mr-2" />
              Login to Dashboard
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
