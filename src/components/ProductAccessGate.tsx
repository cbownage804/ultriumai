import { ReactNode } from 'react';
import { useProductAccess, Product, AccessLevel } from '@/hooks/useProductAccess';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

interface ProductAccessGateProps {
  children: ReactNode;
  product: Product;
  requiredLevel?: AccessLevel;
}

const PRODUCT_INFO: Record<Product, { name: string; description: string; color: string }> = {
  ai_studio: {
    name: 'AI Studio',
    description: 'Build custom GPTs and AI agents for your business',
    color: 'text-blue-400',
  },
  safesuite: {
    name: 'SafeSuite',
    description: 'Enterprise security tools and password vault',
    color: 'text-purple-400',
  },
  vanguard: {
    name: 'Vanguard',
    description: 'Endpoint security and compliance monitoring',
    color: 'text-emerald-400',
  },
};

const LEVEL_INFO: Record<AccessLevel, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

export function ProductAccessGate({ children, product, requiredLevel = 'free' }: ProductAccessGateProps) {
  const { hasAccess, getAccessLevel, loading } = useProductAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  const userHasAccess = hasAccess(product, requiredLevel);
  const currentLevel = getAccessLevel(product);
  const productInfo = PRODUCT_INFO[product];

  if (!userHasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">
              Upgrade Required
            </CardTitle>
            <CardDescription>
              Access to <span className={productInfo.color}>{productInfo.name}</span> requires a {LEVEL_INFO[requiredLevel]} subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {productInfo.description}
            </p>
            
            {currentLevel && (
              <p className="text-xs text-center text-muted-foreground">
                Your current plan: <span className="font-medium">{LEVEL_INFO[currentLevel]}</span>
              </p>
            )}
            
            <div className="flex flex-col gap-2">
              <Button className="w-full" asChild>
                <Link to="/pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Upgrade Options
                </Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/dashboard">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
