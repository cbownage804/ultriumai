import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  Building2, 
  Users, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Gift,
  Calendar,
  Download,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadCaptureFormProps {
  source?: string;
  variant?: 'demo' | 'trial' | 'consultation' | 'download';
  title?: string;
  description?: string;
  incentive?: string;
}

const LeadCaptureForm = ({ 
  source = 'website',
  variant = 'demo',
  title,
  description,
  incentive
}: LeadCaptureFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    companySize: '',
    role: '',
    currentSolution: '',
    interests: [] as string[],
    timeline: '',
    challenges: '',
    consentMarketing: false,
    consentPartners: false
  });

  const variants = {
    demo: {
      title: 'Schedule Your Live Demo',
      description: 'See Ultrium\'s solutions in action with a personalized demonstration',
      buttonText: 'Schedule Demo',
      icon: Calendar,
      incentive: 'Free 30-minute consultation included'
    },
    trial: {
      title: 'Start Your Free Trial',
      description: 'Get full access to all features for 14 days - no credit card required',
      buttonText: 'Start Free Trial',
      icon: Gift,
      incentive: 'Setup assistance included'
    },
    consultation: {
      title: 'Get Expert Consultation',
      description: 'Speak with our security experts about your specific needs',
      buttonText: 'Book Consultation',
      icon: Users,
      incentive: 'Free security assessment'
    },
    download: {
      title: 'Download Resources',
      description: 'Get our comprehensive MSP security toolkit and pricing guide',
      buttonText: 'Download Now',
      icon: Download,
      incentive: 'Instant access to all resources'
    }
  };

  const currentVariant = variants[variant];
  const Icon = currentVariant.icon;

  const interests = [
    'Password Management (SafePass)',
    'Email Security (SafeMail)',
    'Document Scanning (SafeDoc)',
    'Network Security (SafeNet)',
    'Dark Web Monitoring',
    'RMM Platform',
    'Helpdesk/Ticketing',
    'SafeAV/Endpoint Protection',
    'SafeEDR Services',
    'Compliance Management'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestChange = (interest: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      interests: checked 
        ? [...prev.interests, interest]
        : prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, you'd send this to your CRM/lead management system
      console.log('Lead captured:', {
        ...formData,
        source,
        variant,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Success!",
        description: variant === 'download' 
          ? "Your download will start shortly. Check your email for additional resources."
          : "We've received your request and will contact you within 24 hours.",
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        companySize: '',
        role: '',
        currentSolution: '',
        interests: [],
        timeline: '',
        challenges: '',
        consentMarketing: false,
        consentPartners: false
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">
          {title || currentVariant.title}
        </CardTitle>
        <CardDescription className="text-lg">
          {description || currentVariant.description}
        </CardDescription>
        {(incentive || currentVariant.incentive) && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            <Star className="h-4 w-4 mr-1" />
            {incentive || currentVariant.incentive}
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="company"
                  className="pl-10"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Your Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Business Owner</SelectItem>
                    <SelectItem value="cto">CTO/Technical Director</SelectItem>
                    <SelectItem value="it-manager">IT Manager</SelectItem>
                    <SelectItem value="security-manager">Security Manager</SelectItem>
                    <SelectItem value="operations">Operations Manager</SelectItem>
                    <SelectItem value="sales">Sales/Account Manager</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-3">
            <Label>Solutions of Interest</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interests.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interest-${interest}`}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={(checked) => 
                      handleInterestChange(interest, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`interest-${interest}`}
                    className="text-sm font-normal"
                  >
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline and Challenges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeline">Implementation Timeline</Label>
              <Select value={formData.timeline} onValueChange={(value) => handleInputChange('timeline', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">ASAP</SelectItem>
                  <SelectItem value="1-3-months">1-3 months</SelectItem>
                  <SelectItem value="3-6-months">3-6 months</SelectItem>
                  <SelectItem value="6-12-months">6-12 months</SelectItem>
                  <SelectItem value="exploring">Just exploring</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSolution">Current Solution</Label>
              <Input
                id="currentSolution"
                value={formData.currentSolution}
                onChange={(e) => handleInputChange('currentSolution', e.target.value)}
                placeholder="e.g., None, Competitor X, Custom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="challenges">Current Challenges (Optional)</Label>
            <Textarea
              id="challenges"
              value={formData.challenges}
              onChange={(e) => handleInputChange('challenges', e.target.value)}
              placeholder="Tell us about your current security challenges or goals..."
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentMarketing"
                checked={formData.consentMarketing}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, consentMarketing: checked as boolean }))
                }
              />
              <Label htmlFor="consentMarketing" className="text-sm">
                I agree to receive marketing communications from Ultrium about products, 
                services, and industry insights. I can unsubscribe at any time.
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentPartners"
                checked={formData.consentPartners}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, consentPartners: checked as boolean }))
                }
              />
              <Label htmlFor="consentPartners" className="text-sm">
                I'm interested in hearing about relevant solutions from Ultrium's trusted partners.
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </div>
            ) : (
              <>
                {currentVariant.buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting this form, you agree to our Terms of Service and Privacy Policy. 
            We respect your privacy and will never share your information with third parties 
            without your consent.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadCaptureForm;