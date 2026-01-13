import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Eye, 
  ThumbsUp, 
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  'security', 'network', 'email', 'software', 'hardware', 
  'printer', 'mobile', 'account', 'data', 'other'
];

export function KnowledgeBaseManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "other",
    subcategory: "",
    tags: "",
    keywords: "",
    is_published: true,
    is_internal: false,
  });

  const { data: articles, isLoading } = useQuery({
    queryKey: ['kb-articles-admin', selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase.from('helpdesk_kb_articles').select('*');
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('helpdesk_kb_articles').insert({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        subcategory: data.subcategory || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
        is_published: data.is_published,
        is_internal: data.is_internal,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles-admin'] });
      toast.success('Article created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create article: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('helpdesk_kb_articles')
        .update({
          title: data.title,
          content: data.content,
          excerpt: data.excerpt,
          category: data.category,
          subcategory: data.subcategory || null,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
          keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
          is_published: data.is_published,
          is_internal: data.is_internal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles-admin'] });
      toast.success('Article updated successfully');
      setEditingArticle(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update article: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('helpdesk_kb_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles-admin'] });
      toast.success('Article deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete article: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      category: "other",
      subcategory: "",
      tags: "",
      keywords: "",
      is_published: true,
      is_internal: false,
    });
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || "",
      category: article.category,
      subcategory: article.subcategory || "",
      tags: article.tags?.join(', ') || "",
      keywords: article.keywords?.join(', ') || "",
      is_published: article.is_published,
      is_internal: article.is_internal,
    });
  };

  const handleSubmit = () => {
    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Knowledge Base</h2>
        </div>
        <Dialog open={isCreateOpen || !!editingArticle} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingArticle(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? 'Edit Article' : 'Create New Article'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="How to Reset Your Password"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Input
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary for search results"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full article content..."
                  rows={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., password, vpn"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="password, reset, account"
                />
              </div>

              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="forgot password, can't login, locked out"
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_internal}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_internal: checked })}
                  />
                  <Label>Internal Only</Label>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingArticle ? 'Update Article' : 'Create Article'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
      ) : articles?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No articles found. Create your first article!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles?.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{article.title}</h3>
                      {!article.is_published && (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {article.is_internal && (
                        <Badge variant="outline">Internal</Badge>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{article.category}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {article.view_count || 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="h-3 w-3" />
                        {article.helpful_count || 0}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
