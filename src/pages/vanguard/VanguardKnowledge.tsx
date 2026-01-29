import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, Search, Plus, FileText, Video, Link2, Star,
  Clock, Eye, ThumbsUp, Folder, ChevronRight, X, ArrowLeft,
  Edit, Trash2, Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Article {
  id: string;
  title: string;
  category: string;
  type: 'article' | 'video' | 'link';
  views: number;
  likes: number;
  time: string;
  featured: boolean;
  content?: string;
}

const initialArticles: Article[] = [
  { id: '1', title: 'Setting Up Remote Agents', category: 'Getting Started', type: 'article', views: 1250, likes: 45, time: '5 min read', featured: true, content: 'Learn how to set up remote agents for monitoring your infrastructure...' },
  { id: '2', title: 'Configuring Alert Rules', category: 'Alerts', type: 'article', views: 890, likes: 32, time: '8 min read', featured: false, content: 'This guide covers how to configure alert rules...' },
  { id: '3', title: 'Patch Management Best Practices', category: 'Security', type: 'video', views: 2100, likes: 78, time: '12 min', featured: true, content: 'Video walkthrough of patch management best practices...' },
  { id: '4', title: 'Customer Onboarding Guide', category: 'Customers', type: 'article', views: 560, likes: 21, time: '10 min read', featured: false, content: 'Complete guide for onboarding new customers...' },
  { id: '5', title: 'API Integration Tutorial', category: 'Integrations', type: 'article', views: 430, likes: 15, time: '15 min read', featured: false, content: 'Step by step tutorial for integrating with our API...' },
  { id: '6', title: 'Backup Configuration', category: 'Backup', type: 'video', views: 780, likes: 29, time: '8 min', featured: false, content: 'Video guide for configuring backups...' },
];

const categories = [
  { name: 'All', count: 0 },
  { name: 'Getting Started', count: 12 },
  { name: 'Alerts', count: 8 },
  { name: 'Security', count: 15 },
  { name: 'Customers', count: 6 },
  { name: 'Integrations', count: 9 },
  { name: 'Backup', count: 5 },
];

const typeIcons = {
  article: FileText,
  video: Video,
  link: Link2,
};

export default function VanguardKnowledge() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Getting Started');
  const [newType, setNewType] = useState<'article' | 'video' | 'link'>('article');
  const [newContent, setNewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = 'Vanguard Atlas | Ultrium Vanguard';
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = articles.filter(a => a.featured);

  const handleCreateArticle = () => {
    if (!newTitle || !newContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const newArticle: Article = {
        id: Date.now().toString(),
        title: newTitle,
        category: newCategory,
        type: newType,
        views: 0,
        likes: 0,
        time: newType === 'video' ? '5 min' : '3 min read',
        featured: false,
        content: newContent,
      };
      setArticles([newArticle, ...articles]);
      toast.success('Article created successfully');
      setShowCreateDialog(false);
      setNewTitle('');
      setNewCategory('Getting Started');
      setNewType('article');
      setNewContent('');
      setIsLoading(false);
    }, 1000);
  };

  const handleEditArticle = () => {
    if (!selectedArticle || !newTitle || !newContent) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setArticles(articles.map(a => 
        a.id === selectedArticle.id 
          ? { ...a, title: newTitle, category: newCategory, type: newType, content: newContent }
          : a
      ));
      toast.success('Article updated successfully');
      setShowEditDialog(false);
      setSelectedArticle(null);
      setIsLoading(false);
    }, 1000);
  };

  const handleDeleteArticle = (article: Article) => {
    setArticles(articles.filter(a => a.id !== article.id));
    if (selectedArticle?.id === article.id) {
      setSelectedArticle(null);
    }
    toast.success('Article deleted');
  };

  const handleLikeArticle = (article: Article) => {
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, likes: a.likes + 1 } : a
    ));
    toast.success('Thanks for the feedback!');
  };

  const handleToggleFeatured = (article: Article) => {
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, featured: !a.featured } : a
    ));
    toast.success(article.featured ? 'Removed from featured' : 'Added to featured');
  };

  const openEditDialog = (article: Article) => {
    setSelectedArticle(article);
    setNewTitle(article.title);
    setNewCategory(article.category);
    setNewType(article.type);
    setNewContent(article.content || '');
    setShowEditDialog(true);
  };

  const viewArticle = (article: Article) => {
    // Update view count
    setArticles(articles.map(a => 
      a.id === article.id ? { ...a, views: a.views + 1 } : a
    ));
    setSelectedArticle(article);
  };

  // Article viewer
  if (selectedArticle && !showEditDialog) {
    return (
      <div className="p-6 space-y-6">
        <Button 
          variant="ghost" 
          className="text-white/60 hover:text-white"
          onClick={() => setSelectedArticle(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Knowledge Base
        </Button>
        
        <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-slate-800">
                    {selectedArticle.category}
                  </Badge>
                  {selectedArticle.featured && (
                    <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
                  )}
                </div>
                <CardTitle className="text-white text-2xl">{selectedArticle.title}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedArticle.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedArticle.likes} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedArticle.time}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-cyan-500/20 text-cyan-400"
                  onClick={() => openEditDialog(selectedArticle)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-amber-500/20 text-amber-400"
                  onClick={() => handleToggleFeatured(selectedArticle)}
                >
                  <Star className={`h-4 w-4 mr-1 ${selectedArticle.featured ? 'fill-current' : ''}`} />
                  {selectedArticle.featured ? 'Unfeature' : 'Feature'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/80 whitespace-pre-wrap">{selectedArticle.content}</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-cyan-500/20 flex items-center justify-between">
              <p className="text-white/60 text-sm">Was this article helpful?</p>
              <Button 
                variant="outline" 
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => handleLikeArticle(selectedArticle)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes, this helped
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <BookOpen className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Vanguard Atlas</h1>
            <p className="text-white/60 text-sm">Knowledge base, documentation, and SOPs</p>
          </div>
        </div>
        <Button 
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <Input 
          placeholder="Search documentation..." 
          className="pl-12 py-6 text-lg bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Featured Articles */}
      {!searchQuery && selectedCategory === 'All' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            Featured Articles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredArticles.map((article, i) => {
              const TypeIcon = typeIcons[article.type];
              return (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card 
                    className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors cursor-pointer h-full"
                    onClick={() => viewArticle(article)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
                        <TypeIcon className="h-5 w-5 text-cyan-400" />
                      </div>
                      <CardTitle className="text-white mt-2">{article.title}</CardTitle>
                      <CardDescription className="text-white/60">{article.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {article.time}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <div className="space-y-2">
            {categories.map((category) => (
              <Card 
                key={category.name}
                className={`bg-black/40 border-cyan-500/20 hover:border-cyan-500/40 transition-colors cursor-pointer ${
                  selectedCategory === category.name ? 'border-cyan-500 bg-cyan-500/10' : ''
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-4 w-4 text-cyan-400" />
                      <span className="text-white/80">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {category.name !== 'All' && (
                        <Badge variant="secondary" className="bg-slate-800 text-white/60">
                          {category.count}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-white/40" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {searchQuery ? 'Search Results' : selectedCategory === 'All' ? 'All Articles' : selectedCategory}
            </h2>
            <span className="text-white/60 text-sm">{filteredArticles.length} articles</span>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {filteredArticles.map((article, i) => {
                const TypeIcon = typeIcons[article.type];
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <TypeIcon className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => viewArticle(article)}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="text-white font-medium">{article.title}</h3>
                              {article.featured && (
                                <Star className="h-4 w-4 text-amber-400 fill-current" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                              <Badge variant="secondary" className="bg-slate-800">
                                {article.category}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {article.views}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-white/40 hover:text-cyan-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(article);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-white/40 hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArticle(article);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <ChevronRight className="h-5 w-5 text-white/40" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            
            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No articles found</p>
                <p className="text-white/40 text-sm">Try a different search or category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Article Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Article</DialogTitle>
            <DialogDescription className="text-white/60">
              Add a new article to the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Title</Label>
              <Input
                placeholder="Article title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {categories.filter(c => c.name !== 'All').map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Content</Label>
              <Textarea
                placeholder="Write your article content..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleCreateArticle} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Article</DialogTitle>
            <DialogDescription className="text-white/60">
              Update the article content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Title</Label>
              <Input
                placeholder="Article title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {categories.filter(c => c.name !== 'All').map(c => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Content</Label>
              <Textarea
                placeholder="Write your article content..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleEditArticle} disabled={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
