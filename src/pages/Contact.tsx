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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#0f0f12] overflow-hidden">
      <Navigation />
      
      {/* Hero Section - Premium glassmorphism design */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 relative overflow-hidden safe-area-inset-top">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-primary/10 rounded-full blur-[100px] md:blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-cyan-500/10 rounded-full blur-[60px] md:blur-[80px] animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute top-1/4 left-0 w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-emerald-500/5 rounded-full blur-[50px] animate-[pulse_5s_ease-in-out_infinite]" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        
        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/5 rounded-full border border-white/10 mb-6 md:mb-8 animate-fade-in backdrop-blur-sm group hover:border-primary/40 hover:bg-white/10 transition-all cursor-default">
            <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs md:text-sm font-medium text-white/70 group-hover:text-white transition-colors">We're here to help</span>
          </div>
          <h1 className="text-fluid-xl md:text-fluid-hero font-bold mb-4 md:mb-6 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent animate-fade-in-up">
            Let's Talk
          </h1>
          <p className="text-base md:text-xl text-white/50 max-w-xl mx-auto leading-relaxed animate-fade-in-up stagger-1">
            Have a project in mind? Need enterprise support? We're here to help you succeed.
          </p>
        </div>
      </section>

      {/* Main Content - Mobile responsive grid */}
      <section className="py-12 md:py-20 px-4 safe-area-inset-bottom">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8 md:gap-12">
            
            {/* Contact Form - Takes 3 columns */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <Card className="bg-gradient-to-br from-[#141414] to-[#1a1a1f] border-white/10 shadow-2xl shadow-black/20 hover:border-primary/20 transition-all duration-500 group/card">
                <CardContent className="p-5 md:p-8 lg:p-10 relative overflow-hidden">
                  {/* Subtle gradient glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25 group-hover/card:shadow-primary/40 transition-shadow">
                      <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Send a Message</h2>
                  </div>
                  <p className="text-sm md:text-base text-white/50 mb-6 md:mb-10 ml-12 md:ml-13 relative z-10">We typically respond within 24 hours</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="name" className="text-sm text-white/80">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="John Smith"
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 md:h-10 text-base md:text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="email" className="text-sm text-white/80">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@company.com"
                          required
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 md:h-10 text-base md:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="company" className="text-sm text-white/80">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Acme Corporation"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 md:h-10 text-base md:text-sm"
                        />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="inquiryType" className="text-sm text-white/80">I'm interested in...</Label>
                        <Select value={formData.inquiryType} onValueChange={(value) => setFormData(prev => ({ ...prev, inquiryType: value }))}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 md:h-10 text-base md:text-sm">
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

                    <div className="space-y-1.5 md:space-y-2">
                      <Label htmlFor="subject" className="text-sm text-white/80">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="How can we help you?"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 md:h-10 text-base md:text-sm"
                      />
                    </div>

                    <div className="space-y-1.5 md:space-y-2">
                      <Label htmlFor="message" className="text-sm text-white/80">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us about your project or question..."
                        rows={5}
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-base md:text-sm"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 h-12 md:h-11 text-base touch-target"
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
            <div className="lg:col-span-2 space-y-4 md:space-y-6 order-1 lg:order-2">
              {/* Quick Contact */}
              <Card className="bg-[#141414] border-white/10">
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <h3 className="text-base md:text-lg font-semibold text-white">Quick Contact</h3>

                  <a href="mailto:support@ultriumai.com" className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group touch-target">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Mail className="h-4 w-4 md:h-5 md:w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base text-white font-medium group-hover:text-cyan-400 transition-colors">support@ultriumai.com</p>
                      <p className="text-xs md:text-sm text-white/50">Email support</p>
                    </div>
                  </a>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="bg-gradient-to-br from-primary/20 to-cyan-500/10 border-primary/30">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <Building className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <h3 className="text-base md:text-lg font-semibold text-white">Enterprise Solutions</h3>
                  </div>
                  <p className="text-xs md:text-sm text-white/60 mb-3 md:mb-4">
                    Need a custom solution for your organization? Let's schedule a call.
                  </p>
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 h-11 md:h-10 touch-target" asChild>
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
