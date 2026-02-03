/**
 * Knowledge Base Component
 * Self-service FAQ/articles for portal users
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, BookOpen, ChevronRight, ThumbsUp, ThumbsDown, 
  Loader2, ArrowLeft, Eye, Tag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';

interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  helpful_count: number;
}

interface KnowledgeBaseProps {
  clientId?: string;
}

export function KnowledgeBase({ clientId }: KnowledgeBaseProps) {
  const { session } = usePortalSession();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KBArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [hasVoted, setHasVoted] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [clientId]);

  useEffect(() => {
    let filtered = articles;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.content.toLowerCase().includes(query) ||
        a.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }
    
    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('client_portal_kb')
        .select('*')
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('view_count', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
      setFilteredArticles(data || []);
    } catch (error) {
      console.error('Failed to fetch KB articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleClick = async (article: KBArticle) => {
    setSelectedArticle(article);
    setHasVoted(null);
    
    // Increment view count
    await supabase
      .from('client_portal_kb')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', article.id);
  };

  const handleVote = async (helpful: boolean) => {
    if (!selectedArticle || hasVoted) return;
    
    const field = helpful ? 'helpful_count' : 'not_helpful_count';
    const currentCount = helpful 
      ? selectedArticle.helpful_count || 0 
      : 0;
    
    await supabase
      .from('client_portal_kb')
      .update({ [field]: currentCount + 1 })
      .eq('id', selectedArticle.id);
    
    setHasVoted(helpful ? 'up' : 'down');
  };

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Article Detail View
  if (selectedArticle) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedArticle(null)}
          className="text-white/60 hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Articles
        </Button>

        <Card className="bg-black/40 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {selectedArticle.title}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedArticle.category && (
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                      {selectedArticle.category}
                    </Badge>
                  )}
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {selectedArticle.view_count || 0} views
                  </span>
                </div>
              </div>
            </div>

            <div className="prose prose-invert max-w-none mb-6">
              <div className="text-white/80 whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>

            {selectedArticle.tags?.length > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <Tag className="h-4 w-4 text-white/40" />
                {selectedArticle.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="border-white/20 text-white/60 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-white/60 mb-3">Was this article helpful?</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(true)}
                  disabled={hasVoted !== null}
                  className={`border-white/20 ${hasVoted === 'up' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'text-white/60 hover:text-white'}`}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(false)}
                  disabled={hasVoted !== null}
                  className={`border-white/20 ${hasVoted === 'down' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'text-white/60 hover:text-white'}`}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  No
                </Button>
                {hasVoted && (
                  <span className="text-sm text-white/40 ml-2">Thanks for your feedback!</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-cyan-400" />
          Knowledge Base
        </h2>
        <p className="text-white/60">Find answers to common questions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={`${!selectedCategory ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60'}`}
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`${selectedCategory === cat ? 'bg-cyan-500/20 text-cyan-400' : 'text-white/60'}`}
            >
              {cat}
            </Button>
          ))}
        </div>
      )}

      {/* Articles List */}
      <AnimatePresence mode="popLayout">
        {filteredArticles.length === 0 ? (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/60">No articles found</p>
              {searchQuery && (
                <p className="text-white/40 text-sm mt-1">
                  Try a different search term
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className="bg-black/40 border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer group"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {article.is_featured && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                              Featured
                            </Badge>
                          )}
                          <h3 className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate">
                            {article.title}
                          </h3>
                        </div>
                        <p className="text-sm text-white/50 line-clamp-2">
                          {article.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {article.category && (
                            <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
                              {article.category}
                            </Badge>
                          )}
                          <span className="text-xs text-white/30">
                            {article.view_count || 0} views
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-cyan-400 transition-colors ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
