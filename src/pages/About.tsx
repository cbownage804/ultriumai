import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Shield, Users, Award, TrendingUp, Globe, Heart,
  Target, Lightbulb, Zap, Brain, Eye, Lock,
  Building, Clock, Star, ArrowRight, CheckCircle
} from 'lucide-react';

const About = () => {
  const stats = [
    { label: "Businesses Protected", value: "50,000+", icon: Shield },
    { label: "Threats Detected", value: "10M+", icon: Eye },
    { label: "Countries Served", value: "150+", icon: Globe },
    { label: "Uptime Guarantee", value: "99.9%", icon: Clock }
  ];

  const values = [
    {
      icon: Shield,
      title: "Security First",
      description: "Every decision we make prioritizes the security and privacy of our customers' data and operations."
    },
    {
      icon: Brain,
      title: "AI Innovation",
      description: "We leverage cutting-edge artificial intelligence to stay ahead of evolving cyber threats."
    },
    {
      icon: Users,
      title: "Customer Success",
      description: "Our customers' success drives everything we do, from product development to support."
    },
    {
      icon: Heart,
      title: "Transparency",
      description: "We believe in open communication and transparent practices in all our business relationships."
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former CISO at Fortune 500 companies with 15+ years in cybersecurity",
      expertise: ["Strategic Leadership", "Enterprise Security", "Risk Management"]
    },
    {
      name: "Marcus Rodriguez",
      role: "CTO & Co-Founder",
      bio: "AI/ML expert and former security researcher with 20+ patents",
      expertise: ["AI Development", "Security Research", "Platform Architecture"]
    },
    {
      name: "Dr. Emily Watson",
      role: "Chief Security Officer",
      bio: "PhD in Computer Security, former NSA cybersecurity analyst",
      expertise: ["Threat Intelligence", "Incident Response", "Compliance"]
    },
    {
      name: "James Kim",
      role: "VP of Engineering",
      bio: "Former lead engineer at major cloud security platforms",
      expertise: ["Scalable Systems", "DevSecOps", "Cloud Security"]
    }
  ];

  const milestones = [
    {
      year: "2021",
      title: "Company Founded",
      description: "UltriumAI was founded with a vision to democratize enterprise-grade cybersecurity",
      icon: Lightbulb
    },
    {
      year: "2022",
      title: "First AI Model",
      description: "Launched our first AI-powered threat detection engine",
      icon: Brain
    },
    {
      year: "2023",
      title: "Platform Launch",
      description: "Released the unified UltriumAI security platform",
      icon: Zap
    },
    {
      year: "2024",
      title: "Global Expansion",
      description: "Expanded to serve customers across 150+ countries worldwide",
      icon: Globe
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-6" variant="secondary">
            About UltriumAI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Securing the Future with 
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {" "}AI Innovation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're on a mission to make enterprise-grade cybersecurity accessible to businesses of all sizes 
            through the power of artificial intelligence and innovative platform design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Join Our Mission <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contact Leadership
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                To democratize enterprise-grade cybersecurity by making advanced AI-powered security 
                tools accessible, affordable, and easy to use for businesses of all sizes.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Reduce the cybersecurity skills gap</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Provide 24/7 AI-powered protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Simplify complex security operations</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-lg text-muted-foreground mb-6">
                A world where every business, regardless of size or technical expertise, has access 
                to world-class cybersecurity protection powered by artificial intelligence.
              </p>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <Target className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">2030 Goal</h3>
                  <p className="text-sm text-muted-foreground">
                    Protect 1 million businesses worldwide with our AI-powered security platform
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide every decision we make and every product we build
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center h-full">
                <CardHeader>
                  <value.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Leadership Team</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Meet the experienced leaders driving innovation in cybersecurity and AI
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-center">{member.name}</CardTitle>
                  <CardDescription className="text-center">{member.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Expertise:</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.expertise.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Key milestones in building the future of cybersecurity
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {milestones.map((milestone, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <milestone.icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{milestone.year}</Badge>
                  </div>
                  <CardTitle className="text-lg">{milestone.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be part of the cybersecurity revolution. Whether you're looking to protect your business 
            or join our team, we'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Start Your Security Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/careers">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Open Positions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;