import { useAuth } from '@/hooks/useAuth';
import { useProductAccess, Product, AccessLevel } from '@/hooks/useProductAccess';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Shield, Lock, ExternalLink, ArrowRight, Zap } from 'lucide-react';
import aiStudioLogo from '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';

interface ProductCardProps {
  product: Product;
  name: string;
  description: string;
  logo: string;
  href: string;
  isSubdomain?: boolean;
  accessLevel: AccessLevel | null;
  color: string;
  bgGradient: string;
  features: string[];
}

const ProductCard = ({ 
  name, 
  description, 
  logo, 
  href, 
  isSubdomain,
  accessLevel, 
  color,
  bgGradient,
  features 
}: ProductCardProps) => {
  const navigate = useNavigate();
  const hasAccess = accessLevel !== null;

  const handleClick = () => {
    if (isSubdomain) {
      window.location.href = href;
    } else {
      navigate(href);
    }
  };

  return (
    <Card className={`relative overflow-hidden border-border/50 hover:border-${color}/50 transition-all duration-300 group`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-background/80 border border-border/50 p-2 flex items-center justify-center">
              <img src={logo} alt={name} className="h-8 w-auto" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              {accessLevel && (
                <Badge variant="outline" className={`text-${color} border-${color}/30 bg-${color}/10 text-xs mt-1`}>
                  {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)} Plan
                </Badge>
              )}
            </div>
          </div>
          {hasAccess ? (
            <div className={`h-3 w-3 rounded-full bg-emerald-500 animate-pulse`} title="Active" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-4">
        <ul className="space-y-1.5">
          {features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className={`h-3 w-3 text-${color}`} />
              {feature}
            </li>
          ))}
        </ul>
        
        <Button 
          onClick={handleClick}
          className="w-full group/btn"
          variant={hasAccess ? "default" : "outline"}
          disabled={!hasAccess && name === 'Vanguard'} // Vanguard is invite-only
        >
          {hasAccess ? (
            <>
              Open {name}
              <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </>
          ) : name === 'Vanguard' ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Invite Only
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Get Started Free
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function ProductHub() {
  const { user, loading: authLoading } = useAuth();
  const { access, loading: accessLoading, getAccessLevel } = useProductAccess();
  const navigate = useNavigate();

  const loading = authLoading || accessLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your products...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const products: ProductCardProps[] = [
    {
      product: 'ai_studio',
      name: 'AI Studio',
      description: 'Build custom GPTs and AI agents trained on your data',
      logo: aiStudioLogo,
      href: '/dashboard',
      accessLevel: getAccessLevel('ai_studio'),
      color: 'primary',
      bgGradient: 'from-primary/5 via-transparent to-primary/10',
      features: [
        'Custom GPT Builder',
        'Knowledge Base Training',
        'API & Widget Deployment',
        'Conversation Analytics',
      ],
    },
    {
      product: 'safesuite',
      name: 'SafeSuite',
      description: 'Personal & SMB security toolkit with password vault and threat scanning',
      logo: safesuiteLogo,
      href: 'https://safesuite.ultriumai.com/dashboard',
      isSubdomain: true,
      accessLevel: getAccessLevel('safesuite'),
      color: 'emerald-500',
      bgGradient: 'from-emerald-500/5 via-transparent to-emerald-500/10',
      features: [
        'SafePass Password Vault',
        'Dark Web Monitoring',
        'Email & Link Scanner',
        'Asset Management',
      ],
    },
    {
      product: 'vanguard',
      name: 'Vanguard',
      description: 'Enterprise AI-powered cybersecurity operations platform for MSPs',
      logo: vanguardLogo,
      href: 'https://vanguard.ultriumai.com/app',
      isSubdomain: true,
      accessLevel: getAccessLevel('vanguard'),
      color: 'cyan-500',
      bgGradient: 'from-cyan-500/5 via-transparent to-purple-500/10',
      features: [
        'XDR/EDR Threat Detection',
        'Compliance Monitoring',
        'SIEM & Log Analysis',
        'Managed SOC Services',
      ],
    },
  ];

  // Get user's name for greeting
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={aiStudioLogo} alt="UltriumAI" className="h-8 w-auto" />
            <span className="font-semibold text-lg">UltriumAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')}>
              Upgrade
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Access your UltriumAI products and services from one central hub. 
            Select a product below to get started.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {products.map((product) => (
            <ProductCard key={product.product} {...product} />
          ))}
        </div>

        {/* Quick Stats or Tips */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Need help choosing? <a href="/pricing" className="text-primary hover:underline">Compare plans</a> or <a href="/contact" className="text-primary hover:underline">talk to sales</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
