import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Monitor, 
  Target, 
  Eye, 
  Cpu,
  ArrowRight,
  CheckCircle2,
  Zap,
  Lock,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getVanguardBasePath } from '@/utils/subdomain';

export default function VanguardLanding() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg">Ultrium Vanguard</span>
              <span className="text-xs text-muted-foreground ml-2">Security Platform</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <a href="https://ultriumai.com/ultrium-vanguard">Learn More</a>
            </Button>
            <Button onClick={() => navigate('/auth')}>
              <Lock className="h-4 w-4 mr-2" />
              Login to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Next-Generation XDR Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Enterprise Security,
              <br />
              <span className="text-primary">Simplified</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ultrium Vanguard combines AI-powered threat detection, autonomous response, 
              and comprehensive endpoint protection in a single unified platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
                Access Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="https://ultriumai.com/contact">Request Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Security Coverage
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect your organization from modern cyber threats
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Secure Your Infrastructure?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Login to your Vanguard dashboard to manage your security appliances, 
            monitor threats, and protect your organization.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              <Lock className="h-5 w-5 mr-2" />
              Login to Dashboard
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="https://ultriumai.com/ultrium-vanguard">View Full Features</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Ultrium Vanguard</span>
              <span className="text-muted-foreground">by UltriumAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://ultriumai.com/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="https://ultriumai.com/terms" className="hover:text-foreground transition-colors">Terms</a>
              <a href="https://ultriumai.com/contact" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}