import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Clock,
  FileText,
  Loader2
} from "lucide-react";
import { useKnowledgeBase, type KBArticle } from "@/hooks/useKnowledgeBase";

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'security', label: 'Security' },
  { value: 'network', label: 'Network' },
  { value: 'email', label: 'Email' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'account', label: 'Account' },
  { value: 'general', label: 'General' }
];

export const KnowledgeBaseView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

  const { 
    articles, 
    stats, 
    isLoading, 
    recordView, 
    rateArticle,
    getPublishedArticles,
    getArticlesByCategory,
    searchArticles
  } = useKnowledgeBase();

  const displayedArticles = (() => {
    let filtered = getPublishedArticles();
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    if (searchTerm) {
      const searchResults = searchArticles(searchTerm);
      filtered = filtered.filter(a => searchResults.some(r => r.id === a.id));
    }
    
    return filtered;
  })();

  const handleArticleClick = async (article: KBArticle) => {
    setSelectedArticle(article);
    await recordView(article.id);
  };

  const handleRate = async (helpful: boolean) => {
    if (selectedArticle) {
      await rateArticle(selectedArticle.id, helpful);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedArticle(null)}>
          ← Back to Articles
        </Button>
        
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedArticle.title}</CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-4">
                    <Badge>{selectedArticle.category}</Badge>
                    <span className="flex items-center gap-1 text-sm">
                      <Eye className="h-4 w-4" />
                      {selectedArticle.view_count} views
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      {new Date(selectedArticle.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              {selectedArticle.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            
            {selectedArticle.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
            
            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground mb-4">Was this article helpful?</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => handleRate(true)}>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes ({selectedArticle.helpful_count})
                </Button>
                <Button variant="outline" onClick={() => handleRate(false)}>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  No ({selectedArticle.not_helpful_count})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalArticles}</p>
                <p className="text-sm text-muted-foreground">Total Articles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.publishedArticles}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {articles.reduce((sum, a) => sum + a.helpful_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Helpful Votes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {CATEGORIES.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-sm">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Articles List */}
      {displayedArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {articles.length === 0 
              ? "No knowledge base articles yet."
              : "No articles match your search criteria."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedArticles.map((article) => (
            <Card 
              key={article.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleArticleClick(article)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <Badge variant="outline" className="shrink-0">{article.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {article.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {article.helpful_count}
                    </span>
                  </div>
                  <span>{new Date(article.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
