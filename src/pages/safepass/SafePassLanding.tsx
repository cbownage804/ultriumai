import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { safeSuiteProducts } from '@/components/safesuite/SafeSuiteProductIcons';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Chrome, 
  Upload, 
  Users,
  CheckCircle,
  ArrowRight,
  Zap,
  Globe,
  RefreshCw
} from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Encryption',
    description: 'Your passwords are encrypted locally before syncing. We never see your master password.'
  },
  {
    icon: AlertTriangle,
    title: 'Real-Time Breach Monitoring',
    description: 'Automatic daily scans against active breach databases to detect compromised credentials.'
  },
  {
    icon: Chrome,
    title: 'Browser Extension',
    description: 'One-click autofill for Chrome. Save new passwords seamlessly as you browse.'
  },
  {
    icon: Upload,
    title: 'Easy Import',
    description: 'Import from Chrome, Firefox, 1Password, LastPass, and more in seconds.'
  },
  {
    icon: Users,
    title: 'Team Sharing',
    description: 'Securely share credentials with team members without exposing passwords.'
  },
  {
    icon: RefreshCw,
    title: 'Password Generator',
    description: 'Generate strong, unique passwords with customizable complexity settings.'
  }
];

const securityFeatures = [
  'AES-256 encryption',
  'PBKDF2 key derivation',
  'Zero-knowledge architecture',
  'SOC 2 Type II compliant',
  'GDPR compliant',
  'Two-factor authentication'
];

export default function SafePassLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/safepass" className="flex items-center space-x-2">
            <img 
              src={safeSuiteProducts.safepass.logo} 
              alt="SafePass" 
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold">SafePass</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/safepass/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/safepass/auth?mode=signup">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3 w-3 mr-1" />
              Enterprise-Grade Security
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Your passwords, <span className="text-primary">protected</span> and <span className="text-primary">monitored</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              SafePass automatically checks your credentials against live breach databases daily. 
              Import your browser passwords, use our Chrome extension, and sleep better knowing 
              you'll be alerted the moment your credentials are exposed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/safepass/auth?mode=signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a 
                href="#chrome-extension" 
                className="text-sm text-muted-foreground hover:text-foreground flex items-center"
              >
                <Chrome className="mr-2 h-4 w-4" />
                Download Chrome Extension
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need for password security</h2>
            <p className="mt-4 text-muted-foreground">
              A complete password management solution with real-time threat monitoring
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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

      {/* Breach Monitoring Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="destructive" className="mb-4">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Breach Protection
              </Badge>
              <h2 className="text-3xl font-bold mb-6">
                Know the moment your credentials are compromised
              </h2>
              <p className="text-muted-foreground mb-6">
                SafePass automatically scans your passwords against the latest breach databases 
                every day. When a match is found, you're immediately notified with steps to 
                secure your accounts.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Daily automated scans against 12B+ compromised records</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Instant alerts via email and in-app notifications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Step-by-step remediation guidance</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <span>Powered by Dehashed breach intelligence</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-2xl p-8 border border-destructive/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">Gmail Account</p>
                        <p className="text-sm text-muted-foreground">Found in 2 breaches</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Compromised</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Bank Account</p>
                        <p className="text-sm text-muted-foreground">No breaches detected</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">Secure</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">AWS Console</p>
                        <p className="text-sm text-muted-foreground">No breaches detected</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">Secure</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome Extension Section */}
      <section id="chrome-extension" className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-background rounded-2xl p-8 border shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <Chrome className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">SafePass Extension</p>
                    <p className="text-sm text-muted-foreground">Chrome Web Store</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-primary" />
                    <span>One-click autofill on any website</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-primary" />
                    <span>Automatically save new credentials</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-5 w-5 text-primary" />
                    <span>Generate strong passwords in-browser</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <span>Works on all websites</span>
                  </div>
                </div>
                <Button className="w-full mt-6" size="lg">
                  <Chrome className="mr-2 h-4 w-4" />
                  Add to Chrome — It's Free
                </Button>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="mb-4">
                <Chrome className="h-3 w-3 mr-1" />
                Browser Extension
              </Badge>
              <h2 className="text-3xl font-bold mb-6">
                Seamless password management right in your browser
              </h2>
              <p className="text-muted-foreground mb-6">
                Our Chrome extension brings SafePass to every website you visit. 
                Autofill credentials instantly, save new passwords automatically, 
                and generate strong passwords without leaving the page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Enterprise-grade security</h2>
            <p className="mt-4 text-muted-foreground">
              Your data is protected by the industry's strongest encryption standards
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {securityFeatures.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                <CheckCircle className="h-3 w-3 mr-2" />
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start protecting your passwords today
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust SafePass to keep their credentials secure. 
            Free for personal use, with premium features for teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/safepass/auth?mode=signup">
              <Button size="lg" variant="secondary">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <img 
                src={safeSuiteProducts.safepass.logo} 
                alt="SafePass" 
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-bold">SafePass</span>
              <span className="text-muted-foreground">by Ultrium</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/security" className="hover:text-foreground">Security</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
