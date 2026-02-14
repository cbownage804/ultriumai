import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContactFormData, INITIAL_FORM_DATA, PRODUCTS } from "@/types/contact";
import { devLog } from "@/lib/logger";

export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    ...INITIAL_FORM_DATA,
    _formLoadedAt: Date.now()
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleContactTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      contactType: value,
      company: value === 'individual' ? '' : prev.company,
      businessSize: value === 'individual' ? '' : prev.businessSize,
    }));
  };

  const handleProductInterestChange = (productId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productInterests: checked 
        ? [...prev.productInterests, productId]
        : prev.productInterests.filter(id => id !== productId)
    }));
  };

  const handleSelectAllProducts = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productInterests: checked ? PRODUCTS.map(p => p.id) : []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-form', {
        body: formData
      });

      if (error) {
        throw error;
      }

      devLog.log('Contact form submitted successfully:', data);
      
      toast({
        title: "Message Sent!",
        description: "Thank you for your interest. We'll get back to you within 24 hours.",
      });
      
      setFormData({
        ...INITIAL_FORM_DATA,
        _formLoadedAt: Date.now()
      });
    } catch (error: any) {
      if (error?.message?.includes('Too many submissions')) {
        toast({
          title: "Please slow down",
          description: "Too many submissions. Please wait a few minutes before trying again.",
          variant: "destructive",
        });
      } else {
        console.error('Error submitting contact form:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again or call us directly.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallButton = () => {
    window.open('tel:888-884-1410', '_self');
  };

  return {
    formData,
    isSubmitting,
    handleInputChange,
    handleContactTypeChange,
    handleProductInterestChange,
    handleSelectAllProducts,
    handleSubmit,
    handleCallButton
  };
};
