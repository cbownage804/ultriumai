import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Phone } from "lucide-react";
import { useScrollAnimation, getAnimationClasses } from "@/hooks/useScrollAnimation";
import { useContactForm } from "@/hooks/useContactForm";
import { ContactHeader } from "@/components/contact/ContactHeader";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { ContactFormFields } from "@/components/contact/ContactFormFields";
import { ProductInterests } from "@/components/contact/ProductInterests";

const ContactSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contactInfoRef, isVisible: contactInfoVisible } = useScrollAnimation({ delay: 200 });
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation({ delay: 400 });
  
  const {
    formData,
    isSubmitting,
    handleInputChange,
    handleBusinessTypeChange,
    handleProductInterestChange,
    handleSelectAllProducts,
    handleSubmit,
    handleCallButton
  } = useContactForm();

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={headerRef}>
          <ContactHeader 
            isVisible={headerVisible}
            animationClasses={getAnimationClasses(headerVisible, 'fadeUp')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div ref={contactInfoRef}>
            <ContactInfo 
              isVisible={contactInfoVisible}
              animationClasses={getAnimationClasses(contactInfoVisible, 'slideRight')}
            />
          </div>

          {/* Contact Form */}
          <div ref={formRef} className={getAnimationClasses(formVisible, 'slideLeft')}>
            <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105">
              <CardHeader>
                <CardTitle>Schedule Your Free Discovery Call</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <ContactFormFields
                    formData={formData}
                    onInputChange={handleInputChange}
                    onBusinessTypeChange={handleBusinessTypeChange}
                  />

                  <ProductInterests
                    selectedProducts={formData.productInterests}
                    onProductChange={handleProductInterestChange}
                    onSelectAll={handleSelectAllProducts}
                  />

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