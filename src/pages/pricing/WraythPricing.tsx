import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import {
  SAFESUITE_TIERS,
  FEATURE_DESCRIPTIONS,
  formatMonthlyPrice,
  formatLimitWithUnit,
  type TierFeatures,
} from '@/config/safeSuiteTiers';
import WraythNav from '@/components/safesuite/SafeSuiteNav';

export default function WraythPricing() {
  const tiers = Object.values(SAFESUITE_TIERS);
  return (
    <div className="min-h-screen bg-background">
      <WraythNav />
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="mb-4">Simple, transparent pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose your plan</h1>
          <p className="text-lg text-muted-foreground">
            All plans include Vault, Scan, and Watch. Cancel anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const featureKeys = Object.keys(tier.features) as (keyof TierFeatures)[];
            const lines = featureKeys
              .map((key) => {
                const f = tier.features[key];
                if (!f.enabled) return null;
                const info = FEATURE_DESCRIPTIONS[key];
                const limit = formatLimitWithUnit(key, f.limit);
                return limit ? `${info.name} — ${limit}` : info.name;
              })
              .filter(Boolean) as string[];

            return (
              <Card key={tier.id} className={tier.popular ? 'border-primary shadow-lg relative' : 'relative'}>
                <CardHeader>
                  {tier.badge && <Badge className="w-fit mb-2">{tier.badge}</Badge>}
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{formatMonthlyPrice(tier)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full" variant={tier.popular ? 'default' : 'outline'}>
                    <Link to="/auth?mode=signup">Get started</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
