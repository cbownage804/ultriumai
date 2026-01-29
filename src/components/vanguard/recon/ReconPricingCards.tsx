import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  RECON_SUBSCRIPTION_TIERS, 
  formatPrice,
  type SubscriptionTier,
  type HardwareTier,
} from '@/config/reconPricing';

interface ReconPricingCardsProps {
  selectedHardware: HardwareTier;
  selectedSubscription: SubscriptionTier;
  onSelectSubscription: (tier: SubscriptionTier) => void;
}

export function ReconPricingCards({ 
  selectedHardware, 
  selectedSubscription, 
  onSelectSubscription 
}: ReconPricingCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {Object.entries(RECON_SUBSCRIPTION_TIERS).map(([key, tier]) => {
        const isPopular = 'popular' in tier && tier.popular;
        const isSelected = selectedSubscription === key;

        return (
          <Card 
            key={key}
            className={`relative bg-gray-900/50 transition-all cursor-pointer ${
              isSelected 
                ? 'border-2 border-cyan-500 shadow-lg shadow-cyan-500/20' 
                : isPopular
                  ? 'border-2 border-purple-500/50'
                  : 'border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => onSelectSubscription(key as SubscriptionTier)}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-purple-500 text-white border-none gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="pt-6">
              <CardTitle className="text-white text-xl">{tier.name}</CardTitle>
              <CardDescription className="text-gray-400">
                {tier.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <div className="text-4xl font-bold text-white">
                  {formatPrice(tier.monthlyPriceCents)}
                  <span className="text-base font-normal text-gray-400">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  or {formatPrice(tier.yearlyPriceCents)}/year (save 17%)
                </p>
              </div>

              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-cyan-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${
                  isSelected 
                    ? 'bg-cyan-500 hover:bg-cyan-600' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                variant={isSelected ? 'default' : 'secondary'}
              >
                {isSelected ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
