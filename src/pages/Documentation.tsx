import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Book, ExternalLink, FileText, Shield, 
  Code, Settings, Users, Zap, ArrowRight, ChevronRight,
  Download, Play, Copy, CheckCircle
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: string;
  lastUpdated: string;
}

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started with UltriumAI',
      description: 'Complete guide to setting up your UltriumAI security platform and configuring your first protective measures.',
      category: 'Getting Started',
      difficulty: 'beginner',
      readTime: '10 min',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'safeshield-setup',
      title: 'SafeShield Platform Setup',
      description: 'Step-by-step configuration of the SafeShield security monitoring platform for maximum protection.',
      category: 'SafeShield',
      difficulty: 'intermediate',
      readTime: '15 min',
      lastUpdated: '2024-01-14'
    },
    {
      id: 'ultriumgpt-guide',
      title: 'UltriumGPT AI Assistant Guide',
      description: 'Comprehensive guide to using the UltriumGPT AI assistant for security analysis and automation.',
      category: 'UltriumGPT',
      difficulty: 'beginner',
      readTime: '8 min',
      lastUpdated: '2024-01-13'
    },
    {
      id: 'api-documentation',
      title: 'UltriumAI API Reference',
      description: 'Complete API documentation with endpoints, authentication, and code examples.',
      category: 'API',
      difficulty: 'advanced',
      readTime: '25 min',
      lastUpdated: '2024-01-12'
    },
    {
      id: 'msp-deployment',
      title: 'MSP Multi-Tenant Deployment',
      description: 'Guide for Managed Service Providers to deploy UltriumAI across multiple client environments.',
      category: 'MSP',
      difficulty: 'advanced',
      readTime: '20 min',
      lastUpdated: '2024-01-11'
    },
    {
      id: 'security-policies',
      title: 'Security Policies & Compliance',
      description: 'Configure security policies and compliance frameworks including GDPR, HIPAA, and SOC 2.',
      category: 'Compliance',
      difficulty: 'intermediate',
      readTime: '18 min',
      lastUpdated: '2024-01-10'
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Common Issues',
      description: 'Solutions to common problems and frequently asked questions about UltriumAI platform.',
      category: 'Support',
      difficulty: 'beginner',
      readTime: '12 min',
      lastUpdated: '2024-01-09'
    },
    {
      id: 'integration-guide',
      title: 'Third-Party Integrations',
      description: 'Connect UltriumAI with popular tools like Slack, Microsoft Teams, ServiceNow, and more.',
      category: 'Integrations',
      difficulty: 'intermediate',
      readTime: '22 min',
      lastUpdated: '2024-01-08'
    }
  ];

  const categories = ['all', 'Getting Started', 'SafeShield', 'UltriumGPT', 'API', 'MSP', 'Compliance', 'Support', 'Integrations'];

  const filteredSections = docSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success border-success/20';
      case 'intermediate': return 'bg-warning/10 text-warning border-warning/20';
      case 'advanced': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const quickStartGuides = [
    {
      title: '5-Minute Security Setup',
      description: 'Get basic protection running in 5 minutes',
      icon: <Zap className="h-5 w-5" />,
      link: '/docs/quick-setup'
    },
    {
      title: 'API Authentication',
      description: 'Authenticate with UltriumAI APIs',
      icon: <Code className="h-5 w-5" />,
      link: '/docs/api-auth'
    },
    {
      title: 'First Security Scan',
      description: 'Run your first comprehensive security scan',
      icon: <Shield className="h-5 w-5" />,
      link: '/docs/first-scan'
    },
    {
      title: 'Team Collaboration',
      description: 'Set up team access and collaboration',
      icon: <Users className="h-5 w-5" />,
      link: '/docs/team-setup'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">UltriumAI Documentation</h1>
                <p className="text-sm text-muted-foreground">Complete guides and API reference</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to secure your digital infrastructure
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive documentation, guides, and API references to help you get the most out of UltriumAI
          </p>
        </div>

        {/* Quick Start Guides */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6">Quick Start Guides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartGuides.map((guide, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {guide.icon}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">5 min</span>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {guide.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto text-sm" asChild>
                    <Link to={guide.link}>
                      Start Guide <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSections.map((section) => (
            <Card key={section.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={getDifficultyColor(section.difficulty)}>
                    {section.difficulty}
                  </Badge>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{section.readTime}</span>
                    <span>Updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {section.title}
                </CardTitle>
                <CardDescription>
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {section.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    asChild
                  >
                    <Link to={`/docs/${section.id}`}>
                      Read Guide <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No documentation found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Additional Resources */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                API Reference
              </CardTitle>
              <CardDescription>
                Complete API documentation with interactive examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/docs/api">
                  View API Docs <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                SDKs & Tools
              </CardTitle>
              <CardDescription>
                Download SDKs, CLI tools, and integration packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/docs/downloads">
                  Browse Downloads
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Video Tutorials
              </CardTitle>
              <CardDescription>
                Step-by-step video guides and webinar recordings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="outline">
                <Link to="/docs/videos">
                  Watch Videos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Need Additional Help?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our security experts are here to help you implement the perfect cybersecurity solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/contact">
                  Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/demos">
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;