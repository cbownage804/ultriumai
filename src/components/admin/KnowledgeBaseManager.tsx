import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Edit, Trash2, Eye, Search, Tag } from "lucide-react";

interface KnowledgeArticle {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'setup', label: 'Setup & Configuration' },
  { value: 'faq', label: 'FAQ' },
  { value: 'procedures', label: 'Procedures' },
  { value: 'training', label: 'Training' },
  { value: 'security', label: 'Security' },
];

export const KnowledgeBaseManager = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('knowledge_articles')
        .select('*')
        .eq('user_id', user.user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading knowledge articles:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveArticle = async (articleData: Partial<KnowledgeArticle>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      if (editingArticle) {
        const { error } = await supabase
          .from('knowledge_articles')
          .update({
            title: articleData.title,
            content: articleData.content,
            summary: articleData.summary,
            category: articleData.category,
            tags: articleData.tags,
            is_published: articleData.is_published,
          })
          .eq('id', editingArticle.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('knowledge_articles')
          .insert({
            user_id: user.user.id,
            title: articleData.title,
            content: articleData.content,
            summary: articleData.summary,
            category: articleData.category,
            tags: articleData.tags,
            is_published: articleData.is_published,
            view_count: 0,
            helpful_count: 0,
          });

        if (error) throw error;
      }

      toast({
        title: "✅ Article Saved",
        description: `Knowledge article "${articleData.title}" has been saved successfully`,
      });

      setShowDialog(false);
      setEditingArticle(null);
      loadArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Failed to save knowledge article",
        variant: "destructive",
      });
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      toast({
        title: "✅ Article Deleted",
        description: "Knowledge article has been deleted successfully",
      });

      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete knowledge article",
        variant: "destructive",
      });
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Knowledge Base
          </h2>
          <p className="text-muted-foreground">
            Create and manage knowledge articles for your support team
          </p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingArticle(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? 'Edit Knowledge Article' : 'Create Knowledge Article'}
              </DialogTitle>
            </DialogHeader>
            <KnowledgeArticleForm
              article={editingArticle}
              onSave={saveArticle}
              onCancel={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  {article.category && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {categories.find(c => c.value === article.category)?.label}
                    </p>
                  )}
                </div>
                <Badge variant={article.is_published ? "default" : "secondary"}>
                  {article.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {article.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {article.summary}
                  </p>
                )}

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{article.view_count} views</span>
                  <span>{article.helpful_count} helpful</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingArticle(article);
                      setShowDialog(true);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteArticle(article.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {searchQuery || selectedCategory !== 'all' ? 'No articles found' : 'No Knowledge Articles'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first knowledge article to get started'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface KnowledgeArticleFormProps {
  article: KnowledgeArticle | null;
  onSave: (data: Partial<KnowledgeArticle>) => void;
  onCancel: () => void;
}

const KnowledgeArticleForm = ({ article, onSave, onCancel }: KnowledgeArticleFormProps) => {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    content: article?.content || '',
    summary: article?.summary || '',
    category: article?.category || 'faq',
    tags: article?.tags || [],
    is_published: article?.is_published ?? false,
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          rows={2}
          placeholder="Brief description of the article"
        />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={10}
          required
          placeholder="Write your article content here..."
        />
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_published"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
        <Label htmlFor="is_published">Publish Article</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {article ? 'Update Article' : 'Create Article'}
        </Button>
      </div>
    </form>
  );
};