import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  Package,
  CreditCard,
  Truck,
  Shield,
  Loader2,
  Check,
} from 'lucide-react';
import { VanguardNavigation } from '@/components/vanguard/VanguardNavigation';
import { 
  RECON_HARDWARE_TIERS, 
  RECON_SUBSCRIPTION_TIERS,
  formatPrice,
  type HardwareTier,
  type SubscriptionTier,
} from '@/config/reconPricing';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ReconCheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const hardware = (searchParams.get('hardware') || 'pro') as HardwareTier;
  const subscription = (searchParams.get('subscription') || 'professional') as SubscriptionTier;

  const hardwareTier = RECON_HARDWARE_TIERS[hardware];
  const subscriptionTier = RECON_SUBSCRIPTION_TIERS[subscription];

  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const totalToday = hardwareTier.priceCents + subscriptionTier.monthlyPriceCents;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.street || !formData.city || !formData.state || !formData.zip) {
      toast({
        title: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call edge function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('recon-checkout', {
        body: {
          hardwareTier: hardware,
          subscriptionTier: subscription,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          shippingAddress: {
            name: formData.name,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a0a]">
      <VanguardNavigation />

      <div className="md:ml-56 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white gap-2 mb-4"
              onClick={() => navigate(`${basePath}/recon`)}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Product
            </Button>
            <h1 className="text-3xl font-bold text-white">Complete Your Order</h1>
            <p className="text-gray-400">Secure checkout for your Vanguard Recon unit</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck className="h-5 w-5 text-cyan-500" />
                    Shipping Information
                  </CardTitle>
                  <CardDescription>Where should we ship your Recon unit?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Phone (Optional)</Label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <Separator className="bg-gray-800" />

                  <div className="space-y-2">
                    <Label>Street Address *</Label>
                    <Input
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="123 Main Street, Suite 100"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="New York"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="NY"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ZIP Code *</Label>
                      <Input
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        placeholder="10001"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Notice */}
              <Card className="bg-cyan-500/10 border-cyan-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Secure Payment via Stripe</p>
                      <p className="text-sm text-gray-400">
                        You'll be redirected to Stripe's secure checkout to complete your payment.
                        We never store your card details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-gray-900/50 border-gray-800 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5 text-cyan-500" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Hardware */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{hardwareTier.name}</span>
                      <span className="text-white">{formatPrice(hardwareTier.priceCents)}</span>
                    </div>
                    <p className="text-xs text-gray-400">{hardwareTier.specs.model}</p>
                  </div>

                  {/* Subscription */}
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{subscriptionTier.name} Plan</span>
                      <span className="text-white">{formatPrice(subscriptionTier.monthlyPriceCents)}/mo</span>
                    </div>
                    <p className="text-xs text-gray-400">First month included</p>
                  </div>

                  <Separator className="bg-gray-800" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Hardware</span>
                      <span className="text-white">{formatPrice(hardwareTier.priceCents)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">First Month</span>
                      <span className="text-white">{formatPrice(subscriptionTier.monthlyPriceCents)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-green-400">FREE</span>
                    </div>
                  </div>

                  <Separator className="bg-gray-800" />

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">Total Today</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {formatPrice(totalToday)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 text-center">
                    Then {formatPrice(subscriptionTier.monthlyPriceCents)}/month after first month
                  </p>

                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </Button>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      SSL Secured
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Check className="h-3 w-3" />
                      30-Day Guarantee
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReconCheckoutPage;
