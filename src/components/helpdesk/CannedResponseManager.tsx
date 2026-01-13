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
  MessageSquareText, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Copy,
  Zap
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  'general', 'security', 'network', 'email', 'software', 'hardware', 
  'printer', 'mobile', 'account', 'acknowledgment'
];

export function CannedResponseManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general",
    tags: "",
    keywords: "",
    shortcut: "",
    is_active: true,
  });

  const { data: responses, isLoading } = useQuery({
    queryKey: ['canned-responses', selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase.from('helpdesk_canned_responses').select('*');
      
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('usage_count', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('helpdesk_canned_responses').insert({
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
        shortcut: data.shortcut || null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast.success('Response created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create response: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('helpdesk_canned_responses')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
          keywords: data.keywords ? data.keywords.split(',').map(k => k.trim()) : [],
          shortcut: data.shortcut || null,
          is_active: data.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast.success('Response updated successfully');
      setEditingResponse(null);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update response: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('helpdesk_canned_responses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['canned-responses'] });
      toast.success('Response deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete response: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "general",
      tags: "",
      keywords: "",
      shortcut: "",
      is_active: true,
    });
  };

  const handleEdit = (response: any) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category || "general",
      tags: response.tags?.join(', ') || "",
      keywords: response.keywords?.join(', ') || "",
      shortcut: response.shortcut || "",
      is_active: response.is_active,
    });
  };

  const handleSubmit = () => {
    if (editingResponse) {
      updateMutation.mutate({ id: editingResponse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Canned Responses</h2>
        </div>
        <Dialog open={isCreateOpen || !!editingResponse} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingResponse(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Response
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingResponse ? 'Edit Response' : 'Create New Response'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Password Reset Instructions"
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the response content. You can use placeholders like [TICKET_ID], [USER_NAME], etc."
                  rows={8}
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
                  <Label>Shortcut (e.g., /password)</Label>
                  <Input
                    value={formData.shortcut}
                    onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                    placeholder="/password"
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
                <Label>Keywords for AI matching (comma-separated)</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="forgot password, can't login, locked out"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingResponse ? 'Update Response' : 'Create Response'}
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
            placeholder="Search responses..."
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

      {/* Responses List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading responses...</div>
      ) : responses?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No canned responses found. Create your first one!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {responses?.map((response) => (
            <Card key={response.id} className={!response.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{response.title}</h3>
                      {response.shortcut && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {response.shortcut}
                        </Badge>
                      )}
                      {!response.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {response.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{response.category}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        Used {response.usage_count || 0} times
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(response.content)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(response)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(response.id)}
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
