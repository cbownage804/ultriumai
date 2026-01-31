import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Copy, MessageSquare, Zap, Hash, Filter } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['general', 'greeting', 'closing', 'technical', 'billing', 'escalation', 'apology'];

interface CannedResponse {
  id: string;
  name: string;
  content: string;
  category: string;
  shortcut: string | null;
  use_count: number;
  is_shared: boolean;
}

// Mock data for demonstration
const MOCK_RESPONSES: CannedResponse[] = [
  { id: '1', name: 'Password Reset Instructions', content: 'Hi {{customer_name}},\n\nTo reset your password, please follow these steps:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n\nBest regards,\n{{agent_name}}', category: 'technical', shortcut: 'passreset', use_count: 45, is_shared: true },
  { id: '2', name: 'Greeting - General', content: 'Hi {{customer_name}},\n\nThank you for contacting our support team. I\'d be happy to help you with your request.', category: 'greeting', shortcut: 'hello', use_count: 120, is_shared: true },
  { id: '3', name: 'Ticket Closure', content: 'Hi {{customer_name}},\n\nI\'m glad we were able to resolve your issue. If you have any further questions, please don\'t hesitate to reach out.\n\nBest regards,\n{{agent_name}}', category: 'closing', shortcut: 'close', use_count: 89, is_shared: true },
  { id: '4', name: 'Escalation Notice', content: 'Hi {{customer_name}},\n\nI\'m escalating your ticket to our senior support team for further assistance. They will contact you within 24 hours.\n\nThank you for your patience.', category: 'escalation', shortcut: 'escalate', use_count: 23, is_shared: true },
];

export function CannedResponsesLibrary() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [responses, setResponses] = useState<CannedResponse[]>(MOCK_RESPONSES);
  const [newResponse, setNewResponse] = useState({
    name: '',
    content: '',
    category: 'general',
    shortcut: '',
    is_shared: true
  });

  const handleAddResponse = () => {
    const response: CannedResponse = {
      id: crypto.randomUUID(),
      name: newResponse.name,
      content: newResponse.content,
      category: newResponse.category,
      shortcut: newResponse.shortcut || null,
      use_count: 0,
      is_shared: newResponse.is_shared
    };
    setResponses([...responses, response]);
    setIsAddOpen(false);
    setNewResponse({ name: '', content: '', category: 'general', shortcut: '', is_shared: true });
    toast.success('Response added successfully');
  };

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
    
    // Update usage count
    setResponses(responses.map(r => 
      r.id === id ? { ...r, use_count: r.use_count + 1 } : r
    ));
  };

  const filteredResponses = responses.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.shortcut?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      greeting: 'bg-green-500/20 text-green-400 border-green-500/30',
      closing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      technical: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      billing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      escalation: 'bg-red-500/20 text-red-400 border-red-500/30',
      apology: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[category] || colors.general;
  };

  // Extract variables from content ({{variable}})
  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(m => m.replace(/[{}]/g, ''));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search responses or type /shortcut..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Response
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Canned Response</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newResponse.name}
                    onChange={(e) => setNewResponse({ ...newResponse, name: e.target.value })}
                    placeholder="Password Reset Instructions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shortcut</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                    <Input
                      value={newResponse.shortcut}
                      onChange={(e) => setNewResponse({ ...newResponse, shortcut: e.target.value })}
                      placeholder="passreset"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newResponse.category}
                  onValueChange={(v) => setNewResponse({ ...newResponse, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={newResponse.content}
                  onChange={(e) => setNewResponse({ ...newResponse, content: e.target.value })}
                  placeholder="Hi {{customer_name}},&#10;&#10;To reset your password, please follow these steps..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{variable_name}}"} for dynamic content. Variables: {"{{customer_name}}"}, {"{{ticket_id}}"}, {"{{agent_name}}"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newResponse.is_shared}
                  onCheckedChange={(v) => setNewResponse({ ...newResponse, is_shared: v })}
                />
                <Label>Share with team</Label>
              </div>
              <Button
                className="w-full"
                onClick={handleAddResponse}
                disabled={!newResponse.name || !newResponse.content}
              >
                Create Response
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{responses.length}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Zap className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {responses.filter(r => r.shortcut).length}
                </p>
                <p className="text-sm text-muted-foreground">With Shortcuts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Copy className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {responses.reduce((sum, r) => sum + r.use_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Uses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Hash className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responses List */}
      {filteredResponses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No canned responses found. Create your first response above.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredResponses.map((response) => {
            const variables = extractVariables(response.content);
            return (
              <Card key={response.id} className="group hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{response.name}</h3>
                    <Badge variant="outline" className={getCategoryColor(response.category)}>
                      {response.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    {response.shortcut && (
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">/{response.shortcut}</span>
                    )}
                    <span>{response.use_count} uses</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {response.content}
                  </p>
                  {variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {variables.map((v, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {"{{"}{v}{"}}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(response.content, response.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
