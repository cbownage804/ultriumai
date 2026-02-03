import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Ticket, 
  Shield, 
  Settings,
  Clock,
  Tag,
  Archive,
  Star,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SearchResult {
  id: string;
  type: 'ticket' | 'client' | 'document' | 'security_event' | 'user' | 'policy';
  title: string;
  description: string;
  metadata: {
    created_at: string;
    updated_at?: string;
    author?: string;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
  };
  relevance: number;
  highlight?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  created_at: string;
  results_count: number;
}

interface SearchFilters {
  type: string[];
  date_range: string;
  status: string[];
  priority: string[];
  category: string[];
  author: string[];
  tags: string[];
}

const AdvancedSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    date_range: 'all',
    status: [],
    priority: [],
    category: [],
    author: [],
    tags: []
  });

  useEffect(() => {
    loadSavedSearches();
    loadRecentSearches();
  }, []);

  // Focus search input with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadSavedSearches = () => {
    // Mock saved searches
    setSavedSearches([
      {
        id: '1',
        name: 'High Priority Tickets',
        query: 'priority:high status:open',
        filters: { ...filters, priority: ['high'], status: ['open'] },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        results_count: 23
      },
      {
        id: '2',
        name: 'Security Events This Week',
        query: 'type:security_event date:week',
        filters: { ...filters, type: ['security_event'], date_range: 'week' },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        results_count: 47
      }
    ]);
  };

  const loadRecentSearches = () => {
    // Mock recent searches
    setRecentSearches([
      'malware detection',
      'client onboarding',
      'compliance report',
      'network security'
    ]);
  };

  const performSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    
    try {
      // Add to recent searches
      if (!recentSearches.includes(queryToSearch)) {
        setRecentSearches(prev => [queryToSearch, ...prev.slice(0, 9)]);
      }

      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock search results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          type: 'ticket',
          title: 'Email Security Alert - Phishing Attempt Detected',
          description: 'Multiple phishing emails detected targeting client employees. Immediate action required.',
          metadata: {
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            priority: 'high',
            category: 'security',
            author: 'Security System',
            tags: ['phishing', 'email', 'urgent']
          },
          relevance: 95,
          highlight: 'Phishing emails detected with suspicious attachments targeting...'
        },
        {
          id: '2',
          type: 'client',
          title: 'TechCorp Solutions',
          description: 'Enterprise client with comprehensive security package including endpoint protection and monitoring.',
          metadata: {
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            category: 'enterprise',
            tags: ['enterprise', 'security', 'monitoring']
          },
          relevance: 88
        },
        {
          id: '3',
          type: 'document',
          title: 'Security Incident Response Playbook',
          description: 'Comprehensive guide for handling security incidents and breach response procedures.',
          metadata: {
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            author: 'Security Team',
            category: 'documentation',
            tags: ['incident-response', 'playbook', 'security']
          },
          relevance: 82
        },
        {
          id: '4',
          type: 'security_event',
          title: 'Malware Detection on Endpoint WS-047',
          description: 'Suspicious file activity detected and quarantined on workstation WS-047.',
          metadata: {
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: 'resolved',
            priority: 'medium',
            category: 'malware',
            tags: ['malware', 'endpoint', 'quarantined']
          },
          relevance: 76,
          highlight: 'Malware detected and automatically quarantined...'
        },
        {
          id: '5',
          type: 'policy',
          title: 'Email Security Policy - Version 2.1',
          description: 'Updated email security policy including new threat detection rules and user guidelines.',
          metadata: {
            created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            author: 'Policy Admin',
            status: 'active',
            category: 'policy',
            tags: ['email', 'security', 'policy']
          },
          relevance: 71
        },
        {
          id: '6',
          type: 'user',
          title: 'John Smith - IT Administrator',
          description: 'IT Administrator with full system access and security management privileges.',
          metadata: {
            created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            category: 'admin',
            tags: ['admin', 'it', 'security']
          },
          relevance: 65
        }
      ];

      // Filter results based on active filters
      let filteredResults = mockResults;
      
      if (filters.type.length > 0) {
        filteredResults = filteredResults.filter(r => filters.type.includes(r.type));
      }
      
      if (filters.status.length > 0) {
        filteredResults = filteredResults.filter(r => 
          r.metadata.status && filters.status.includes(r.metadata.status)
        );
      }

      if (filters.priority.length > 0) {
        filteredResults = filteredResults.filter(r => 
          r.metadata.priority && filters.priority.includes(r.metadata.priority)
        );
      }

      // Sort by relevance
      filteredResults.sort((a, b) => b.relevance - a.relevance);

      setResults(filteredResults);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const saveSearch = () => {
    if (!query.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: query.length > 30 ? query.substring(0, 30) + '...' : query,
      query,
      filters: { ...filters },
      created_at: new Date().toISOString(),
      results_count: results.length
    };

    setSavedSearches(prev => [newSavedSearch, ...prev]);
    toast({
      title: "Search Saved",
      description: "Your search has been saved for quick access.",
    });
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    performSearch(savedSearch.query);
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      date_range: 'all',
      status: [],
      priority: [],
      category: [],
      author: [],
      tags: []
    });
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'client': return <User className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'security_event': return <Shield className="h-4 w-4" />;
      case 'policy': return <Settings className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'client': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'document': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'security_event': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'policy': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'user': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200';
    }
  };

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Advanced Search</h2>
          <p className="text-muted-foreground">
            Search across tickets, clients, documents, and security events
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd> to focus search
        </div>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  placeholder="Search tickets, clients, documents, events..."
                  className="pl-10 pr-4"
                />
              </div>
              <Button onClick={() => performSearch()} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-primary/10' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Searches</h4>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((recent, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery(recent);
                        performSearch(recent);
                      }}
                      className="h-8"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {recent}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select
                      value={filters.type.join(',') || "__all__"}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, type: value === "__all__" ? [] : value.split(',') }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        <SelectItem value="ticket">Tickets</SelectItem>
                        <SelectItem value="client">Clients</SelectItem>
                        <SelectItem value="document">Documents</SelectItem>
                        <SelectItem value="security_event">Security Events</SelectItem>
                        <SelectItem value="policy">Policies</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select
                      value={filters.date_range}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, date_range: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status.join(',') || "__all__"}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, status: value === "__all__" ? [] : value.split(',') }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={filters.priority.join(',') || "__all__"}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, priority: value === "__all__" ? [] : value.split(',') }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={filters.category.join(',') || "__all__"}
                      onValueChange={(value) => 
                        setFilters(prev => ({ ...prev, category: value === "__all__" ? [] : value.split(',') }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Categories</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Saved Searches Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Searches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {savedSearches.map((saved) => (
                <div key={saved.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => loadSavedSearch(saved)}
                      className="text-left w-full"
                    >
                      <p className="font-medium text-sm truncate">{saved.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {saved.results_count} results • {new Date(saved.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Star className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {query && (
                <Button variant="outline" size="sm" onClick={saveSearch} className="w-full">
                  <Archive className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3 space-y-6">
          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {results.length} results
              </p>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({results.length})</TabsTrigger>
                  <TabsTrigger value="ticket">Tickets ({results.filter(r => r.type === 'ticket').length})</TabsTrigger>
                  <TabsTrigger value="client">Clients ({results.filter(r => r.type === 'client').length})</TabsTrigger>
                  <TabsTrigger value="document">Docs ({results.filter(r => r.type === 'document').length})</TabsTrigger>
                  <TabsTrigger value="security_event">Events ({results.filter(r => r.type === 'security_event').length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded border ${getTypeColor(result.type)}`}>
                      {getResultIcon(result.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                          <p className="text-muted-foreground mb-3">
                            {result.highlight || result.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="outline" className="capitalize">
                            {result.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {result.relevance}% match
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(result.metadata.created_at).toLocaleDateString()}
                        </span>
                        {result.metadata.author && (
                          <span>
                            <User className="h-3 w-3 inline mr-1" />
                            {result.metadata.author}
                          </span>
                        )}
                        {result.metadata.status && (
                          <Badge variant="secondary" className="text-xs">
                            {result.metadata.status}
                          </Badge>
                        )}
                        {result.metadata.priority && (
                          <Badge 
                            variant={result.metadata.priority === 'high' || result.metadata.priority === 'critical' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {result.metadata.priority}
                          </Badge>
                        )}
                      </div>
                      
                      {result.metadata.tags && result.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {query && results.length === 0 && !isSearching && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}

            {!query && results.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Start searching</h3>
                  <p className="text-muted-foreground">
                    Enter a search term to find tickets, clients, documents, and more
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;