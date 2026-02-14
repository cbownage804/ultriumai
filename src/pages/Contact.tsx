import { useScrollAnimation, getAnimationClasses } from "@/hooks/useScrollAnimation";
import { useContactForm } from "@/hooks/useContactForm";
import { ContactHeader } from "@/components/contact/ContactHeader";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { ContactFormFields } from "@/components/contact/ContactFormFields";
import { ProductInterests } from "@/components/contact/ProductInterests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Contact = () => {
  const { ref, isVisible } = useScrollAnimation();
  const animationClasses = getAnimationClasses(isVisible);
  const {
    formData,
    isSubmitting,
    handleInputChange,
    handleContactTypeChange,
    handleProductInterestChange,
    handleSelectAllProducts,
    handleSubmit,
    
  } = useContactForm();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16">
        <section ref={ref} className="container mx-auto px-4 max-w-6xl">
          <ContactHeader isVisible={isVisible} animationClasses={animationClasses} />
          
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${animationClasses}`}>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <ContactFormFields
                      formData={formData}
                      onInputChange={handleInputChange}
                      onContactTypeChange={handleContactTypeChange}
                    />
                    
                    <ProductInterests
                      selectedProducts={formData.productInterests}
                      onProductChange={handleProductInterestChange}
                      onSelectAll={handleSelectAllProducts}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <ContactInfo isVisible={isVisible} animationClasses={animationClasses} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
