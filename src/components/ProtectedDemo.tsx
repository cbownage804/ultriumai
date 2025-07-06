import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  CheckCircle,
  Clock,
  Users,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedDemoProps {
  demoComponent: React.ComponentType;
  demoTitle: string;
  demoDescription: string;
  requiredPlan?: 'free' | 'premium' | 'enterprise';
  features?: string[];
}

const ProtectedDemo = ({ 
  demoComponent: DemoComponent, 
  demoTitle, 
  demoDescription,
  requiredPlan = 'free',
  features = []
}: ProtectedDemoProps) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    accountType: 'business'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              company_name: formData.companyName,
              account_type: formData.accountType
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You're now logged in and can access all demos.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const planFeatures = {
    free: [
      'Access to basic demos',
      'Email support',
      'Community resources'
    ],
    premium: [
      'All free features',
      'Advanced demos',
      'Priority support',
      'Custom configurations'
    ],
    enterprise: [
      'All premium features',
      'White-label access',
      'Dedicated support',
      'Custom integrations',
      'Advanced analytics'
    ]
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{demoTitle}</CardTitle>
            <CardDescription className="text-lg">
              {demoDescription}
            </CardDescription>
            <Badge variant="secondary" className="mx-auto">
              Authentication Required
            </Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          className="pl-10"
                          value={formData.fullName}
                          onChange={(e) => updateField('fullName', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Demo Features ({requiredPlan} plan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">What you'll get:</h4>
                <ul className="space-y-1">
                  {planFeatures[requiredPlan].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Demo includes:</h4>
                  <ul className="space-y-1">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{demoTitle}</CardTitle>
              <CardDescription>{demoDescription}</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Authenticated
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <DemoComponent />
    </div>
  );
};

export default ProtectedDemo;