import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mail } from "lucide-react";

interface ContactInfoProps {
  isVisible: boolean;
  animationClasses: string;
}

export const ContactInfo = ({ isVisible, animationClasses }: ContactInfoProps) => {
  return (
    <div className={`space-y-8 ${animationClasses}`}>
      <Card className="hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Us
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200" itemScope itemType="https://schema.org/ContactPoint">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Email</p>
              <p className="text-primary font-semibold text-lg" itemProp="email">support@ultriumai.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200" itemScope itemType="https://schema.org/PostalAddress">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground"><span itemProp="addressRegion">Virginia</span>, <span itemProp="addressCountry">USA</span></p>
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
  );
};