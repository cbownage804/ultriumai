import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, FileText, Key, Server, Shield, BookOpen, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  type: string;
  id: string;
  name: string;
  snippet: string;
  relevance: number;
}

const RESOURCE_ICONS: Record<string, any> = {
  document: FileText, password: Key, configuration: Server,
  ssl_certificate: Shield, runbook: BookOpen, contact: Users,
};

export function AtlasAISearch({ organizationId }: { organizationId?: string }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [aiAnswer, setAIAnswer] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !user) return;
    setSearching(true);
    setAIAnswer('');
    setResults([]);

    try {
      // Search across all Atlas tables
      const tables = [
        { table: 'atlas_documents', type: 'document', nameField: 'title', searchFields: ['title', 'content', 'category'] },
        { table: 'atlas_passwords', type: 'password', nameField: 'name', searchFields: ['name', 'username', 'url', 'notes'] },
        { table: 'atlas_configurations', type: 'configuration', nameField: 'name', searchFields: ['name', 'notes', 'configuration_type'] },
        { table: 'atlas_runbooks', type: 'runbook', nameField: 'title', searchFields: ['title', 'content', 'category'] },
        { table: 'atlas_contacts', type: 'contact', nameField: 'first_name', searchFields: ['first_name', 'last_name', 'email', 'title', 'department'] },
        { table: 'atlas_ssl_certificates', type: 'ssl_certificate', nameField: 'domain', searchFields: ['domain', 'issuer', 'notes'] },
      ];

      const allResults: SearchResult[] = [];

      await Promise.all(tables.map(async ({ table, type, nameField, searchFields }) => {
        // Use ilike on name field for basic search
        let q = (supabase as any).from(table).select('*').eq('user_id', user.id);
        if (organizationId) q = q.eq('organization_id', organizationId);
        q = q.or(searchFields.map(f => `${f}.ilike.%${query}%`).join(','));
        const { data } = await q.limit(5);

        (data || []).forEach((item: any) => {
          const name = type === 'contact' ? `${item.first_name} ${item.last_name}` : item[nameField];
          const snippetFields = searchFields.filter(f => f !== nameField);
          const snippet = snippetFields.map(f => item[f]).filter(Boolean).join(' • ').slice(0, 120);
          allResults.push({ type, id: item.id, name, snippet: snippet || 'No preview', relevance: 0.8 });
        });
      }));

      setResults(allResults);

      // Get AI summary if results found
      if (allResults.length > 0) {
        const context = allResults.slice(0, 8).map(r => `[${r.type}] ${r.name}: ${r.snippet}`).join('\n');
        const { data: aiData } = await supabase.functions.invoke('ai-chat', {
          body: {
            message: `Based on this IT documentation data, answer the question: "${query}"\n\nContext:\n${context}`,
            model: 'gpt-4o-mini',
            systemPrompt: 'You are an IT documentation assistant. Answer questions based on the provided documentation context. Be concise and specific. If the answer contains credentials, mention they exist but suggest the user view them directly. Format as markdown.',
          },
        });
        if (aiData?.response) setAIAnswer(aiData.response);
      } else {
        setAIAnswer('No matching documentation found. Try a different search query.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setAIAnswer('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          AI Search & Q&A
        </h2>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ask anything... e.g., 'What's the Wi-Fi password for Contoso?' or 'Show me all firewall configs'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
          Search
        </Button>
      </div>

      {/* AI Answer */}
      {aiAnswer && (
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Cortex AI Answer</span>
            </div>
            <div className="text-sm whitespace-pre-wrap">{aiAnswer}</div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {results.map((r, i) => {
              const Icon = RESOURCE_ICONS[r.type] || FileText;
              return (
                <Card key={`${r.type}-${r.id}-${i}`} className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-3 flex items-start gap-3">
                    <Icon className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{r.type.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {!searching && results.length === 0 && !aiAnswer && (
        <div className="text-center py-12 space-y-2">
          <Search className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Search across all documentation — documents, passwords, configs, contacts, and more.</p>
          <p className="text-sm text-muted-foreground">Try: "domain admin credentials", "firewall configuration", "onboarding checklist"</p>
        </div>
      )}
    </div>
  );
}
