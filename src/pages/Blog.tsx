import { useState, useMemo } from 'react';
import Footer from "@/components/Footer";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, ArrowRight, User, Search, AlertCircle } from 'lucide-react';
import { useBlogPosts, useCategories } from '@/hooks/useBlogPosts';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const { posts, loading, error } = useBlogPosts({ published: true });
  const { categories } = useCategories();

  // Estimate read time based on content length
  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (post.category?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchTerm, selectedCategory]);

  // Featured posts are the first 2 most recent posts
  const featuredPosts = useMemo(() => posts.slice(0, 2), [posts]);

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
      {/* Header - Mobile optimized with safe areas */}
      <header className="border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 safe-area-inset-top">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl md:text-2xl font-bold">UltriumAI Blog</Link>
            <Button asChild variant="outline" size="sm" className="touch-target h-10 md:h-9 text-sm">
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8 safe-area-inset-bottom">
        {/* Hero Section - Fluid typography */}
        <div className="text-center mb-8 md:mb-12 animate-fade-in">
          <h1 className="text-fluid-lg md:text-fluid-xl font-bold mb-3 md:mb-4">
            Cybersecurity Insights & News
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Expert insights, industry trends, and product updates from the cybersecurity frontlines
          </p>
        </div>

        {/* Loading State - Mobile optimized skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="p-4 md:p-6">
                  <Skeleton className="h-5 md:h-6 w-20 md:w-24 mb-2" />
                  <Skeleton className="h-6 md:h-8 w-full mb-2" />
                  <Skeleton className="h-12 md:h-16 w-full" />
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <Skeleton className="h-9 md:h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8 md:py-12 mb-8 md:mb-12">
            <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-destructive mx-auto mb-3 md:mb-4" />
            <p className="text-destructive text-sm md:text-base">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="mt-3 md:mt-4 touch-target">
              Try Again
            </Button>
          </div>
        )}

        {/* Featured Posts - Mobile responsive */}
        {!loading && !error && featuredPosts.length > 0 && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-xl transition-all duration-300 group border-primary/20 hover:-translate-y-1">
                  <CardHeader className="p-4 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <Badge className={`${getCategoryColor(post.category || 'Uncategorized')} text-xs`}>
                        {post.category || 'Uncategorized'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    </div>
                    <CardTitle className="text-lg md:text-xl line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 md:line-clamp-3 text-sm">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        UltriumAI Team
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estimateReadTime(post.content)}
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors touch-target h-10 md:h-9"
                      variant="outline"
                      asChild
                    >
                      <Link to={`/blog/${post.slug}`}>
                        Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filter - Touch optimized */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 md:h-10 text-base md:text-sm"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="sm:w-48 h-11 md:h-10 text-base md:text-sm">
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

        {/* All Posts Grid - Mobile responsive */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <Badge className={`${getCategoryColor(post.category || 'Uncategorized')} text-xs`}>
                      {post.category || 'Uncategorized'}
                    </Badge>
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {estimateReadTime(post.content)}
                    </div>
                  </div>
                  <CardTitle className="text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 md:line-clamp-3 text-sm">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                    <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      UltriumAI Team
                    </div>
                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors touch-target h-10 md:h-9"
                    asChild
                  >
                    <Link to={`/blog/${post.slug}`}>
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No results state */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <p className="text-sm md:text-base text-muted-foreground">No articles found matching your criteria.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-3 md:mt-4 touch-target"
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