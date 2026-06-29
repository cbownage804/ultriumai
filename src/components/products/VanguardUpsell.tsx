import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Shield, Package, Sparkles } from 'lucide-react';

interface VanguardTier {
  name: string;
  price: string;
  description: string;
  includes: string[];
  highlighted?: boolean;
  badge?: string;
}

const VANGUARD_TIERS: VanguardTier[] = [
  {
    name: 'Vanguard Starter',
    price: '$30',
    description: 'Core security protection',
    includes: [
      'Scan™ - Email/URL/Doc Scanning',
      'Vault™ - Password Manager',
      'Watch™ - Dark Web Monitoring',
      'AI Threat Detection',
      'Security Dashboard',
    ],
    badge: 'Security Suite',
  },
  {
    name: 'Vanguard Professional',
    price: '$50',
    description: 'Security + Asset Management',
    includes: [
      'Everything in Starter',
      'SafeTrack™ - IT Asset Management',
      'Depreciation Tracking',
      'QR Asset Labels',
      'Maintenance Scheduling',
      'Compliance Reporting',
    ],
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Vanguard Enterprise',
    price: '$80',
    description: 'Complete IT operations platform',
    includes: [
      'Everything in Professional',
      'SafeOps™ - Remote Monitoring',
      'SafeDesk™ - IT Service Desk',
      'Patch Management',
      'Script Automation',
      '24/7 AI SOC Monitoring',
      'Competes with Atera, NinjaOne',
    ],
    badge: 'Full Platform',
  },
];

interface VanguardUpsellProps {
  currentProduct: string;
  currentProductPrice: string;
  competitorComparison?: string;
}

export function VanguardUpsell({ currentProduct, currentProductPrice, competitorComparison }: VanguardUpsellProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent border-y border-primary/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-foreground border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Save More with Vanguard Suite
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Get {currentProduct} + More in Vanguard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            You're viewing {currentProduct} at {currentProductPrice}. Bundle with Vanguard Suite and get 
            access to our complete IT security & operations platform at a fraction of the cost.
            {competitorComparison && (
              <span className="block mt-2 text-primary font-medium">{competitorComparison}</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {VANGUARD_TIERS.map((tier, i) => (
            <Card 
              key={i} 
              className={`relative ${tier.highlighted ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50'}`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={tier.highlighted ? 'bg-primary' : 'bg-muted text-muted-foreground'}>
                    {tier.badge}
                  </Badge>
                </div>
              )}
              <CardContent className="pt-8 pb-6">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary">{tier.price}</span>
                    <span className="text-muted-foreground">/user/mo</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {tier.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/vanguard/suite" className="block">
                  <Button 
                    className={`w-full ${tier.highlighted ? '' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                    variant={tier.highlighted ? 'default' : 'secondary'}
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span>All tiers include <strong>$999 one-time onboarding</strong> with agent hardware setup</span>
          </div>
          <div className="mt-4">
            <Link to="/vanguard/suite">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                <Package className="mr-2 h-5 w-5" />
                Configure Your Vanguard Suite
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}