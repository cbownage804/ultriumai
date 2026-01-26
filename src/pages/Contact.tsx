import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Mail, Phone, Send, MessageSquare, Building, ArrowRight, Clock
} from 'lucide-react';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use edge function to send email (bypasses RLS and sends to info@ultriumai.com)
      const { error } = await supabase.functions.invoke('send-contact-form', {
        body: {
          firstName: formData.name.split(' ')[0] || formData.name,
          lastName: formData.name.split(' ').slice(1).join(' ') || '',
          email: formData.email,
          phone: formData.phone || '',
          company: formData.company || '',
          businessType: 'business',
          serviceProviderType: '',
          businessSize: '',
          industry: '',
          projectType: formData.inquiryType || 'general',
          productType: 'prebuilt',
          whiteLabeled: 'no',
          message: formData.message,
          productInterests: formData.inquiryType ? [formData.inquiryType] : []
        }
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours.",
      });

      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: ''
      });
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "Sorry, there was an error. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Let's Talk
          </h1>
          <p className="text-xl text-white/60 max-w-xl mx-auto">
            Have a project in mind? Need enterprise support? We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-12">
            
            {/* Contact Form - Takes 3 columns */}
            <div className="lg:col-span-3">
              <Card className="bg-[#141414] border-white/10">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Send a Message</h2>
                  <p className="text-white/50 mb-8">We typically respond within 24 hours</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-white/80">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Smith"
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/80">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@company.com"
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-white/80">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Acme Corporation"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiryType" className="text-white/80">I'm interested in...</Label>
                        <Select value={formData.inquiryType} onValueChange={(value) => setFormData(prev => ({ ...prev, inquiryType: value }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai-studio">AI Studio</SelectItem>
                            <SelectItem value="safesuite">SafeSuite</SelectItem>
                            <SelectItem value="vanguard">Vanguard (Enterprise)</SelectItem>
                            <SelectItem value="custom">Custom AI Development</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white/80">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="How can we help you?"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white/80">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your project or question..."
                        rows={5}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Contact */}
              <Card className="bg-[#141414] border-white/10">
                <CardContent className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-white">Quick Contact</h3>

                  <a href="mailto:support@ultriumai.com" className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                    <div className="h-12 w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">support@ultriumai.com</p>
                      <p className="text-sm text-white/50">Email support</p>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="bg-gradient-to-br from-primary/20 to-cyan-500/10 border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-white">Enterprise Solutions</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">
                    Need a custom solution for your organization? Let's schedule a call.
                  </p>
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" asChild>
                    <a href="mailto:enterprise@ultriumai.com">
                      Contact Enterprise Sales
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
