import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react";

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const paymentType = searchParams.get('type') || 'subscription';
  const reason = searchParams.get('reason') || 'user_cancelled';

  const getReasonMessage = () => {
    switch (reason) {
      case 'payment_failed':
        return "Your payment could not be processed. Please check your payment method and try again.";
      case 'session_expired':
        return "Your payment session has expired. Please start a new payment process.";
      case 'user_cancelled':
      default:
        return "You cancelled the payment process. No charges have been made to your account.";
    }
  };

  const getRetryPath = () => {
    return paymentType === 'credits' ? '/credits' : '/pricing';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Cancel Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            {getReasonMessage()}
          </p>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>What happened?</CardTitle>
            <CardDescription>
              Your {paymentType === 'credits' ? 'credit purchase' : 'subscription'} was not completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Don't worry!</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• No charges have been made to your payment method</li>
                <li>• Your account remains unchanged</li>
                <li>• You can try again at any time</li>
              </ul>
            </div>

            {reason === 'payment_failed' && (
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Payment Tips</h4>
                <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                  <li>• Ensure your card has sufficient funds</li>
                  <li>• Check that your billing address is correct</li>
                  <li>• Try a different payment method</li>
                  <li>• Contact your bank if the issue persists</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" onClick={() => navigate(getRetryPath())}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
          
          <Button variant="ghost" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hub
          </Button>
        </div>

        {/* Help Section */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                If you're experiencing issues with payment, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/contact">
                    Contact Support
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/docs">
                    View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <Card className="bg-gray-50 dark:bg-gray-950/20">
          <CardHeader>
            <CardTitle className="text-center">Other Ways to Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Free Trial</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Start with our free tier to explore the platform
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard">
                    Start Free Trial
                  </Link>
                </Button>
              </div>
              
              <div className="text-center">
                <h4 className="font-semibold mb-2">Schedule Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  See the platform in action with our team
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/demos">
                    Book Demo
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancel;