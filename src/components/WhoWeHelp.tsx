import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Users, 
  Zap, 
  Settings,
  ArrowRight,
  CheckCircle,
  Building,
  Car,
  Calculator,
  HardDrive,
  Briefcase,
  Calendar,
  Play
} from "lucide-react";

const WhoWeHelp = () => {
  const industries = [
    {
      icon: HardDrive,
      title: "Internal IT Teams",
      description: "Your smartest new hire is virtual—and security-certified.",
      details: "Automate password resets, guide users through common fixes, and flag risky behavior before it becomes a ticket. Your GPT becomes a frontline assistant and a security-first filter.",
      gradient: "from-blue-50 to-indigo-50"
    },
    {
      icon: Settings,
      title: "IT Service Providers", 
      description: "AI that scales your service desk and strengthens your stack.",
      details: "Handle repetitive tickets, support requests, and client communications while embedding cyber hygiene—like MFA reminders, secure link checks, and access policy reinforcement.",
      gradient: "from-green-50 to-emerald-50"
    },
    {
      icon: Calculator,
      title: "Accounting & CPA Firms",
      description: "Automate with accuracy—without compromising compliance.",
      details: "From tax Q&A to secure client interactions, our GPTs reduce the burden on your staff while staying aligned with data privacy, retention rules, and firm-level security policies.",
      gradient: "from-purple-50 to-violet-50"
    },
    {
      icon: Car,
      title: "Automotive Shops",
      description: "AI at the front desk—minus the security risk.",
      details: "Schedule appointments, answer questions, and confirm services with a GPT that protects customer data and avoids the risks of open inboxes and unfiltered web forms.",
      gradient: "from-orange-50 to-red-50"
    },
    {
      icon: Building,
      title: "Small & Mid-Sized Businesses",
      description: "Big automation meets built-in security.",
      details: "Let a GPT handle onboarding, HR questions, and team support—all while scanning for phishing attempts, reinforcing policies, and keeping your data locked down.",
      gradient: "from-teal-50 to-cyan-50"
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: "Security Comes First",
      description: "We come from IT and cybersecurity—not marketing. Every GPT we build is designed with data protection, access control, and threat awareness baked in."
    },
    {
      icon: Settings,
      title: "Custom-Built, Not Copy-Pasted", 
      description: "We don't recycle templates or offer 'one-size-fits-all' bots. Your GPT is trained on your policies, playbooks, and processes."
    },
    {
      icon: Users,
      title: "Real-World Experience",
      description: "UltriumAI was founded by an IT expert with 15+ years in the field. We've lived the tech headaches and support chaos—and we've built AI to fix it."
    },
    {
      icon: Zap,
      title: "Tangible Results, Fast",
      description: "From reducing helpdesk volume to catching phishing links before they're clicked, our GPTs deliver real ROI—not just a shiny interface."
    },
    {
      icon: CheckCircle,
      title: "White-Glove Setup & Support",
      description: "We handle the build, training, and testing—then stick around to tune and support your GPT as your business grows."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Users className="h-4 w-4 mr-2" />
            Who We Help
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            UltriumAI builds secure, custom GPTs for businesses that need more than just automation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Whether it's IT support, operations, or customer service, our AI tools are designed with cybersecurity at the core.
          </p>
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg font-semibold text-primary mb-2">
              Your next AI assistant should come with security built in.
            </p>
            <p className="text-muted-foreground">
              Let's build one that works for your team—and protects it.
            </p>
          </div>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card key={index} className={`hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br ${industry.gradient} hover:scale-105 card-glow animate-fade-in group`} style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/80 shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-primary group-hover:animate-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-gradient transition-all duration-300">{industry.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-primary font-medium group-hover:text-primary-glow transition-colors duration-300">
                    {industry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {industry.details}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Us Section */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-6">So Why Ultrium AI?</h3>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            There are a lot of AI tools out there—but most are generic, risky, or just plain confusing. 
            At UltriumAI, we do things differently. We build smart, secure, purpose-built GPTs that actually solve business problems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {whyChooseUs.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 text-center hover:scale-105 card-glow animate-fade-in group" style={{animationDelay: `${index * 0.1}s`}}>
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-8 w-8 text-primary group-hover:animate-glow" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-gradient transition-all duration-300">{reason.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                    {reason.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Schedule a quick demo to watch your next support agent or automation assistant come to life—built securely around your workflow.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8">
                  <Calendar className="mr-2 h-5 w-5" />
                  Book a Free Discovery Call
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8">
                  <Play className="mr-2 h-5 w-5" />
                  See Live AI Demos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default WhoWeHelp;