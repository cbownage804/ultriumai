import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Copy, Check, ChevronRight, Lock, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  auth: boolean;
  category: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response?: string;
}

const ENDPOINTS: APIEndpoint[] = [
  // GPT
  { method: 'GET', path: '/api/v1/gpts', description: 'List all custom GPTs', auth: true, category: 'Custom GPTs' },
  { method: 'POST', path: '/api/v1/gpts', description: 'Create a new custom GPT', auth: true, category: 'Custom GPTs', params: [
    { name: 'name', type: 'string', required: true, description: 'GPT display name' },
    { name: 'system_prompt', type: 'string', required: true, description: 'System instructions' },
    { name: 'model', type: 'string', required: false, description: 'Model ID (default: gpt-4o-mini)' },
  ]},
  { method: 'GET', path: '/api/v1/gpts/:id', description: 'Get GPT details', auth: true, category: 'Custom GPTs' },
  { method: 'DELETE', path: '/api/v1/gpts/:id', description: 'Delete a GPT', auth: true, category: 'Custom GPTs' },
  // Chat
  { method: 'POST', path: '/api/v1/chat/completions', description: 'Send a chat message to a GPT', auth: true, category: 'Chat', params: [
    { name: 'gpt_id', type: 'string', required: true, description: 'Target GPT ID' },
    { name: 'message', type: 'string', required: true, description: 'User message' },
    { name: 'conversation_id', type: 'string', required: false, description: 'Existing conversation ID' },
  ]},
  { method: 'GET', path: '/api/v1/conversations', description: 'List conversations', auth: true, category: 'Chat' },
  // Knowledge
  { method: 'POST', path: '/api/v1/knowledge', description: 'Upload knowledge document', auth: true, category: 'Knowledge Base', params: [
    { name: 'gpt_id', type: 'string', required: true, description: 'GPT to attach knowledge to' },
    { name: 'file', type: 'file', required: true, description: 'Document file (PDF, TXT, MD)' },
  ]},
  { method: 'GET', path: '/api/v1/knowledge/:gpt_id', description: 'List knowledge for a GPT', auth: true, category: 'Knowledge Base' },
  // API Keys
  { method: 'GET', path: '/api/v1/keys', description: 'List API keys', auth: true, category: 'API Keys' },
  { method: 'POST', path: '/api/v1/keys', description: 'Create a new API key', auth: true, category: 'API Keys' },
  { method: 'DELETE', path: '/api/v1/keys/:id', description: 'Revoke an API key', auth: true, category: 'API Keys' },
  // Usage
  { method: 'GET', path: '/api/v1/usage', description: 'Get credit usage summary', auth: true, category: 'Usage & Billing' },
  { method: 'GET', path: '/api/v1/usage/history', description: 'Detailed usage history', auth: true, category: 'Usage & Billing' },
  // Health
  { method: 'GET', path: '/api/v1/health', description: 'API health check', auth: false, category: 'System' },
  { method: 'GET', path: '/api/v1/status', description: 'Platform status', auth: false, category: 'System' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  DELETE: 'bg-destructive/10 text-destructive border-destructive/20',
  PATCH: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
};

export default function APIDocsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const categories = [...new Set(ENDPOINTS.map(e => e.category))];

  const filtered = ENDPOINTS.filter(e =>
    e.path.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hub')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">API Reference</h1>
            <p className="text-sm text-muted-foreground">UltriumAI REST API documentation</p>
          </div>
        </div>

        {/* Base URL */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Base URL</p>
                <code className="text-sm font-mono text-primary">https://api.ultriumai.com</code>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Globe className="h-3 w-3" />
                v1
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Endpoints by category */}
        <div className="space-y-8">
          {categories.map(cat => {
            const endpoints = filtered.filter(e => e.category === cat);
            if (endpoints.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground/50 font-semibold mb-3">{cat}</h3>
                <div className="space-y-2">
                  {endpoints.map(ep => {
                    const key = `${ep.method}-${ep.path}`;
                    const isExpanded = expandedEndpoint === key;
                    return (
                      <Card key={key} className="overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                        >
                          <Badge variant="outline" className={`font-mono text-[10px] min-w-[52px] justify-center ${methodColors[ep.method]}`}>
                            {ep.method}
                          </Badge>
                          <code className="text-sm font-mono flex-1 truncate">{ep.path}</code>
                          <span className="text-xs text-muted-foreground hidden md:block">{ep.description}</span>
                          {ep.auth && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                          <ChevronRight className={`h-4 w-4 text-muted-foreground/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border/50 px-4 py-4 bg-muted/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">{ep.description}</p>
                              <button
                                onClick={() => copyPath(ep.path)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {copiedPath === ep.path ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                {copiedPath === ep.path ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            {ep.auth && (
                              <div className="flex items-center gap-2 text-xs text-amber-500">
                                <Lock className="h-3 w-3" />
                                Requires API key in Authorization header
                              </div>
                            )}

                            {ep.params && ep.params.length > 0 && (
                              <div>
                                <p className="text-xs font-medium mb-2">Parameters</p>
                                <div className="space-y-1.5">
                                  {ep.params.map(p => (
                                    <div key={p.name} className="flex items-start gap-3 text-xs">
                                      <code className="text-primary font-mono min-w-[120px]">{p.name}</code>
                                      <Badge variant="outline" className="text-[10px] font-mono">{p.type}</Badge>
                                      {p.required && <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">required</Badge>}
                                      <span className="text-muted-foreground">{p.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Example curl */}
                            <div>
                              <p className="text-xs font-medium mb-2">Example</p>
                              <pre className="bg-muted/30 rounded-md p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto">
{`curl -X ${ep.method} https://api.ultriumai.com${ep.path} \\
${ep.auth ? '  -H "Authorization: Bearer YOUR_API_KEY" \\' : ''}
  -H "Content-Type: application/json"`}
                              </pre>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
