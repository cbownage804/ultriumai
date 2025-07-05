import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContactFormData, INITIAL_FORM_DATA, PRODUCTS } from "@/types/contact";

export const useContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      businessType: value,
      // Clear conditional fields when switching business type
      serviceProviderType: '',
      businessSize: ''
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

      console.log('Contact form submitted successfully:', data);
      
      toast({
        title: "Message Sent!",
        description: "Thank you for your interest. We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData(INITIAL_FORM_DATA);
    } catch (error) {
      console.error('Error submitting contact form:', error);
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

  return {
    formData,
    isSubmitting,
    handleInputChange,
    handleBusinessTypeChange,
    handleProductInterestChange,
    handleSelectAllProducts,
    handleSubmit,
    handleCallButton
  };
};