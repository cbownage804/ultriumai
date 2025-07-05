import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface UserCountSelectorProps {
  solutionType: string;
  solutionName: string;
  onPurchase: (userCount: number, interval: 'monthly' | 'yearly') => void;
  isLoading: boolean;
}

const PRICING_TIERS = {
  // Premium solutions: $20/user/month
  "ai-knowledge": { price: 20, tier: "premium" },
  "basic-security": { price: 20, tier: "premium" },
  "security-knowledge": { price: 20, tier: "premium" },
  "it-documentation": { price: 20, tier: "premium" },
  
  // Enterprise solutions: $35/user/month  
  "custom-chatbot": { price: 35, tier: "enterprise" },
  "white-label": { price: 35, tier: "enterprise" },
  "security-apps": { price: 35, tier: "enterprise" },
  "security-portal": { price: 35, tier: "enterprise" }
};

export const UserCountSelector = ({ 
  solutionType, 
  solutionName, 
  onPurchase, 
  isLoading 
}: UserCountSelectorProps) => {
  const [userCount, setUserCount] = useState(5);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  
  const pricing = PRICING_TIERS[solutionType as keyof typeof PRICING_TIERS];
  const minimumUsers = 5;
  const finalUserCount = Math.max(userCount, minimumUsers);
  
  const monthlyPrice = pricing.price * finalUserCount;
  const yearlyPrice = monthlyPrice * 10; // 2 months free (10 months instead of 12)
  const displayPrice = billingInterval === 'monthly' ? monthlyPrice : yearlyPrice;

  const handlePurchase = () => {
    onPurchase(finalUserCount, billingInterval);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{solutionName}</CardTitle>
        <Badge variant={pricing.tier === "premium" ? "secondary" : "default"}>
          {pricing.tier === "premium" ? "Premium" : "Enterprise"} Solution
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Interval Toggle */}
        <div className="space-y-2">
          <Label>Billing Interval</Label>
          <div className="flex gap-2">
            <Button
              variant={billingInterval === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingInterval('monthly')}
              className="flex-1"
            >
              Monthly
            </Button>
            <Button
              variant={billingInterval === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingInterval('yearly')}
              className="flex-1"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">2 months free</Badge>
            </Button>
          </div>
        </div>

        {/* User Count Selector */}
        <div className="space-y-2">
          <Label htmlFor="userCount">Number of Users (minimum {minimumUsers})</Label>
          <Input
            id="userCount"
            type="number"
            min={minimumUsers}
            value={userCount}
            onChange={(e) => setUserCount(Math.max(minimumUsers, parseInt(e.target.value) || minimumUsers))}
            className="text-center"
          />
        </div>

        {/* Price Display */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price per user:</span>
            <span className="font-medium">${pricing.price}/{billingInterval === 'monthly' ? 'month' : 'year'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Users:</span>
            <span className="font-medium">{finalUserCount}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg text-primary">
                ${displayPrice}/{billingInterval === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            {billingInterval === 'yearly' && (
              <p className="text-xs text-muted-foreground mt-1">
                Save ${monthlyPrice * 2} per year (2 months free)
              </p>
            )}
          </div>
        </div>

        {/* Purchase Button */}
        <Button 
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Processing...' : `Subscribe - $${displayPrice}/${billingInterval === 'monthly' ? 'mo' : 'yr'}`}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          You can change your user count anytime in your billing portal
        </p>
      </CardContent>
    </Card>
  );
};