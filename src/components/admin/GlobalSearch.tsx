import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, Bot, CreditCard, Building2, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'user' | 'gpt' | 'subscription' | 'msp' | 'audit';
  title: string;
  subtitle: string;
  description: string;
  metadata?: any;
  created_at: string;
  status?: string;
}

export const GlobalSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const { toast } = useToast();

  const searchTypes = [
    { value: 'all', label: 'All Results', icon: Search },
    { value: 'user', label: 'Users', icon: User },
    { value: 'gpt', label: 'GPTs', icon: Bot },
    { value: 'subscription', label: 'Subscriptions', icon: CreditCard },
    { value: 'msp', label: 'MSPs', icon: Building2 },
    { value: 'audit', label: 'Audit Logs', icon: Filter }
  ];

  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search users
      if (searchType === 'all' || searchType === 'user') {
        const { data: userResults } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (userResults) {
          userResults.forEach((user: any) => {
            searchResults.push({
              id: user.id,
              type: 'user',
              title: user.full_name || user.email,
              subtitle: user.email,
              description: `${user.account_type} account • ${user.company_name || 'No company'}`,
              metadata: user,
              created_at: user.created_at,
              status: user.account_type
            });
          });
        }
      }

      // Search GPTs
      if (searchType === 'all' || searchType === 'gpt') {
        const { data: gptResults } = await supabase
          .from('custom_gpts')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (gptResults) {
          gptResults.forEach((gpt: any) => {
            searchResults.push({
              id: gpt.id,
              type: 'gpt',
              title: gpt.name,
              subtitle: `${gpt.ai_model || 'GPT-4'} • ${gpt.chat_count} chats`,
              description: gpt.description || 'No description available',
              metadata: gpt,
              created_at: gpt.created_at,
              status: gpt.is_active ? 'Active' : 'Inactive'
            });
          });
        }
      }

      // Search subscriptions
      if (searchType === 'all' || searchType === 'subscription') {
        const { data: subResults } = await supabase
          .from('subscribers')
          .select('*')
          .or(`subscription_tier.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (subResults) {
          subResults.forEach((sub: any) => {
            searchResults.push({
              id: sub.id,
              type: 'subscription',
              title: `${sub.subscription_tier} Subscription`,
              subtitle: `User ID: ${sub.user_id}`,
              description: `${sub.subscribed ? 'Active' : 'Inactive'} subscription`,
              metadata: sub,
              created_at: sub.created_at,
              status: sub.subscribed ? 'Active' : 'Inactive'
            });
          });
        }
      }

      // Search audit trails
      if (searchType === 'all' || searchType === 'audit') {
        const { data: auditResults } = await supabase
          .from('admin_audit_trails')
          .select('*')
          .or(`admin_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%`)
          .limit(10);
        
        if (auditResults) {
          auditResults.forEach((audit: any) => {
            searchResults.push({
              id: audit.id,
              type: 'audit',
              title: audit.action,
              subtitle: audit.admin_email,
              description: `${audit.resource_type} • ${audit.resource_name || 'N/A'}`,
              metadata: audit,
              created_at: audit.created_at,
              status: 'Logged'
            });
          });
        }
      }

      // Sort by relevance and date
      searchResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setResults(searchResults);
      setTotalResults(searchResults.length);
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchType]);

  const getTypeIcon = (type: string) => {
    const typeInfo = searchTypes.find(t => t.value === type);
    const Icon = typeInfo?.icon || Search;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'default';
      case 'gpt': return 'secondary';
      case 'subscription': return 'outline';
      case 'msp': return 'default';
      case 'audit': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return 'default';
      case 'inactive':
      case 'offline':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Global Search
          </CardTitle>
          <CardDescription>
            Search across all platform data including users, GPTs, subscriptions, and logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, GPTs, subscriptions, audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}

          {!loading && searchTerm && (
            <div className="mb-4 text-sm text-muted-foreground">
              {totalResults} result{totalResults !== 1 ? 's' : ''} found for "{searchTerm}"
            </div>
          )}

          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeColor(result.type)} className="flex items-center gap-1">
                      {getTypeIcon(result.type)}
                      {result.type.toUpperCase()}
                    </Badge>
                    {result.status && (
                      <Badge variant={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                    <div className="text-xs text-muted-foreground mt-1">{result.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(result.created_at), 'MMM dd, yyyy')}</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!loading && searchTerm && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No results found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or search type
              </p>
            </div>
          )}

          {!searchTerm && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Start searching</h3>
              <p className="text-muted-foreground">
                Enter a search term to find users, GPTs, subscriptions, and more
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};