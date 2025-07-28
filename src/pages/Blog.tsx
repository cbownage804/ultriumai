import { useState } from 'react';
import Footer from "@/components/Footer";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ArrowRight, User, Search } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of AI-Powered Cybersecurity: UltriumGPT Revolution',
      excerpt: 'Discover how artificial intelligence is transforming cybersecurity with advanced threat detection, automated responses, and predictive analytics that can identify threats before they strike.',
      author: 'Dr. Sarah Chen',
      publishDate: '2024-01-15',
      readTime: '8 min read',
      category: 'AI Security',
      featured: true
    },
    {
      id: '2',
      title: 'MSP Security Best Practices: Protecting Your Clients in 2024',
      excerpt: 'Essential strategies for Managed Service Providers to deliver comprehensive cybersecurity solutions to their clients while maintaining profitability and scalability.',
      author: 'Michael Rodriguez',
      publishDate: '2024-01-12',
      readTime: '6 min read',
      category: 'MSP Strategy'
    },
    {
      id: '3',
      title: 'Zero Trust Architecture: Building Impenetrable Digital Fortresses',
      excerpt: 'Learn how to implement Zero Trust security models with UltriumAI platform for maximum protection in an increasingly connected world.',
      author: 'Alex Thompson',
      publishDate: '2024-01-10',
      readTime: '10 min read',
      category: 'Architecture',
      featured: true
    },
    {
      id: '4',
      title: 'Real-Time Threat Detection: How SafeShield Stops Attacks',
      excerpt: 'Deep dive into our advanced threat detection algorithms and how they provide 24/7 protection against sophisticated cyber attacks.',
      author: 'Emma Wilson',
      publishDate: '2024-01-08',
      readTime: '7 min read',
      category: 'Product Deep Dive'
    },
    {
      id: '5',
      title: 'Small Business Cybersecurity: Essential Protection on Any Budget',
      excerpt: 'Practical cybersecurity strategies for small businesses to protect against modern threats without breaking the bank or overwhelming limited IT resources.',
      author: 'James Parker',
      publishDate: '2024-01-05',
      readTime: '5 min read',
      category: 'Small Business'
    },
    {
      id: '6',
      title: 'Compliance Made Easy: GDPR, HIPAA, and SOC 2 with UltriumAI',
      excerpt: 'Navigate complex compliance requirements with automated tools and comprehensive documentation that simplifies audits and reduces risk.',
      author: 'Lisa Chang',
      publishDate: '2024-01-03',
      readTime: '9 min read',
      category: 'Compliance'
    },
    {
      id: '7',
      title: 'Incident Response Playbook: From Detection to Resolution',
      excerpt: 'A comprehensive guide to building effective incident response procedures using UltriumAI tools for rapid threat containment.',
      author: 'David Kumar',
      publishDate: '2024-01-01',
      readTime: '12 min read',
      category: 'Security Operations'
    },
    {
      id: '8',
      title: 'The Economics of Cybersecurity: ROI of Proactive Protection',
      excerpt: 'Analyzing the financial impact of cybersecurity investments and how proactive protection saves money in the long run.',
      author: 'Rachel Green',
      publishDate: '2023-12-28',
      readTime: '8 min read',
      category: 'Business Strategy'
    }
  ];

  const categories = [
    'all',
    'AI Security',
    'MSP Strategy',
    'Architecture',
    'Product Deep Dive',
    'Small Business',
    'Compliance',
    'Security Operations',
    'Business Strategy'
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(post => post.featured);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ai security': return 'bg-primary/10 text-primary border-primary/20';
      case 'msp strategy': return 'bg-success/10 text-success border-success/20';
      case 'architecture': return 'bg-info/10 text-info border-info/20';
      case 'product deep dive': return 'bg-warning/10 text-warning border-warning/20';
      case 'small business': return 'bg-secondary/80 text-secondary-foreground border-secondary';
      case 'compliance': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'security operations': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      case 'business strategy': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">UltriumAI Blog</Link>
            <Button asChild variant="outline">
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Cybersecurity Insights & News
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Expert insights, industry trends, and product updates from the cybersecurity frontlines
          </p>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-xl transition-all duration-300 group border-primary/20">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={getCategoryColor(post.category)}>
                        {post.category}
                      </Badge>
                      <Badge variant="secondary">Featured</Badge>
                    </div>
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.publishDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      variant="outline"
                      asChild
                    >
                      <Link to={`/blog/${post.id}`}>
                        Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* All Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={getCategoryColor(post.category)}>
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </div>
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.publishDate).toLocaleDateString()}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  asChild
                >
                  <Link to={`/blog/${post.id}`}>
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found matching your criteria.</p>
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
      </div>
      <Footer />
    </div>
  );
};

export default Blog;