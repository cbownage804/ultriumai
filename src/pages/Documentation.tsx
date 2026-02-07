import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Book, ExternalLink, FileText, Shield, 
  Code, Settings, Users, Zap, ArrowRight, ChevronRight,
  Download, Play, Sparkles, BookOpen, Layers, Terminal,
  Globe, Lock, Server, Puzzle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTime: string;
  lastUpdated: string;
  icon: React.ReactNode;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const }
  })
};

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const docSections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Complete guide to setting up your platform and configuring your first protective measures.',
      category: 'Getting Started',
      difficulty: 'beginner',
      readTime: '10 min',
      lastUpdated: '2025-01-15',
      icon: <Zap className="h-5 w-5" />
    },
    {
      id: 'vanguard-setup',
      title: 'Vanguard Platform Setup',
      description: 'Step-by-step configuration of the Vanguard RMM & security monitoring platform.',
      category: 'Vanguard',
      difficulty: 'intermediate',
      readTime: '15 min',
      lastUpdated: '2025-01-14',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'cortex-ai-guide',
      title: 'Cortex AI Assistant Guide',
      description: 'Comprehensive guide to using the Cortex AI assistant for security analysis and automation.',
      category: 'AI',
      difficulty: 'beginner',
      readTime: '8 min',
      lastUpdated: '2025-01-13',
      icon: <Sparkles className="h-5 w-5" />
    },
    {
      id: 'api-documentation',
      title: 'API Reference',
      description: 'Complete API documentation with endpoints, authentication, and code examples.',
      category: 'API',
      difficulty: 'advanced',
      readTime: '25 min',
      lastUpdated: '2025-01-12',
      icon: <Terminal className="h-5 w-5" />
    },
    {
      id: 'msp-deployment',
      title: 'MSP Multi-Tenant Deployment',
      description: 'Guide for Managed Service Providers to deploy across multiple client environments.',
      category: 'MSP',
      difficulty: 'advanced',
      readTime: '20 min',
      lastUpdated: '2025-01-11',
      icon: <Server className="h-5 w-5" />
    },
    {
      id: 'security-policies',
      title: 'Security Policies & Compliance',
      description: 'Configure security policies and compliance frameworks including GDPR, HIPAA, and SOC 2.',
      category: 'Compliance',
      difficulty: 'intermediate',
      readTime: '18 min',
      lastUpdated: '2025-01-10',
      icon: <Lock className="h-5 w-5" />
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Common Issues',
      description: 'Solutions to common problems and frequently asked questions about the platform.',
      category: 'Support',
      difficulty: 'beginner',
      readTime: '12 min',
      lastUpdated: '2025-01-09',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'integration-guide',
      title: 'Third-Party Integrations',
      description: 'Connect with popular tools like Slack, Microsoft Teams, ServiceNow, and more.',
      category: 'Integrations',
      difficulty: 'intermediate',
      readTime: '22 min',
      lastUpdated: '2025-01-08',
      icon: <Puzzle className="h-5 w-5" />
    }
  ];

  const categories = ['all', 'Getting Started', 'Vanguard', 'AI', 'API', 'MSP', 'Compliance', 'Support', 'Integrations'];

  const filteredSections = docSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'intermediate': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'advanced': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const quickStartGuides = [
    {
      title: '5-Minute Setup',
      description: 'Get basic protection running fast',
      icon: <Zap className="h-5 w-5" />,
      link: '/docs/quick-setup',
      gradient: 'from-cyan-500/20 to-blue-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400'
    },
    {
      title: 'API Authentication',
      description: 'Authenticate with platform APIs',
      icon: <Code className="h-5 w-5" />,
      link: '/docs/api-auth',
      gradient: 'from-violet-500/20 to-purple-500/20',
      iconBg: 'bg-violet-500/10 text-violet-400'
    },
    {
      title: 'First Security Scan',
      description: 'Run your first comprehensive scan',
      icon: <Shield className="h-5 w-5" />,
      link: '/docs/first-scan',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-400'
    },
    {
      title: 'Team Collaboration',
      description: 'Set up team access and roles',
      icon: <Users className="h-5 w-5" />,
      link: '/docs/team-setup',
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400'
    }
  ];

  const resources = [
    {
      title: 'API Reference',
      description: 'Complete API documentation with interactive examples and code snippets',
      icon: <Terminal className="h-6 w-6" />,
      link: '/docs/api',
      cta: 'Explore API',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'SDKs & Tools',
      description: 'Download SDKs, CLI tools, and integration packages for all platforms',
      icon: <Download className="h-6 w-6" />,
      link: '/docs/downloads',
      cta: 'Browse Downloads',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides, webinars, and live demo recordings',
      icon: <Play className="h-6 w-6" />,
      link: '/docs/videos',
      cta: 'Watch Videos',
      gradient: 'from-emerald-500 to-teal-500'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050a0a]">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Hero */}
      <div className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 pt-16 pb-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm font-medium mb-6">
              <BookOpen className="h-4 w-4" />
              Documentation Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Build with{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                confidence
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10">
              Comprehensive guides, API references, and tutorials to help you deploy and manage your security infrastructure.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <Input
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 text-base bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-cyan-500/50 focus:ring-cyan-500/20"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative">
        {/* Quick Start */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/30 to-transparent" />
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-cyan-400" />
              Quick Start
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/30 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartGuides.map((guide, i) => (
              <motion.div key={i} custom={i + 1} variants={fadeUp}>
                <Link to={guide.link} className="group block">
                  <div className={cn(
                    "relative rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300",
                    "hover:border-white/10 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-black/20",
                    "hover:-translate-y-0.5"
                  )}>
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, ${guide.gradient.includes('cyan') ? 'rgba(6,182,212,0.05)' : guide.gradient.includes('violet') ? 'rgba(139,92,246,0.05)' : guide.gradient.includes('emerald') ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.05)'}, transparent)` }} />
                    <div className="relative">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", guide.iconBg)}>
                        {guide.icon}
                      </div>
                      <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">{guide.title}</h3>
                      <p className="text-sm text-white/40">{guide.description}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-cyan-400/70 group-hover:text-cyan-400 transition-colors">
                        Start Guide <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border",
                selectedCategory === category
                  ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                  : "bg-white/[0.02] text-white/40 border-white/5 hover:text-white/60 hover:border-white/10"
              )}
            >
              {category === 'all' ? 'All Docs' : category}
            </button>
          ))}
        </div>

        {/* Documentation Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-20"
        >
          {filteredSections.map((section, i) => (
            <motion.div key={section.id} custom={i} variants={fadeUp}>
              <Link to={`/docs/${section.id}`} className="group block">
                <div className="relative rounded-xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/40 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-all shrink-0">
                      {section.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-[10px] uppercase tracking-wider font-semibold border", getDifficultyStyles(section.difficulty))}>
                          {section.difficulty}
                        </Badge>
                        <span className="text-xs text-white/20">{section.readTime} read</span>
                      </div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors mb-1">
                        {section.title}
                      </h3>
                      <p className="text-sm text-white/35 line-clamp-2">
                        {section.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px] bg-white/5 text-white/30 border-white/5">
                          {section.category}
                        </Badge>
                        <span className="text-xs text-cyan-400/60 flex items-center gap-1 group-hover:text-cyan-400 transition-colors">
                          Read <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {filteredSections.length === 0 && (
          <div className="text-center py-20">
            <Search className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 mb-4">No documentation found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="border-white/10 text-white/50 hover:text-white hover:border-white/20"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Resources */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.div custom={0} variants={fadeUp} className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-violet-500/30 to-transparent" />
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-violet-400" />
              Resources
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-violet-500/30 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, i) => (
              <motion.div key={i} custom={i + 1} variants={fadeUp}>
                <Link to={resource.link} className="group block h-full">
                  <div className="relative rounded-xl border border-white/5 bg-white/[0.02] p-6 h-full transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04] hover:-translate-y-0.5 overflow-hidden">
                    <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br", resource.gradient)} />
                    <div className="relative">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br text-white", resource.gradient)}>
                        {resource.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                      <p className="text-sm text-white/35 mb-4">{resource.description}</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400/70 group-hover:text-cyan-400 transition-colors">
                        {resource.cta} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative rounded-2xl border border-white/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-cyan-500/5" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08),transparent_70%)]" />
            <div className="relative px-8 py-14 text-center">
              <Globe className="h-10 w-10 text-cyan-400/50 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-3">Need Additional Help?</h3>
              <p className="text-white/40 mb-8 max-w-lg mx-auto">
                Our engineering team is ready to help you implement the perfect solution for your environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8">
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/10 text-white/60 hover:text-white hover:border-white/20">
                  <Link to="/demos">Schedule Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Documentation;
