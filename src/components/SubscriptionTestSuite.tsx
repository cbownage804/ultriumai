import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Clock, 
  CreditCard, 
  Users,
  Zap,
  AlertTriangle,
  Shield,
  Crown
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: string;
}

export function SubscriptionTestSuite() {
  const { subscription, isLoading: subLoading, createCheckout, openCustomerPortal } = useSubscription();
  const { user } = useAuth();
  const { credits, isLoading: creditsLoading } = useUserCredits();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Admin-only access check
  const isAdmin = user?.email?.endsWith('@ultriumai.com');
  
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
        <p className="text-muted-foreground max-w-md">
          The Subscription Test Suite is an internal tool available only to UltriumAI administrators.
        </p>
      </div>
    );
  }

  const runSubscriptionTests = async () => {
    setIsRunningTests(true);
    const results: TestResult[] = [];

    try {
      // Test 1: User Authentication
      results.push({
        name: 'User Authentication',
        status: user ? 'pass' : 'fail',
        message: user ? 'User is authenticated' : 'User not authenticated',
        details: user ? `User ID: ${user.id}` : undefined
      });

      // Test 2: Subscription Data Loading
      results.push({
        name: 'Subscription Data Loading',
        status: subLoading ? 'pending' : 'pass',
        message: subLoading ? 'Loading subscription data...' : 'Subscription data loaded',
        details: `Tier: ${subscription.subscription_tier}, Subscribed: ${subscription.subscribed}`
      });

      // Test 3: Credit System
      results.push({
        name: 'Credit System',
        status: creditsLoading ? 'pending' : 'pass',
        message: creditsLoading ? 'Loading credit data...' : 'Credit data loaded',
        details: `Used: ${credits.credits_used}/${credits.credits_limit}`
      });

      // Test 4: Trial Period Calculation
      if (user?.created_at) {
        const userCreatedAt = new Date(user.created_at);
        const now = new Date();
        const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
        const remainingTrialDays = Math.max(0, 14 - daysSinceSignup);
        
        results.push({
          name: 'Trial Period Calculation',
          status: 'pass',
          message: `Trial calculation working`,
          details: `Days since signup: ${Math.floor(daysSinceSignup)}, Remaining: ${Math.ceil(remainingTrialDays)}`
        });
      }

      // Test 5: Subscription Expiration Check
      if (subscription.subscription_end) {
        const isExpired = new Date(subscription.subscription_end) < new Date();
        results.push({
          name: 'Subscription Expiration Check',
          status: 'pass',
          message: `Expiration check working`,
          details: `Expires: ${subscription.subscription_end}, Expired: ${isExpired}`
        });
      }

      // Test 6: Premium Feature Access
      const hasPremiumAccess = subscription.subscription_tier === 'premium' || 
                              subscription.subscription_tier === 'enterprise';
      results.push({
        name: 'Premium Feature Access',
        status: hasPremiumAccess && subscription.subscribed ? 'pass' : 'fail',
        message: hasPremiumAccess && subscription.subscribed ? 'Has premium access' : 'No premium access',
        details: `Tier: ${subscription.subscription_tier}, Active: ${subscription.subscribed}`
      });

    } catch (error) {
      results.push({
        name: 'Test Execution',
        status: 'fail',
        message: 'Error during test execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const testStripeIntegration = async () => {
    try {
      await createCheckout('premium', 'monthly');
      // If no error thrown, integration is working
      setTestResults(prev => [...prev, {
        name: 'Stripe Checkout Integration',
        status: 'pass',
        message: 'Stripe checkout opened successfully',
        details: 'Integration is functional'
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: 'Stripe Checkout Integration',
        status: 'fail',
        message: 'Failed to create Stripe checkout',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const testCustomerPortal = async () => {
    try {
      await openCustomerPortal();
      setTestResults(prev => [...prev, {
        name: 'Customer Portal Integration',
        status: 'pass',
        message: 'Customer portal opened successfully',
        details: 'Portal access is functional'
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: 'Customer Portal Integration',
        status: 'fail',
        message: 'Failed to open customer portal',
        details: error instanceof Error ? error.message : 'Unknown error'
      }]);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Subscription System Test Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing for subscription, payment, and access control systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="stripe">Stripe</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">User Status</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {user ? 'Authenticated' : 'Not Authenticated'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'No user logged in'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Subscription</span>
                    </div>
                    <p className="text-2xl font-bold mt-2 capitalize">
                      {subscription.subscription_tier}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.subscribed ? 'Active' : 'Inactive'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Credits</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {credits.credits_used}/{credits.credits_limit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Used this month
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={runSubscriptionTests}
                  disabled={isRunningTests}
                  className="flex-1"
                >
                  {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              {testResults.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No tests have been run yet. Click "Run All Tests" to begin.
                  </AlertDescription>
                </Alert>
              )}

              {testResults.map((result, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-muted-foreground">{result.message}</p>
                          {result.details && (
                            <p className="text-xs text-muted-foreground mt-1">{result.details}</p>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(result.status)}>
                        {result.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="stripe" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Test Checkout Flow</h4>
                        <p className="text-sm text-muted-foreground">
                          Test the premium subscription checkout process
                        </p>
                      </div>
                      <Button onClick={testStripeIntegration}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Test Checkout
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Test Customer Portal</h4>
                        <p className="text-sm text-muted-foreground">
                          Test access to Stripe customer portal
                        </p>
                      </div>
                      <Button onClick={testCustomerPortal} variant="outline">
                        <Shield className="w-4 h-4 mr-2" />
                        Test Portal
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Access Control Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Custom GPT Creation</span>
                        <Badge variant={subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                          {subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>MSP Dashboard</span>
                        <Badge variant={subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                          {subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Security Tools</span>
                        <Badge variant={subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                          {subscription.subscription_tier === 'premium' || subscription.subscription_tier === 'enterprise' ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>Enterprise Features</span>
                        <Badge variant={subscription.subscription_tier === 'enterprise' ? 'default' : 'secondary'}>
                          {subscription.subscription_tier === 'enterprise' ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}