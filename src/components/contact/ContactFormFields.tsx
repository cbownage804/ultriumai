import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ContactFormData } from "@/types/contact";

interface ContactFormFieldsProps {
  formData: ContactFormData;
  onInputChange: (field: keyof ContactFormData, value: string) => void;
  onBusinessTypeChange: (value: string) => void;
}

export const ContactFormFields = ({ 
  formData, 
  onInputChange, 
  onBusinessTypeChange 
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
        <Label htmlFor="company">Company Name</Label>
        <Input 
          id="company" 
          placeholder="Enter your company name" 
          value={formData.company}
          onChange={(e) => onInputChange('company', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Business Type *</Label>
        <RadioGroup 
          value={formData.businessType} 
          onValueChange={onBusinessTypeChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="business" id="business" />
            <Label htmlFor="business">Business</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="service-provider" id="service-provider" />
            <Label htmlFor="service-provider">Service Provider</Label>
          </div>
        </RadioGroup>
      </div>

      {formData.businessType === 'service-provider' && (
        <div className="space-y-2">
          <Label htmlFor="serviceProviderType">Service Provider Type *</Label>
          <Select value={formData.serviceProviderType} onValueChange={(value) => onInputChange('serviceProviderType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select service provider type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="msp">MSP (Managed Service Provider)</SelectItem>
              <SelectItem value="mssp">MSSP (Managed Security Service Provider)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {formData.businessType === 'business' && (
        <div className="space-y-2">
          <Label htmlFor="businessSize">Business Size *</Label>
          <Select value={formData.businessSize} onValueChange={(value) => onInputChange('businessSize', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select business size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small Business</SelectItem>
              <SelectItem value="medium">Medium Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Select value={formData.industry} onValueChange={(value) => onInputChange('industry', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select your industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="it-internal">Internal IT Team</SelectItem>
            <SelectItem value="msp">IT Service Provider/MSP</SelectItem>
            <SelectItem value="accounting">Accounting/CPA Firm</SelectItem>
            <SelectItem value="automotive">Automotive Shop</SelectItem>
            <SelectItem value="smb">Small/Mid-Sized Business</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectType">What are you interested in?</Label>
        <Select value={formData.projectType} onValueChange={(value) => onInputChange('projectType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="helpdesk">SafeDesk/Support GPT</SelectItem>
            <SelectItem value="cybersecurity">Cybersecurity Copilot</SelectItem>
            <SelectItem value="client-facing">Client-Facing Bot</SelectItem>
            <SelectItem value="automation">Workflow Automation</SelectItem>
            <SelectItem value="consultation">General Consultation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Product Type *</Label>
        <RadioGroup 
          value={formData.productType} 
          onValueChange={(value) => onInputChange('productType', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Custom Solution</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="prebuilt" id="prebuilt" />
            <Label htmlFor="prebuilt">Prebuilt Solution</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label>White Labeling *</Label>
        <RadioGroup 
          value={formData.whiteLabeled} 
          onValueChange={(value) => onInputChange('whiteLabeled', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="white-labeled-yes" />
            <Label htmlFor="white-labeled-yes">Yes, I want it white-labeled</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="white-labeled-no" />
            <Label htmlFor="white-labeled-no">No, UltriumAI branding is fine</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Tell us about your project</Label>
        <Textarea 
          id="message" 
          placeholder="Describe your current challenges and how you'd like AI to help your business..."
          rows={4}
          value={formData.message}
          onChange={(e) => onInputChange('message', e.target.value)}
        />
      </div>
    </>
  );
};