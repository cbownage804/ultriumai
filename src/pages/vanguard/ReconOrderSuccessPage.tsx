import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, Mail, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ReconOrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [orderDetails, setOrderDetails] = useState<{
    hardwareTier: string;
    subscriptionTier: string;
    email: string;
  } | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Try to fetch order details from the session
    const fetchOrderDetails = async () => {
      if (!sessionId) return;
      
      // For now, just show success - in production you'd verify the session
      setOrderDetails({
        hardwareTier: 'pro',
        subscriptionTier: 'professional',
        email: 'customer@example.com',
      });
    };

    fetchOrderDetails();
  }, [sessionId]);

  const steps = [
    {
      icon: CheckCircle,
      title: 'Order Confirmed',
      description: 'Your payment has been processed successfully',
      status: 'complete',
    },
    {
      icon: Package,
      title: 'Provisioning',
      description: 'We\'re configuring your Recon unit with your unique activation key',
      status: 'current',
    },
    {
      icon: Truck,
      title: 'Shipping',
      description: 'Your unit will be shipped within 2-3 business days',
      status: 'pending',
    },
    {
      icon: Mail,
      title: 'Activation',
      description: 'Connect your unit to begin network scanning',
      status: 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold">Thank You for Your Order!</h1>
          <p className="text-muted-foreground text-lg">
            Your Vanguard Recon unit is being prepared for shipment.
          </p>
          {sessionId && (
            <Badge variant="outline" className="font-mono text-xs">
              Order: {sessionId.slice(0, 20)}...
            </Badge>
          )}
        </div>

        {/* Order Timeline */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              Order Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.status === 'complete'
                          ? 'bg-green-500/20 text-green-500'
                          : step.status === 'current'
                          ? 'bg-cyan-500/20 text-cyan-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 ${
                          step.status === 'complete' ? 'bg-green-500/50' : 'bg-border'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <h3
                      className={`font-medium ${
                        step.status === 'pending' ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">What Happens Next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">1.</span>
                You'll receive a confirmation email with your order details
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">2.</span>
                We'll provision your Recon unit with a unique activation key
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">3.</span>
                Once shipped, you'll get tracking information via email
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-500">4.</span>
                Simply plug in your unit - it will auto-activate and appear in your dashboard
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(`${basePath}/devices`)}
            className="gap-2"
          >
            View My Devices
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate(basePath)}
            className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReconOrderSuccessPage;
