import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Building, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata?.full_name || '',
    company_name: '',
    job_title: '',
    company_size: '',
    industry: '',
    use_cases: [] as string[],
    security_focus: [] as string[],
    bio: '',
    notification_preferences: {
      email_alerts: true,
      security_updates: true,
      product_updates: false,
    }
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const companySizeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-1000', label: '201-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Government', 'Non-profit', 'Legal', 'Other'
  ];

  const useCaseOptions = [
    'Password Management', 'Email Security', 'Network Monitoring',
    'Threat Detection', 'Compliance', 'Employee Training',
    'Incident Response', 'Risk Assessment'
  ];

  const securityFocusOptions = [
    'Data Protection', 'Network Security', 'Endpoint Security',
    'Cloud Security', 'Mobile Security', 'IoT Security',
    'Regulatory Compliance', 'Security Awareness'
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await updateProfile({
        full_name: formData.full_name,
        company_name: formData.company_name,
        bio: formData.bio,
        // Note: Additional onboarding data would need to be stored in a separate table
        // For now, we'll just update the basic profile fields
      });
      
      toast.success('Welcome to UltriumAI! Your profile has been set up successfully.');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    }
  };

  const toggleUseCase = (useCase: string) => {
    setFormData(prev => ({
      ...prev,
      use_cases: prev.use_cases.includes(useCase)
        ? prev.use_cases.filter(uc => uc !== useCase)
        : [...prev.use_cases, useCase]
    }));
  };

  const toggleSecurityFocus = (focus: string) => {
    setFormData(prev => ({
      ...prev,
      security_focus: prev.security_focus.includes(focus)
        ? prev.security_focus.filter(sf => sf !== focus)
        : [...prev.security_focus, focus]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Welcome to UltriumAI!</h2>
              <p className="text-muted-foreground">Let's set up your profile to get started</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                  placeholder="e.g. IT Manager, CISO, Security Analyst"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us a bit about yourself and your role..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Building className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">About Your Organization</h2>
              <p className="text-muted-foreground">Help us understand your company better</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Your company name"
                />
              </div>
              
              <div>
                <Label>Company Size</Label>
                <RadioGroup
                  value={formData.company_size}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, company_size: value }))}
                  className="mt-2"
                >
                  {companySizeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div>
                <Label>Industry</Label>
                <RadioGroup
                  value={formData.industry}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                  className="mt-2 grid grid-cols-2 gap-2"
                >
                  {industryOptions.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <RadioGroupItem value={industry} id={industry} />
                      <Label htmlFor={industry}>{industry}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Security Preferences</h2>
              <p className="text-muted-foreground">Select what matters most to your organization</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">What are your primary use cases? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {useCaseOptions.map((useCase) => (
                    <div
                      key={useCase}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.use_cases.includes(useCase)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => toggleUseCase(useCase)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.use_cases.includes(useCase)}
                          onChange={() => toggleUseCase(useCase)}
                        />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-base font-semibold">Security focus areas (Select your top priorities)</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {securityFocusOptions.map((focus) => (
                    <div
                      key={focus}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.security_focus.includes(focus)
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => toggleSecurityFocus(focus)}
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.security_focus.includes(focus)}
                          onChange={() => toggleSecurityFocus(focus)}
                        />
                        <span className="text-sm">{focus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Almost Done!</h2>
              <p className="text-muted-foreground">Configure your notification preferences</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Notification Preferences</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.notification_preferences.email_alerts}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        notification_preferences: {
                          ...prev.notification_preferences,
                          email_alerts: !!checked
                        }
                      }))
                    }
                  />
                  <div>
                    <Label>Email Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of important security events</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.notification_preferences.security_updates}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        notification_preferences: {
                          ...prev.notification_preferences,
                          security_updates: !!checked
                        }
                      }))
                    }
                  />
                  <div>
                    <Label>Security Updates</Label>
                    <p className="text-sm text-muted-foreground">Stay informed about new security features</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.notification_preferences.product_updates}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        notification_preferences: {
                          ...prev.notification_preferences,
                          product_updates: !!checked
                        }
                      }))
                    }
                  />
                  <div>
                    <Label>Product Updates</Label>
                    <p className="text-sm text-muted-foreground">Learn about new features and improvements</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold text-primary mb-2">Your Profile Summary</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {formData.full_name}</p>
                  {formData.job_title && <p><strong>Role:</strong> {formData.job_title}</p>}
                  {formData.company_name && <p><strong>Company:</strong> {formData.company_name}</p>}
                  {formData.company_size && <p><strong>Size:</strong> {formData.company_size}</p>}
                  {formData.industry && <p><strong>Industry:</strong> {formData.industry}</p>}
                  {formData.use_cases.length > 0 && (
                    <p><strong>Use Cases:</strong> {formData.use_cases.slice(0, 3).join(', ')}{formData.use_cases.length > 3 && '...'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Getting Started</h1>
            <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="p-8">
            {renderStep()}
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 1 && !formData.full_name}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-primary">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};