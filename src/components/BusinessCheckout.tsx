import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Crown, 
  Building, 
  Shield, 
  Zap,
  Plus,
  Minus,
  Check
} from "lucide-react";

interface BusinessCheckoutProps {
  onSuccess?: () => void;
  packageType?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "lg" | "default";
}

const BusinessCheckout = ({ onSuccess, packageType, children, className, size = "default" }: BusinessCheckoutProps) => {
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>(packageType || 'professional');
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const [seatCount, setSeatCount] = useState<number>(5);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const packages = {
    starter: {
      name: 'Starter',
      icon: Users,
      description: 'Perfect for small teams getting started',
      monthly: { platform: 199, per_user: 35 },
      annual: { platform: 1990, per_user: 350 },
      features: [
        'Up to 10 team members',
        '5 Custom AI Agents',
        'SafeScan security scanning',
        'Basic support',
        '10GB storage'
      ],
      maxSeats: 10
    },
    professional: {
      name: 'Professional', 
      icon: Crown,
      description: 'Advanced features for growing businesses',
      monthly: { platform: 399, per_user: 55 },
      annual: { platform: 3990, per_user: 550 },
      features: [
        'Up to 50 team members',
        'Unlimited Custom AI Agents',
        'SafePass, SafeKB, SafeNet, SafeScore',
        'Mobile apps (iOS & Android)',
        'Priority support',
        '50GB storage'
      ],
      maxSeats: 50,
      popular: true
    },
    enterprise: {
      name: 'Enterprise',
      icon: Building,
      description: 'Complete platform for large organizations',
      monthly: { platform: 799, per_user: 75 },
      annual: { platform: 7990, per_user: 750 },
      features: [
        'Unlimited team members',
        'SafeWeb & SafeShield',
        'White-label solutions',
        'Dedicated account manager',
        '24/7 phone support',
        '100GB+ storage'
      ],
      maxSeats: 1000
    }
  };

  const addons = {
    safesecure: {
      name: 'SafeSecure',
      description: 'Advanced endpoint protection and threat response',
      monthly: 25,
      annual: 250,
      features: ['AI-powered SafeAV protection', 'Managed Detection & Response (SafeEDR)', '24/7 threat monitoring']
    },
    safecenter: {
      name: 'SafeCenter',
      description: 'Complete service management platform',
      monthly: 35,
      annual: 350,
      features: ['Integrated ticketing system', 'Remote monitoring & management (RMM)', 'Automated patch management']
    }
  };

  const calculateTotal = () => {
    const pkg = packages[selectedPackage as keyof typeof packages];
    const pricing = pkg[billingCycle as keyof typeof pkg] as { platform: number; per_user: number };
    
    let total = pricing.platform + (pricing.per_user * seatCount);
    
    selectedAddons.forEach(addonKey => {
      const addon = addons[addonKey as keyof typeof addons];
      total += addon[billingCycle as keyof typeof addon] as number * seatCount;
    });
    
    return total;
  };

  const handleSeatChange = (increment: boolean) => {
    const pkg = packages[selectedPackage as keyof typeof packages];
    const newCount = increment ? seatCount + 1 : seatCount - 1;
    
    if (newCount >= 1 && newCount <= pkg.maxSeats) {
      setSeatCount(newCount);
    }
  };

  const handleAddonToggle = (addonKey: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonKey) 
        ? prev.filter(a => a !== addonKey)
        : [...prev, addonKey]
    );
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('business-billing', {
        body: {
          action: 'create_business_checkout',
          package_type: selectedPackage,
          billing_cycle: billingCycle,
          seat_count: seatCount,
          addons: selectedAddons
        }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const selectedPackageData = packages[selectedPackage as keyof typeof packages];
  const SelectedIcon = selectedPackageData.icon;

  // If children provided, render as simple button
  if (children) {
    return (
      <Button 
        size={size}
        className={className}
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {children}
      </Button>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Package Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Package</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(packages).map(([key, pkg]) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage === key;
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} ${'popular' in pkg && pkg.popular ? 'border-primary' : ''}`}
                onClick={() => setSelectedPackage(key)}
              >
                {'popular' in pkg && pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(pkg.monthly.platform + pkg.monthly.per_user)}
                    </div>
                    <p className="text-xs text-muted-foreground">Platform + 1 user/month</p>
                  </div>
                  <div className="text-left space-y-2">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Cycle */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Billing Cycle</h3>
        <div className="flex gap-4">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'annual' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <Badge variant="secondary" className="ml-2">Save 2 months</Badge>
          </Button>
        </div>
      </div>

      {/* Seat Count */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Number of Seats</h3>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handleSeatChange(false)}
            disabled={seatCount <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={seatCount}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= selectedPackageData.maxSeats) {
                  setSeatCount(value);
                }
              }}
              className="w-20 text-center"
              min={1}
              max={selectedPackageData.maxSeats}
            />
            <span className="text-sm text-muted-foreground">
              (max {selectedPackageData.maxSeats} for {selectedPackageData.name})
            </span>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => handleSeatChange(true)}
            disabled={seatCount >= selectedPackageData.maxSeats}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Add-ons (Optional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(addons).map(([key, addon]) => {
            const isSelected = selectedAddons.includes(key);
            
            return (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                onClick={() => handleAddonToggle(key)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Checkbox checked={isSelected} />
                        {addon.name}
                      </CardTitle>
                      <CardDescription className="text-sm">{addon.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(addon[billingCycle as keyof typeof addon] as number)}
                      </div>
                      <div className="text-xs text-muted-foreground">per user/{billingCycle}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {addon.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Shield className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Summary and Checkout */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SelectedIcon className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{selectedPackageData.name} Platform</span>
              <span>{formatCurrency((selectedPackageData[billingCycle as keyof typeof selectedPackageData] as any).platform)}</span>
            </div>
            <div className="flex justify-between">
              <span>{seatCount} User Seats</span>
              <span>{formatCurrency((selectedPackageData[billingCycle as keyof typeof selectedPackageData] as any).per_user * seatCount)}</span>
            </div>
            {selectedAddons.map(addonKey => {
              const addon = addons[addonKey as keyof typeof addons];
              return (
                <div key={addonKey} className="flex justify-between">
                  <span>{addon.name} ({seatCount} users)</span>
                  <span>{formatCurrency((addon[billingCycle as keyof typeof addon] as number) * seatCount)}</span>
                </div>
              );
            })}
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total ({billingCycle})</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
            {billingCycle === 'annual' && (
              <p className="text-sm text-green-600 text-right">
                You save {formatCurrency(calculateTotal() * 12 / 10 - calculateTotal())} compared to monthly
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? "Creating checkout..." : `Start 14-Day Free Trial`}
              <Zap className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              No credit card required for trial • Cancel anytime
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessCheckout;