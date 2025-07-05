import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Clock, MessageSquare, Calendar } from "lucide-react";
import { useScrollAnimation, getAnimationClasses } from "@/hooks/useScrollAnimation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contactInfoRef, isVisible: contactInfoVisible } = useScrollAnimation({ delay: 200 });
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation({ delay: 400 });
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    projectType: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate form submission - you can replace this with actual submission logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent!",
        description: "Thank you for your interest. We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        industry: '',
        projectType: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or call us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCallButton = () => {
    window.open('tel:804-821-1410', '_self');
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef} className={getAnimationClasses(headerVisible, 'fadeUp')}>
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <MessageSquare className="h-4 w-4 mr-2" />
              Get In Touch
            </Badge>
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Ready to Transform Your Business with AI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Let's discuss how custom AI agents can streamline your operations while keeping security at the forefront.
              Book a free discovery call or reach out directly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div ref={contactInfoRef} className={`space-y-8 ${getAnimationClasses(contactInfoVisible, 'slideRight')}`}>
            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Direct Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-primary font-semibold text-lg">804-821-1410</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-muted-foreground">info@ultriumai.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-muted-foreground">Virginia, USA</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-muted-foreground">Mon-Fri: 9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 hover:border-primary/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Why Choose UltriumAI?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>15+ years of IT and cybersecurity experience</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Veteran-owned and operated business</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Security-first approach to AI development</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Custom solutions, not one-size-fits-all</span>
                  </li>
                  <li className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>White-glove setup and ongoing support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div ref={formRef} className={getAnimationClasses(formVisible, 'slideLeft')}>
            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105">
            <CardHeader>
              <CardTitle>Schedule Your Free Discovery Call</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter your first name" 
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter your last name" 
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
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
                    onChange={(e) => handleInputChange('email', e.target.value)}
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
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input 
                    id="company" 
                    placeholder="Enter your company name" 
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
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
                  <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="helpdesk">Helpdesk/Support GPT</SelectItem>
                      <SelectItem value="cybersecurity">Cybersecurity Copilot</SelectItem>
                      <SelectItem value="client-facing">Client-Facing Bot</SelectItem>
                      <SelectItem value="automation">Workflow Automation</SelectItem>
                      <SelectItem value="consultation">General Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Tell us about your project</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe your current challenges and how you'd like AI to help your business..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    <Calendar className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Schedule Discovery Call'}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={handleCallButton}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call 804-821-1410
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;