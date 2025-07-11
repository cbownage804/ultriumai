import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: string;
  readTime: string;
  category: string;
  imageUrl?: string;
}

const BlogSection = () => {
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'The Future of AI-Powered Cybersecurity: UltriumGPT Revolution',
      excerpt: 'Discover how artificial intelligence is transforming cybersecurity with advanced threat detection, automated responses, and predictive analytics.',
      author: 'Dr. Sarah Chen',
      publishDate: '2024-01-15',
      readTime: '8 min read',
      category: 'AI Security'
    },
    {
      id: '2',
      title: 'MSP Security Best Practices: Protecting Your Clients in 2024',
      excerpt: 'Essential strategies for Managed Service Providers to deliver comprehensive cybersecurity solutions to their clients.',
      author: 'Michael Rodriguez',
      publishDate: '2024-01-12',
      readTime: '6 min read',
      category: 'MSP Strategy'
    },
    {
      id: '3',
      title: 'Zero Trust Architecture: Building Impenetrable Digital Fortresses',
      excerpt: 'Learn how to implement Zero Trust security models with UltriumAI platform for maximum protection.',
      author: 'Alex Thompson',
      publishDate: '2024-01-10',
      readTime: '10 min read',
      category: 'Architecture'
    },
    {
      id: '4',
      title: 'Real-Time Threat Detection: How SafeShield Stops Attacks',
      excerpt: 'Deep dive into our advanced threat detection algorithms and how they provide 24/7 protection.',
      author: 'Emma Wilson',
      publishDate: '2024-01-08',
      readTime: '7 min read',
      category: 'Product Deep Dive'
    },
    {
      id: '5',
      title: 'Small Business Cybersecurity: Essential Protection on Any Budget',
      excerpt: 'Practical cybersecurity strategies for small businesses to protect against modern threats without breaking the bank.',
      author: 'James Parker',
      publishDate: '2024-01-05',
      readTime: '5 min read',
      category: 'Small Business'
    },
    {
      id: '6',
      title: 'Compliance Made Easy: GDPR, HIPAA, and SOC 2 with UltriumAI',
      excerpt: 'Navigate complex compliance requirements with automated tools and comprehensive documentation.',
      author: 'Lisa Chang',
      publishDate: '2024-01-03',
      readTime: '9 min read',
      category: 'Compliance'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ai security': return 'bg-primary/10 text-primary border-primary/20';
      case 'msp strategy': return 'bg-success/10 text-success border-success/20';
      case 'architecture': return 'bg-info/10 text-info border-info/20';
      case 'product deep dive': return 'bg-warning/10 text-warning border-warning/20';
      case 'small business': return 'bg-secondary/80 text-secondary-foreground border-secondary';
      case 'compliance': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest Insights & Security News
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Stay ahead of cyber threats with expert insights, industry trends, and product updates from our security experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {blogPosts.map((post) => (
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

        <div className="text-center">
          <Button asChild size="lg" variant="outline">
            <Link to="/blog">
              View All Articles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;