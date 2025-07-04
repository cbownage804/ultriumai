import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using UltriumGPT ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
                <p>
                  UltriumGPT is a platform that allows users to create, customize, and deploy AI-powered chatbots and assistants. Our service includes:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Custom GPT creation and management tools</li>
                  <li>Knowledge base integration</li>
                  <li>Analytics and monitoring dashboards</li>
                  <li>API access and embedding capabilities</li>
                  <li>Team collaboration features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
                <p>
                  You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Provide accurate and complete information when creating an account</li>
                  <li>Maintain the security of your login credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Use the service in compliance with all applicable laws</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
                <p>You agree not to use the service to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Generate harmful, abusive, or illegal content</li>
                  <li>Violate any person's intellectual property rights</li>
                  <li>Attempt to reverse engineer our systems</li>
                  <li>Share offensive, discriminatory, or misleading content</li>
                  <li>Use the service for any unauthorized commercial purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Subscription and Billing</h2>
                <p>
                  Paid subscriptions are billed in advance on a monthly or yearly basis. Subscriptions automatically renew unless cancelled. 
                  You may cancel your subscription at any time through your account settings.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Data and Privacy</h2>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                  We use industry-standard security measures to protect your data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Intellectual Property</h2>
                <p>
                  The service and all content, features, and functionality are owned by UltriumAI and are protected by copyright, trademark, and other laws.
                  You retain ownership of content you create using our service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
                <p>
                  In no event shall UltriumAI be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
                  Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="ml-4">
                  <p>Email: legal@ultriumai.com</p>
                  <p>Phone: (804) 821-1410</p>
                  <p>Address: UltriumAI, Inc.</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;