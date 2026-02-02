import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Download, Receipt } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get('session_id');
  const paymentType = searchParams.get('type') || 'subscription';

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !user || !session) {
        setLoading(false);
        return;
      }

      try {
        // Verify payment based on type
        let functionName, data, error;
        
        if (paymentType === 'credits') {
          const response = await supabase.functions.invoke('verify-credit-purchase', {
            body: { sessionId },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          data = response.data;
          error = response.error;
        } else if (paymentType === 'onetime') {
          const response = await supabase.functions.invoke('verify-one-time-payment', {
            body: { sessionId },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          data = response.data;
          error = response.error;
        } else {
          const response = await supabase.functions.invoke('check-subscription', {
            body: { sessionId },
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          data = response.data;
          error = response.error;
        }

        if (error) throw error;

        setPaymentDetails(data);
        
        // Show success message
        if (paymentType === 'credits') {
          toast({
            title: "Credits purchased successfully!",
            description: `${data.creditsAdded || 0} credits have been added to your account.`,
          });
        } else {
          toast({
            title: "Subscription activated!",
            description: "Your subscription has been successfully activated.",
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          title: "Verification Error",
          description: "There was an issue verifying your payment. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId, user, session, paymentType, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Invalid payment session.</p>
            <Button className="mt-4" onClick={() => navigate('/hub')}>
              Return to Hub
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your {paymentType === 'credits' ? 'credit purchase' : 'subscription'}. 
            Your account has been updated.
          </p>
        </div>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Session ID: {sessionId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentType === 'credits' && paymentDetails && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Credits Added:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    +{paymentDetails.creditsAdded || 0} credits
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">New Balance:</span>
                  <span className="text-lg font-semibold text-primary">
                    {paymentDetails.newBalance || 0} credits
                  </span>
                </div>
              </>
            )}

            {paymentType === 'subscription' && paymentDetails && (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Plan:</span>
                  <Badge className="capitalize">
                    {paymentDetails.subscription_tier || 'Premium'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge variant="secondary" className="text-green-600">
                    {paymentDetails.subscribed ? 'Active' : 'Processing'}
                  </Badge>
                </div>
                {paymentDetails.subscription_end && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Next Billing:</span>
                    <span className="text-sm">
                      {new Date(paymentDetails.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          
          {paymentType === 'credits' && (
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/credits">
                View Credit Usage
              </Link>
            </Button>
          )}
          
          {paymentType === 'subscription' && (
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/profile">
                Manage Subscription
              </Link>
            </Button>
          )}
          
          <Button variant="ghost" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paymentType === 'credits' ? (
              <>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Start using your credits with any AI-powered feature
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Create custom GPTs and assistants
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Process documents and generate content
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Explore your new premium features
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Set up your team and invite members
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  • Configure integrations and automations
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;