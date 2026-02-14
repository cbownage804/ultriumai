import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ContactFormData } from "@/types/contact";

interface ContactFormFieldsProps {
  formData: ContactFormData;
  onInputChange: (field: keyof ContactFormData, value: string) => void;
  onContactTypeChange: (value: string) => void;
}

export const ContactFormFields = ({ 
  formData, 
  onInputChange, 
  onContactTypeChange 
}: ContactFormFieldsProps) => {
  return (
    <>
      {/* Honeypot field - hidden from users, bots will fill it */}
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px',
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        <label htmlFor="website_url">Website</label>
        <input
          type="text"
          id="website_url"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          value={formData._honeypot || ''}
          onChange={(e) => onInputChange('_honeypot', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input 
            id="firstName" 
            placeholder="Enter your first name" 
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input 
            id="lastName" 
            placeholder="Enter your last name" 
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="Enter your email address" 
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          type="tel" 
          placeholder="Enter your phone number" 
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>I am a... *</Label>
        <RadioGroup 
          value={formData.contactType} 
          onValueChange={onContactTypeChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual">Individual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="business" id="business" />
            <Label htmlFor="business">Business / Organization</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="msp" id="msp" />
            <Label htmlFor="msp">MSP / IT Service Provider</Label>
          </div>
        </RadioGroup>
      </div>

      {(formData.contactType === 'business' || formData.contactType === 'msp') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input 
              id="company" 
              placeholder="Enter your company name" 
              value={formData.company}
              onChange={(e) => onInputChange('company', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessSize">Company Size</Label>
            <Select value={formData.businessSize} onValueChange={(value) => onInputChange('businessSize', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10 employees</SelectItem>
                <SelectItem value="11-50">11–50 employees</SelectItem>
                <SelectItem value="51-200">51–200 employees</SelectItem>
                <SelectItem value="201-500">201–500 employees</SelectItem>
                <SelectItem value="500+">500+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select value={formData.industry} onValueChange={(value) => onInputChange('industry', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology / IT</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="finance">Finance / Banking</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="retail">Retail / E-commerce</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="accounting">Accounting / CPA</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectType">What are you interested in?</Label>
        <Select value={formData.projectType} onValueChange={(value) => onInputChange('projectType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="demo">Product Demo</SelectItem>
            <SelectItem value="pricing">Pricing Information</SelectItem>
            <SelectItem value="partnership">Partnership Inquiry</SelectItem>
            <SelectItem value="support">Technical Support</SelectItem>
            <SelectItem value="custom-dev">Custom App Development</SelectItem>
            <SelectItem value="general">General Inquiry</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Tell us about your needs</Label>
        <Textarea 
          id="message" 
          placeholder="Describe what you're looking for and how we can help..."
          rows={4}
          value={formData.message}
          onChange={(e) => onInputChange('message', e.target.value)}
        />
      </div>
    </>
  );
};
