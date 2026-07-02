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
              <p className="text-primary font-semibold text-lg" itemProp="email">support@wrayth.com</p>
            </div>
          </div>
          <div className="flex items-start gap-3 hover:bg-muted/30 p-2 rounded-lg transition-colors duration-200" itemScope itemType="https://schema.org/PostalAddress">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">
                Headquartered in <span itemProp="addressRegion">Virginia</span>, <span itemProp="addressCountry">USA</span>
              </p>
              <p className="text-muted-foreground text-sm">Serving customers worldwide</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 hover:shadow-xl hover:-translate-y-2 transition-all duration-200 hover:scale-105 hover:border-primary/30">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Why Choose Wrayth?</h3>
          <ul className="space-y-2 text-sm">
            {[
              'Zero-knowledge encrypted password vault',
              'AI-powered security teammate (Ray)',
              'Continuous breach monitoring',
              'Phishing, malware and URL analysis',
              'Enterprise-ready architecture',
              'Privacy-first security platform',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 hover:text-foreground transition-colors duration-200">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
