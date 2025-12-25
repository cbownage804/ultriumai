import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Mail, Globe, AlertTriangle, Shield, Loader2, Calendar, Users, RefreshCw, 
  Trash2, Phone, CreditCard, MapPin, Key, User, Database, Lock, EyeOff, 
  Search, ChevronLeft, ChevronRight, Link2, FileText, Upload, ArrowUpDown 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Breach {
  name: string;
  title: string;
  domain: string;
  breach_date: string;
  pwn_count: number;
  data_classes: string[];
  is_verified: boolean;
}

interface LeakedData {
  database_name: string;
  email?: string;
  username?: string;
  password?: string;
  hashed_password?: string;
  name?: string;
  phone?: string;
  address?: string;
  ip_address?: string;
}

// Map data classes to icons and colors for visual highlighting
const dataClassConfig: Record<string, { icon: React.ReactNode; color: string; sensitive: boolean }> = {
  'Phone numbers': { icon: <Phone className="h-3 w-3" />, color: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30', sensitive: true },
  'Passwords': { icon: <Key className="h-3 w-3" />, color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30', sensitive: true },
  'Credit cards': { icon: <CreditCard className="h-3 w-3" />, color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30', sensitive: true },
  'Physical addresses': { icon: <MapPin className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30', sensitive: true },
  'Email addresses': { icon: <Mail className="h-3 w-3" />, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30', sensitive: false },
  'Names': { icon: <User className="h-3 w-3" />, color: 'bg-muted text-muted-foreground', sensitive: false },
  'Usernames': { icon: <User className="h-3 w-3" />, color: 'bg-muted text-muted-foreground', sensitive: false },
};

const getDataClassStyle = (dataClass: string) => {
  return dataClassConfig[dataClass] || { icon: null, color: 'bg-muted text-muted-foreground', sensitive: false };
};

const ITEMS_PER_PAGE = 10;

export const DarkWebMonitor = () => {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [urlToScan, setUrlToScan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [monitoredItems, setMonitoredItems] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [urlScanResults, setUrlScanResults] = useState<any>(null);
  const { user } = useAuth();

  // Pagination, sorting, and search state for leaked data
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'database' | 'email' | 'name'>('database');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (user) loadMonitoredItems();
  }, [user]);

  // Reset pagination when results change
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [results]);

  const loadMonitoredItems = async () => {
    const { data, error } = await supabase
      .from('dark_web_monitors')
      .select('*')
      .eq('user_id', user?.id)
      .eq('monitor_type', 'email')
      .order('last_checked', { ascending: false });
    
    if (error) {
      console.error('Error loading monitors:', error);
    } else {
      setMonitoredItems(data || []);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const checkEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address (e.g., user@example.com)');
      return;
    }

    setIsLoading(true);
    setLoadingType('email');
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { action: 'check_email', email, user_id: user?.id }
      });

      if (error) throw error;
      
      setResults(data);
      
      if (data.leakedData?.length > 0) {
        toast.warning(`Found ${data.leakedData.length} leaked credentials!`);
      } else if (data.breaches?.length > 0) {
        toast.warning(`Found ${data.breaches.length} breaches for this email`);
      } else {
        toast.success('No breaches found for this email!');
      }
      
      loadMonitoredItems();
    } catch (error: any) {
      console.error('Check error:', error);
      toast.error(error.message || 'Check failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const checkDomain = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    setIsLoading(true);
    setLoadingType('domain');
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { action: 'check_domain', domain, user_id: user?.id }
      });

      if (error) throw error;
      setResults(data);
      
      if (data.leakedData?.length > 0) {
        toast.warning(`Found ${data.dehashedTotal || data.leakedData.length} leaked credentials!`);
      } else {
        toast.success('Domain breach check complete');
      }
    } catch (error: any) {
      console.error('Check error:', error);
      toast.error(error.message || 'Check failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const scanUrl = async () => {
    if (!urlToScan.trim()) {
      toast.error('Please enter a URL to scan');
      return;
    }

    setIsLoading(true);
    setLoadingType('url');
    setUrlScanResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { 
          url: urlToScan, 
          options: { 
            formats: ['markdown', 'links'],
            onlyMainContent: true 
          } 
        }
      });

      if (error) throw error;
      
      setUrlScanResults(data);
      toast.success('URL scanned successfully');
    } catch (error: any) {
      console.error('URL scan error:', error);
      toast.error(error.message || 'URL scan failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const deleteMonitor = async (id: string) => {
    const { error } = await supabase
      .from('dark_web_monitors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete monitor');
    } else {
      toast.success('Monitor removed');
      loadMonitoredItems();
    }
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      unknown: 'bg-muted'
    };
    return <Badge className={colors[level] || 'bg-muted'}>{level?.toUpperCase()}</Badge>;
  };

  // Get sensitive data leaked across all breaches
  const getSensitiveDataSummary = (breaches: Breach[]) => {
    const allDataClasses = new Set<string>();
    breaches.forEach(b => b.data_classes?.forEach(dc => allDataClasses.add(dc)));
    return Array.from(allDataClasses).filter(dc => getDataClassStyle(dc).sensitive);
  };

  // Filter and sort leaked data
  const filteredAndSortedData = useMemo(() => {
    if (!results?.leakedData) return [];
    
    let data = [...results.leakedData];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      data = data.filter((leak: LeakedData) => 
        leak.email?.toLowerCase().includes(query) ||
        leak.username?.toLowerCase().includes(query) ||
        leak.name?.toLowerCase().includes(query) ||
        leak.database_name?.toLowerCase().includes(query) ||
        leak.phone?.includes(query) ||
        leak.address?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    data.sort((a: LeakedData, b: LeakedData) => {
      let valA = '';
      let valB = '';
      
      switch (sortBy) {
        case 'database':
          valA = a.database_name || '';
          valB = b.database_name || '';
          break;
        case 'email':
          valA = a.email || '';
          valB = b.email || '';
          break;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
      }
      
      const comparison = valA.localeCompare(valB);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return data;
  }, [results?.leakedData, searchQuery, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="breach" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breach" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Breach Check
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Link Scanner
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="breach" className="space-y-6 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Email Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Breach Check
                </CardTitle>
                <CardDescription>
                  Check if an email has been exposed in data breaches. Shows leaked passwords, phone numbers, addresses, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkEmail()}
                  />
                  <Button onClick={checkEmail} disabled={isLoading}>
                    {loadingType === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Domain Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Domain Breach Check
                </CardTitle>
                <CardDescription>
                  Check if a domain has been involved in breaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkDomain()}
                  />
                  <Button onClick={checkDomain} disabled={isLoading}>
                    {loadingType === 'domain' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Scan Results
                  </CardTitle>
                  {getRiskBadge(results.risk_level)}
                </div>
                <CardDescription>
                  {results.leakedData?.length > 0 
                    ? `Found ${results.dehashedTotal || results.leakedData.length} leaked credentials${results.dehashedTotal > 50 ? ` (showing up to 50)` : ''}`
                    : results.breaches?.length > 0 
                      ? `Found ${results.breaches.length} breaches`
                      : results.message || 'Scan complete'
                  }
                  {results.checked_at && ` • Checked: ${new Date(results.checked_at).toLocaleString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.simulated && (
                  <div className="p-4 bg-yellow-500/10 rounded-lg">
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                      ⚠️ {results.message}
                    </p>
                  </div>
                )}

                {/* Actual Leaked Data from Dehashed */}
                {results.leakedData?.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Leaked Credentials Found ({filteredAndSortedData.length} of {results.dehashedTotal || results.leakedData.length})
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="text-xs"
                      >
                        {showPasswords ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                        {showPasswords ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                    
                    {/* Search and Sort Controls */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by email, name, username, database..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {paginatedData.map((leak: LeakedData, idx: number) => (
                        <div key={idx} className="p-3 bg-background/50 rounded-lg border border-red-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30">
                              {leak.database_name}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {leak.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-mono text-xs">{showPasswords ? leak.email : '***@***'}</span>
                              </div>
                            )}
                            {leak.username && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">User:</span>
                                <span className="font-mono text-xs">{showPasswords ? leak.username : '****'}</span>
                              </div>
                            )}
                            {leak.password && (
                              <div className="flex items-center gap-1">
                                <Key className="h-3 w-3 text-red-500" />
                                <span className="text-red-500">Pass:</span>
                                <span className="font-mono text-xs text-red-500">{showPasswords ? leak.password : '••••••••'}</span>
                              </div>
                            )}
                            {leak.hashed_password && (
                              <div className="flex items-center gap-1">
                                <Lock className="h-3 w-3 text-orange-500" />
                                <span className="text-orange-500">Hash:</span>
                                <span className="font-mono text-xs">{showPasswords ? leak.hashed_password : '••••••••'}</span>
                              </div>
                            )}
                            {leak.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-orange-500" />
                                <span className="text-orange-500">Phone:</span>
                                <span className="font-mono text-xs">{showPasswords ? leak.phone : '***-***-****'}</span>
                              </div>
                            )}
                            {leak.address && (
                              <div className="flex items-center gap-1 col-span-2">
                                <MapPin className="h-3 w-3 text-yellow-500" />
                                <span className="text-yellow-500">Address:</span>
                                <span className="font-mono text-xs truncate">{showPasswords ? leak.address : '****'}</span>
                              </div>
                            )}
                            {leak.name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Name:</span>
                                <span className="text-xs">{showPasswords ? leak.name : '****'}</span>
                              </div>
                            )}
                            {leak.ip_address && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">IP:</span>
                                <span className="font-mono text-xs">{showPasswords ? leak.ip_address : '***.***.***.***'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-red-500/20">
                        <p className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages} ({filteredAndSortedData.length} results)
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          {/* Page number buttons */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-red-400 mt-3">
                      ⚠️ These are actual leaked credentials. Change affected passwords immediately and enable 2FA where possible.
                    </p>
                  </div>
                )}

                 {results.dehashedChecked && results.dehashedStatus === 404 && !results.leakedData?.length && (
                   <div className="p-3 bg-muted/40 border border-border rounded-lg">
                     <p className="text-sm text-muted-foreground">
                       Dehashed was checked{results.dehashedQueryUsed ? ` (query: ${results.dehashedQueryUsed})` : ''} and returned no matches.
                     </p>
                   </div>
                 )}

                 {results.dehashedError && (
                   <div className="p-3 bg-muted/40 border border-border rounded-lg">
                     <p className="text-sm text-muted-foreground">Dehashed: {results.dehashedError}</p>
                   </div>
                 )}

                {/* Sensitive Data Summary from HIBP */}
                {results.breaches?.length > 0 && !results.leakedData?.length && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Exposed Data Types
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getSensitiveDataSummary(results.breaches).map((dc: string) => {
                        const style = getDataClassStyle(dc);
                        return (
                          <Badge key={dc} variant="outline" className={`${style.color} border flex items-center gap-1`}>
                            {style.icon}
                            {dc}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      This data may have been leaked and could be used for identity theft, phishing, or fraud.
                    </p>
                  </div>
                )}

                {results.breaches?.length === 0 && !results.leakedData?.length && !results.simulated && (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      No breaches found! This email is not in known data breaches.
                    </span>
                  </div>
                )}

                {/* Breach list from HIBP */}
                {results.breaches?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Breach History ({results.breaches.length})</h4>
                    {results.breaches.map((breach: Breach, idx: number) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{breach.title || breach.name}</h4>
                            <p className="text-sm text-muted-foreground">{breach.domain}</p>
                          </div>
                          {breach.is_verified && <Badge variant="outline">Verified</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(breach.breach_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{breach.pwn_count?.toLocaleString()} accounts affected</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Leaked data in this breach:</p>
                          <div className="flex flex-wrap gap-1">
                            {breach.data_classes?.map((dc: string) => {
                              const style = getDataClassStyle(dc);
                              return (
                                <Badge key={dc} variant="outline" className={`text-xs ${style.color} border flex items-center gap-1`}>
                                  {style.icon}
                                  {dc}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.pastes?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Paste Exposures ({results.pastes.length})</h4>
                    <div className="space-y-2">
                      {results.pastes.map((paste: any, idx: number) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm">
                          <p className="font-medium">{paste.source}: {paste.title || paste.id}</p>
                          <p className="text-muted-foreground">
                            {paste.date && new Date(paste.date).toLocaleDateString()} • {paste.email_count} emails
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Monitored Items History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Scan History
                  </CardTitle>
                  <CardDescription>
                    Previously checked emails and domains
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadMonitoredItems}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monitoredItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No scan history yet. Run a scan above to get started.</p>
                ) : (
                  monitoredItems.map((monitor) => (
                    <div key={monitor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{monitor.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Last checked: {monitor.last_checked ? new Date(monitor.last_checked).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={monitor.breach_count > 0 ? 'destructive' : 'secondary'}>
                          {monitor.breach_count || 0} breaches
                        </Badge>
                        {monitor.paste_count > 0 && (
                          <Badge variant="outline">{monitor.paste_count} pastes</Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMonitor(monitor.id)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                URL / Link Scanner
              </CardTitle>
              <CardDescription>
                Scan any URL to extract content, analyze structure, and discover linked resources. Useful for threat intelligence and phishing analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/suspicious-page"
                  value={urlToScan}
                  onChange={(e) => setUrlToScan(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scanUrl()}
                />
                <Button onClick={scanUrl} disabled={isLoading}>
                  {loadingType === 'url' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {urlScanResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Scan Results
                </CardTitle>
                <CardDescription>
                  Content and links extracted from the scanned URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {urlScanResults.data?.metadata && (
                  <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <h4 className="font-semibold">{urlScanResults.data.metadata.title || 'No title'}</h4>
                    {urlScanResults.data.metadata.description && (
                      <p className="text-sm text-muted-foreground">{urlScanResults.data.metadata.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {urlScanResults.data.metadata.sourceURL && (
                        <Badge variant="outline">{urlScanResults.data.metadata.sourceURL}</Badge>
                      )}
                      {urlScanResults.data.metadata.statusCode && (
                        <Badge variant={urlScanResults.data.metadata.statusCode === 200 ? 'secondary' : 'destructive'}>
                          Status: {urlScanResults.data.metadata.statusCode}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {urlScanResults.data?.links?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Discovered Links ({urlScanResults.data.links.length})</h4>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {urlScanResults.data.links.slice(0, 50).map((link: string, idx: number) => (
                        <div key={idx} className="text-xs font-mono p-2 bg-muted/30 rounded truncate">
                          {link}
                        </div>
                      ))}
                      {urlScanResults.data.links.length > 50 && (
                        <p className="text-xs text-muted-foreground">+ {urlScanResults.data.links.length - 50} more links</p>
                      )}
                    </div>
                  </div>
                )}

                {urlScanResults.data?.markdown && (
                  <div>
                    <h4 className="font-medium mb-2">Page Content</h4>
                    <div className="max-h-96 overflow-y-auto p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                      {urlScanResults.data.markdown.slice(0, 5000)}
                      {urlScanResults.data.markdown.length > 5000 && '...'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="document" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Scanner
              </CardTitle>
              <CardDescription>
                Upload documents (PDF, DOCX, etc.) to scan for sensitive information, PII, credentials, or security risks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  Document scanning coming soon. Upload PDF, DOCX, or other document formats to scan for sensitive data.
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
