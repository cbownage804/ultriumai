import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { SAFESUITE_TIERS, formatMonthlyPrice } from '@/config/safeSuiteTiers';
import WraythNav from '@/components/safesuite/SafeSuiteNav';

export default function WraythPricing() {
  return (
    <div className="min-h-screen bg-background">
      <WraythNav />
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="mb-4">Simple, transparent pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Choose your plan</h1>
          <p className="text-lg text-muted-foreground">
            All plans include SafePass, SafeScan, SafeWeb, and SafeTrack. Cancel anytime.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Object.values(SAFESUITE_TIERS).map((tier: any) => (
            <Card key={tier.id} className={tier.recommended ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                {tier.recommended && <Badge className="w-fit mb-2">Most popular</Badge>}
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{formatMonthlyPrice(tier)}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {tier.features?.slice(0, 8).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={tier.recommended ? 'default' : 'outline'}>
                  <Link to="/auth?mode=signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
