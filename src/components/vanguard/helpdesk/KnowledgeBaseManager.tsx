/**
 * Knowledge Base Manager
 * Full KB article editor, category management, and search interface
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search, Plus, BookOpen, FolderOpen, Edit, Trash2, Eye, EyeOff,
  ThumbsUp, ThumbsDown, Clock, User, Tag, ChevronRight, FileText,
  Sparkles, RefreshCw, ExternalLink, Copy, Check, X, Filter, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useKnowledgeBase, KBArticle } from '@/hooks/useKnowledgeBase';

interface KnowledgeBaseManagerProps {
  onArticleSelect?: (articleId: string) => void;
}

// Default categories
const defaultCategories = [
  { id: 'general', name: 'General', icon: '📚', color: '#06b6d4' },
  { id: 'technical', name: 'Technical', icon: '🔧', color: '#8b5cf6' },
  { id: 'billing', name: 'Billing', icon: '💳', color: '#10b981' },
  { id: 'getting-started', name: 'Getting Started', icon: '🚀', color: '#f59e0b' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔍', color: '#ef4444' },
];

export function KnowledgeBaseManager({ onArticleSelect }: KnowledgeBaseManagerProps) {
  const {
    articles,
    stats,
    isLoading,
    searchArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    loadArticles
  } = useKnowledgeBase();

  const [activeTab, setActiveTab] = useState('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewArticle, setShowNewArticle] = useState(false);
  const [searchResults, setSearchResults] = useState<KBArticle[]>([]);

  // Form states
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    is_published: false,
    is_internal: false
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = searchArticles(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleCreateArticle = async () => {
    if (!articleForm.title || !articleForm.content) {
      toast.error('Please fill in title and content');
      return;
    }

    const success = await createArticle({
      ...articleForm
    });

    if (success) {
      setShowNewArticle(false);
      setArticleForm({
        title: '',
        content: '',
        category: 'general',
        tags: [],
        is_published: false,
        is_internal: false
      });
    }
  };

  const handleUpdateArticle = async () => {
    if (!selectedArticle) return;

    const success = await updateArticle(selectedArticle.id, articleForm);
    if (success) {
      setIsEditing(false);
      setSelectedArticle(null);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteArticle(id);
      setSelectedArticle(null);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !articleForm.tags.includes(newTag.trim())) {
      setArticleForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const openEditArticle = (article: KBArticle) => {
    setSelectedArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category || 'general',
      tags: article.tags || [],
      is_published: article.is_published,
      is_internal: article.is_internal
    });
    setIsEditing(true);
  };

  const getCategoryById = (id: string) => defaultCategories.find(c => c.id === id);

  const filteredArticles = (searchResults.length > 0 ? searchResults : articles).filter(article => {
    if (selectedCategory !== 'all' && article.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getArticleCountByCategory = (categoryId: string) => {
    return articles.filter(a => a.category === categoryId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-cyan-400" />
            Knowledge Base
          </h2>
          <p className="text-white/60 mt-1">Manage articles, categories, and self-service content</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowNewArticle(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-cyan-500/20">
          <TabsTrigger value="articles" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileText className="h-4 w-4 mr-2" />
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categories ({defaultCategories.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          {/* Search & Filters */}
          <Card className="bg-slate-900/50 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-slate-800/50 border-white/10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 bg-slate-800/50 border-white/10">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="all">All Categories</SelectItem>
                    {defaultCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          <div className="grid gap-4">
            {isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-3" />
                <p className="text-white/60">Loading articles...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="bg-slate-900/50 border-cyan-500/20">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/60">No articles found</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewArticle(true)}
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Article
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredArticles.map(article => {
                const category = getCategoryById(article.category);
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-slate-900/50 border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1" onClick={() => onArticleSelect?.(article.id)}>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">{article.title}</h3>
                              {article.is_published ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Published</Badge>
                              ) : (
                                <Badge className="bg-amber-500/20 text-amber-400 text-xs">Draft</Badge>
                              )}
                              {article.is_internal && (
                                <Badge className="bg-purple-500/20 text-purple-400 text-xs">Internal</Badge>
                              )}
                            </div>
                            <p className="text-white/60 text-sm line-clamp-2 mb-3">{article.content}</p>
                            <div className="flex items-center gap-4 text-xs text-white/40">
                              {category && (
                                <span className="flex items-center gap-1">
                                  <FolderOpen className="h-3 w-3" />
                                  {category.name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.view_count || 0} views
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {article.helpful_count || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(article.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            {article.tags?.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {article.tags.slice(0, 5).map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-slate-800/50">
                                    {tag}
                                  </Badge>
                                ))}
                                {article.tags.length > 5 && (
                                  <Badge variant="outline" className="text-xs bg-slate-800/50">
                                    +{article.tags.length - 5}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditArticle(article)}
                              className="text-white/40 hover:text-cyan-400"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteArticle(article.id)}
                              className="text-white/40 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultCategories.map(category => (
              <Card key={category.id} className="bg-slate-900/50 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{category.name}</h3>
                      <p className="text-xs text-white/50">{getArticleCountByCategory(category.id)} articles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.totalArticles}</p>
                <p className="text-xs text-white/50">Total Articles</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{stats.totalViews}</p>
                <p className="text-xs text-white/50">Total Views</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <ThumbsUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">
                  {articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0)}
                </p>
                <p className="text-xs text-white/50">Helpful Votes</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-4 text-center">
                <FolderOpen className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{defaultCategories.length}</p>
                <p className="text-xs text-white/50">Categories</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New/Edit Article Dialog */}
      <Dialog open={showNewArticle || isEditing} onOpenChange={(open) => {
        if (!open) {
          setShowNewArticle(false);
          setIsEditing(false);
          setSelectedArticle(null);
        }
      }}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              {isEditing ? 'Edit Article' : 'New Article'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/70">Title</Label>
              <Input
                value={articleForm.title}
                onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Article title..."
                className="bg-slate-800/50 border-white/10 mt-1"
              />
            </div>
            <div>
              <Label className="text-white/70">Content</Label>
              <Textarea
                value={articleForm.content}
                onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your article content here... (Markdown supported)"
                rows={12}
                className="bg-slate-800/50 border-white/10 mt-1 font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/70">Category</Label>
                <Select
                  value={articleForm.category}
                  onValueChange={(value) => setArticleForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    {defaultCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="bg-slate-800/50 border-white/10"
                  />
                  <Button onClick={addTag} variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            {articleForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {articleForm.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-slate-800/50 group">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={articleForm.is_published}
                    onCheckedChange={(checked) => setArticleForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label className="text-white/70">Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={articleForm.is_internal}
                    onCheckedChange={(checked) => setArticleForm(prev => ({ ...prev, is_internal: checked }))}
                  />
                  <Label className="text-white/70">Internal Only</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewArticle(false);
                    setIsEditing(false);
                    setSelectedArticle(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={isEditing ? handleUpdateArticle : handleCreateArticle}
                  className="bg-cyan-500 hover:bg-cyan-600 text-black"
                >
                  {isEditing ? 'Save Changes' : 'Create Article'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
