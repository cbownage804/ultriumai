import { useAuth } from '@/hooks/useAuth';
import { useProductAccess, Product, AccessLevel } from '@/hooks/useProductAccess';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Lock, ArrowRight, Zap, LogOut, Settings } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ActivityFeedWidget } from '@/components/dashboard/ActivityFeedWidget';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { HubOnboardingTour } from '@/components/HubOnboardingTour';
import aiStudioLogo from '@/assets/ultrium-gpt-logo.png';
import safesuiteLogo from '@/assets/safesuite-logo.png';
import vanguardLogo from '@/assets/vanguard-logo.png';
import ultraiumAiLogo from '/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png';

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
  product,
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
    // Only use subdomain redirects on actual production
    const isProduction = window.location.hostname.endsWith('.ultriumai.com') || 
                        window.location.hostname === 'ultriumai.com' ||
                        window.location.hostname.endsWith('.ultriumai.app') || 
                        window.location.hostname === 'ultriumai.app';
    
    if (isSubdomain && isProduction) {
      // Production cross-domain redirect
      window.location.href = href;
    } else {
      // Local navigation for Lovable published/preview or main domain
      if (isSubdomain && !isProduction) {
        // On Lovable domains, use prefixed routes
        if (product === 'safesuite') {
          navigate('/safesuite/dashboard');
        } else if (product === 'vanguard') {
          navigate('/vanguard/dashboard');
        } else {
          navigate('/ai-studio');
        }
      } else {
        // Regular local navigation
        navigate(href);
      }
    }
  };

  // Get shadow color based on product
  const getShadowClass = () => {
    if (color === 'primary') return 'shadow-primary/30';
    if (color === 'emerald-500') return 'shadow-emerald-500/30';
    if (color === 'cyan-500') return 'shadow-cyan-500/30';
    return 'shadow-primary/30';
  };

  return (
    <Card className="relative overflow-hidden border-border/30 hover:border-primary/40 transition-all duration-500 group bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Decorative corner glow */}
      <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${bgGradient} rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
      
      <CardHeader className="relative z-10 pb-4">
        {/* Centered Horizontal Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className={`px-6 py-4 md:px-8 md:py-5 bg-black rounded-2xl ${getShadowClass()} shadow-xl mb-4 flex items-center justify-center min-w-[220px] md:min-w-[260px] min-h-[90px] md:min-h-[110px] transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl`}>
            <img 
              src={logo} 
              alt={name} 
              className={`w-auto object-contain transition-transform duration-300 group-hover:scale-110 ${
                name === 'Vanguard' 
                  ? 'h-14 max-w-[160px]' 
                  : 'h-24 max-w-[220px] scale-125'
              }`} 
            />
          </div>
          <div className="flex items-center gap-3">
            {accessLevel && (
              <Badge variant="outline" className={`text-${color} border-${color}/30 bg-${color}/10 text-xs px-3 py-1`}>
                {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)} Plan
              </Badge>
            )}
            {hasAccess ? (
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <CardDescription className="text-sm text-center leading-relaxed">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10 space-y-5">
        <ul className="space-y-2.5">
          {features.slice(0, 3).map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
              <div className={`h-6 w-6 rounded-lg bg-${color}/10 flex items-center justify-center flex-shrink-0`}>
                <Zap className={`h-3.5 w-3.5 text-${color}`} />
              </div>
              {feature}
            </li>
          ))}
        </ul>
        
          <Button 
            onClick={handleClick}
            className={`w-full group/btn transition-all duration-300 ${hasAccess ? 'shadow-lg hover:shadow-xl' : ''}`}
            variant={hasAccess ? "default" : "outline"}
            size="lg"
          >
            {hasAccess ? (
              <>
                Open {name}
                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
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
  const { user, loading: authLoading, signOut } = useAuth();
  const { access, loading: accessLoading, getAccessLevel } = useProductAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loading = authLoading || accessLoading;

  const handleSignOut = async () => {
   await signOut();
   toast({
     title: "Signed out",
     description: "You have been successfully signed out.",
   });
    // signOut now handles navigation with full page reload
  };

  // Show loading state while auth or access is being determined
  // This prevents the race condition where user is briefly null during hydration
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

  // ProtectedRoute already handles unauthenticated users - this is just a safety fallback
  // Use Navigate component instead of imperative navigate() to avoid double-redirects
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const products: ProductCardProps[] = [
    {
      product: 'ai_studio',
      name: 'AI Studio',
      description: 'Build custom GPTs and AI agents trained on your data',
      logo: aiStudioLogo,
      href: '/ai-studio',
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
      href: '/safesuite/dashboard',
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
      href: '/vanguard/app',
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
  
  // Check if user is admin (UltriumAI employee with confirmed email)
  const isAdmin = user.email?.endsWith('@ultriumai.com') && user.email_confirmed_at != null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      
      {/* Header */}
      <header className="border-b border-border/30 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://ultriumai.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-9 w-auto transition-transform duration-300 group-hover:scale-110" />
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">UltriumAI</span>
          </a>
          <div className="flex items-center gap-3" data-tour="hub-search">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="hover:bg-muted">
              Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/pricing')} className="border-primary/30 hover:border-primary hover:bg-primary/5 transition-all">
              Upgrade
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 relative z-10">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6 animate-fade-in backdrop-blur-sm group hover:bg-primary/15 hover:border-primary/40 transition-all cursor-default">
            <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
            <span className="text-sm font-medium text-primary">Product Hub</span>
            <InfoTooltip content="This is your central command center. Dashboard widgets show live data, product cards give quick access to each platform, and the activity feed tracks actions across all products." size="md" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">
            Welcome back, <span className="bg-gradient-to-r from-primary via-violet-500 to-cyan-500 bg-clip-text text-transparent bg-[size:200%_auto] animate-[gradient-shift_8s_ease_infinite]">{userName}</span>!
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto animate-fade-in-up stagger-1">
            Access your UltriumAI products and services from one central hub. 
            Select a product below to get started.
          </p>
        </div>

        {/* Onboarding Tour */}
        <HubOnboardingTour />

        {/* Customizable Dashboard Widgets */}
        <div className="mb-12" data-tour="hub-dashboard">
          <CustomizableDashboard />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto" data-tour="hub-products">
          {products.map((product, index) => (
            <div key={product.product} className={`animate-fade-in-up stagger-${index + 1}`}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="mt-12 max-w-5xl mx-auto" data-tour="hub-activity">
          <ActivityFeedWidget />
        </div>

        {/* Quick Stats or Tips */}
        <div className="mt-12 text-center animate-fade-in stagger-4">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50">
            <p className="text-sm text-muted-foreground">
              Need help choosing? <a href="/pricing" className="text-primary hover:underline font-medium">Compare plans</a> or <a href="/contact" className="text-primary hover:underline font-medium">talk to sales</a>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
