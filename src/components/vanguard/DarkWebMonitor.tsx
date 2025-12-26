import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Mail, Globe, AlertTriangle, Shield, Loader2, Calendar, Users, RefreshCw, 
  Trash2, Phone, CreditCard, MapPin, Key, User, Database, Lock, EyeOff, 
  Search, ChevronLeft, ChevronRight, Link2, FileText, Upload, ArrowUpDown,
  Download, Clock, Wifi, Server, CheckCircle, XCircle, ShieldAlert, Bug
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';

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

interface DocumentFinding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  samples: string[];
  description: string;
}

interface IPReputationResult {
  ip: string;
  is_malicious: boolean;
  risk_score: number;
  risk_level: string;
  categories: string[];
  abuse_reports: number;
  country: string | null;
  isp: string | null;
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_datacenter: boolean;
  last_reported: string | null;
  blocklists: string[];
  recommendations: string[];
}

interface MalwareResult {
  is_malicious: boolean;
  threat_score: number;
  threat_level: string;
  detections: {
    type: string;
    severity: string;
    description: string;
    matches: string[];
  }[];
  file_info: {
    name: string;
    size: number;
    type: string;
  };
  recommendations: string[];
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
  const [ipToCheck, setIpToCheck] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [monitoredItems, setMonitoredItems] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [urlScanResults, setUrlScanResults] = useState<any>(null);
  const [documentResults, setDocumentResults] = useState<any>(null);
  const [ipResults, setIpResults] = useState<IPReputationResult | null>(null);
  const [malwareResults, setMalwareResults] = useState<MalwareResult | null>(null);
  const { user } = useAuth();

  // Pagination, sorting, and search state for leaked data
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'database' | 'email' | 'name'>('database');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

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
      .in('monitor_type', ['email', 'domain'])
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
      
      loadMonitoredItems();
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

  const checkIP = async () => {
    if (!ipToCheck.trim()) {
      toast.error('Please enter an IP address');
      return;
    }

    setIsLoading(true);
    setLoadingType('ip');
    setIpResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('ip-reputation', {
        body: { ip: ipToCheck }
      });

      if (error) throw error;
      
      if (data.success) {
        setIpResults(data.data);
        if (data.data.is_malicious) {
          toast.warning(`IP ${ipToCheck} has a poor reputation!`);
        } else {
          toast.success('IP reputation check complete');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('IP check error:', error);
      toast.error(error.message || 'IP check failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const onDocumentDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsLoading(true);
    setLoadingType('document');
    setDocumentResults(null);

    try {
      // Read file content
      const content = await file.text();
      
      const { data, error } = await supabase.functions.invoke('document-scanner', {
        body: { 
          content, 
          filename: file.name,
          contentType: file.type 
        }
      });

      if (error) throw error;
      
      setDocumentResults(data);
      
      if (data.risk_level === 'critical' || data.risk_level === 'high') {
        toast.warning(`Found ${data.total_findings} sensitive data occurrences!`);
      } else if (data.findings?.length > 0) {
        toast.info(`Scan complete: ${data.summary}`);
      } else {
        toast.success('No sensitive data detected');
      }
    } catch (error: any) {
      console.error('Document scan error:', error);
      toast.error(error.message || 'Document scan failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDocumentDrop,
    accept: {
      'text/plain': ['.txt', '.log', '.csv', '.json', '.xml', '.yaml', '.yml', '.md'],
      'application/json': ['.json'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isLoading,
  });

  // Malware scan callback
  const onMalwareDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setIsLoading(true);
    setLoadingType('malware');
    setMalwareResults(null);

    try {
      const content = await file.text();
      
      const { data, error } = await supabase.functions.invoke('malware-scanner', {
        body: { 
          content, 
          filename: file.name,
          contentType: file.type 
        }
      });

      if (error) throw error;
      
      if (data.success) {
        setMalwareResults(data.data);
        
        if (data.data.is_malicious) {
          toast.error(`Malicious content detected! Threat level: ${data.data.threat_level.toUpperCase()}`);
        } else {
          toast.success('No malicious content detected');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Malware scan error:', error);
      toast.error(error.message || 'Malware scan failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  }, []);

  const { getRootProps: getMalwareRootProps, getInputProps: getMalwareInputProps, isDragActive: isMalwareDragActive } = useDropzone({
    onDrop: onMalwareDrop,
    accept: {
      'text/plain': ['.txt', '.log', '.bat', '.sh', '.ps1', '.cmd', '.vbs', '.js'],
      'text/html': ['.html', '.htm'],
      'application/javascript': ['.js'],
      'text/x-python': ['.py'],
      'application/x-httpd-php': ['.php'],
      'application/octet-stream': ['.exe', '.dll', '.bin'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isLoading,
  });

  const deleteMonitor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the click on parent
    const { error } = await supabase
      .from('dark_web_monitors')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete monitor');
    } else {
      toast.success('Monitor removed');
      if (selectedHistoryId === id) {
        setSelectedHistoryId(null);
        setResults(null);
      }
      loadMonitoredItems();
    }
  };

  const loadHistoryReport = (monitor: any) => {
    setSelectedHistoryId(monitor.id);
    
    // Reconstruct results from stored breach_data
    const reconstructedResults = {
      breaches: monitor.breach_data || [],
      pastes: monitor.paste_data || [],
      leakedData: [], // Leaked data is not stored in history currently
      risk_level: monitor.breach_count > 5 ? 'critical' : monitor.breach_count > 2 ? 'high' : monitor.breach_count > 0 ? 'medium' : 'low',
      checked_at: monitor.last_checked,
      fromHistory: true,
      historyEmail: monitor.email,
      historyDomain: monitor.domain,
    };
    
    setResults(reconstructedResults);
    toast.success(`Loaded report for ${monitor.email || monitor.domain}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMonitoredItems();
    setIsRefreshing(false);
    toast.success('Scan history refreshed');
  };

  // Export functions
  const exportToCSV = () => {
    if (!results?.leakedData?.length) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Database', 'Email', 'Username', 'Name', 'Phone', 'Has Password', 'Has Hash'];
    const rows = results.leakedData.map((leak: LeakedData) => [
      leak.database_name || '',
      leak.email || '',
      leak.username || '',
      leak.name || '',
      leak.phone || '',
      leak.password ? 'Yes' : 'No',
      leak.hashed_password ? 'Yes' : 'No',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breach-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportToPDF = () => {
    if (!results) {
      toast.error('No data to export');
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(20);
    doc.text('Dark Web Breach Report', 20, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
    yPos += 10;
    doc.text(`Risk Level: ${results.risk_level?.toUpperCase() || 'Unknown'}`, 20, yPos);
    yPos += 15;

    if (results.leakedData?.length > 0) {
      doc.setFontSize(14);
      doc.text(`Leaked Credentials Found: ${results.dehashedTotal || results.leakedData.length}`, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      results.leakedData.slice(0, 20).forEach((leak: LeakedData) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${leak.database_name}: ${leak.email || leak.username || 'N/A'}`, 25, yPos);
        yPos += 6;
      });

      if (results.leakedData.length > 20) {
        yPos += 5;
        doc.text(`... and ${results.leakedData.length - 20} more entries`, 25, yPos);
      }
    }

    if (results.breaches?.length > 0) {
      yPos += 15;
      doc.setFontSize(14);
      doc.text(`Breach History: ${results.breaches.length} breaches`, 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      results.breaches.slice(0, 10).forEach((breach: Breach) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${breach.title || breach.name} (${new Date(breach.breach_date).toLocaleDateString()})`, 25, yPos);
        yPos += 6;
      });
    }

    doc.save(`breach-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported');
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      clean: 'bg-green-500',
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="breach" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Breach</span>
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="malware" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Malware</span>
          </TabsTrigger>
          <TabsTrigger value="ip" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">IP</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduled</span>
          </TabsTrigger>
        </TabsList>

        {/* Breach Check Tab */}
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
                  Check if an email has been exposed in data breaches
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
                  <div className="flex items-center gap-2">
                    {getRiskBadge(results.risk_level)}
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
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
                {/* Show if loaded from history */}
                {results.fromHistory && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Loaded from scan history for <span className="font-medium">{results.historyEmail || results.historyDomain}</span>
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

                {results.breaches?.length === 0 && !results.leakedData?.length && (
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
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                  {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
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
                    <div 
                      key={monitor.id} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedHistoryId === monitor.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
                      }`}
                      onClick={() => loadHistoryReport(monitor)}
                    >
                      <div className="flex items-center gap-3">
                        {monitor.monitor_type === 'domain' ? (
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{monitor.email || monitor.domain}</p>
                          <p className="text-xs text-muted-foreground">
                            {monitor.monitor_type === 'domain' ? 'Domain' : 'Email'} • Last checked: {monitor.last_checked ? new Date(monitor.last_checked).toLocaleString() : 'Never'}
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
                          onClick={(e) => deleteMonitor(monitor.id, e)}
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

        {/* Link Scanner Tab */}
        <TabsContent value="link" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                URL / Link Scanner
              </CardTitle>
              <CardDescription>
                Scan any URL to extract content, analyze structure, and discover linked resources
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

        {/* Document Scanner Tab */}
        <TabsContent value="document" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Scanner
              </CardTitle>
              <CardDescription>
                Upload documents to scan for sensitive information like SSNs, credit cards, API keys, and passwords
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                {loadingType === 'document' ? (
                  <>
                    <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Scanning document...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-2">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: TXT, LOG, CSV, JSON, XML, YAML, MD (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {documentResults && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Scan Results: {documentResults.filename}
                  </CardTitle>
                  {getRiskBadge(documentResults.risk_level)}
                </div>
                <CardDescription>
                  Risk Score: {documentResults.risk_score}/100 • {documentResults.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {documentResults.findings?.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {documentResults.findings.map((finding: DocumentFinding, idx: number) => (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-lg border ${
                            finding.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                            finding.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                            finding.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-muted/50 border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{finding.type}</h4>
                            <div className="flex items-center gap-2">
                              {getRiskBadge(finding.severity)}
                              <Badge variant="outline">{finding.count} found</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                          {finding.samples.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {finding.samples.map((sample, sIdx) => (
                                <code key={sIdx} className="text-xs bg-background/50 px-2 py-1 rounded">
                                  {sample}
                                </code>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {documentResults.recommendations?.length > 0 && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Recommendations
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {documentResults.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      No sensitive data detected in this document
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Malware Scanner Tab */}
        <TabsContent value="malware" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Malware Scanner
              </CardTitle>
              <CardDescription>
                Upload files to scan for malicious content, scripts, and potential threats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getMalwareRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isMalwareDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getMalwareInputProps()} />
                {loadingType === 'malware' ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Scanning for malware...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {isMalwareDragActive
                        ? 'Drop the file here...'
                        : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Scripts, executables, HTML, batch files (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {malwareResults && (
                <div className="mt-6 space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    malwareResults.is_malicious 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-green-500/10 border-green-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {malwareResults.is_malicious ? (
                          <XCircle className="h-6 w-6 text-red-500" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                        <h4 className="font-semibold">
                          {malwareResults.is_malicious ? 'Threats Detected!' : 'File Appears Safe'}
                        </h4>
                      </div>
                      {getRiskBadge(malwareResults.threat_level)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">File:</span>
                        <span className="ml-2 font-mono">{malwareResults.file_info.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Threat Score:</span>
                        <span className="ml-2 font-bold">{malwareResults.threat_score}/100</span>
                      </div>
                    </div>

                    {malwareResults.detections.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-semibold text-sm">Detections:</h5>
                        {malwareResults.detections.map((detection, idx) => (
                          <div key={idx} className="p-3 bg-background/50 rounded-lg border border-red-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={
                                detection.severity === 'critical' ? 'bg-red-500' :
                                detection.severity === 'high' ? 'bg-orange-500' :
                                detection.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                              }>
                                {detection.severity.toUpperCase()}
                              </Badge>
                              <span className="font-medium">{detection.type}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{detection.description}</p>
                            {detection.matches.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">Matches:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {detection.matches.slice(0, 5).map((match, i) => (
                                    <code key={i} className="text-xs px-1 py-0.5 bg-red-500/20 rounded">
                                      {match.length > 30 ? match.substring(0, 30) + '...' : match}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {malwareResults.recommendations.length > 0 && (
                      <div className="mt-4 p-3 bg-background/50 rounded-lg">
                        <h5 className="font-semibold text-sm mb-2">Recommendations:</h5>
                        <ul className="space-y-1">
                          {malwareResults.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Reputation Tab */}
        <TabsContent value="ip" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                IP Reputation Check
              </CardTitle>
              <CardDescription>
                Check if an IP address is on blocklists or associated with malicious activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="8.8.8.8"
                  value={ipToCheck}
                  onChange={(e) => setIpToCheck(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && checkIP()}
                />
                <Button onClick={checkIP} disabled={isLoading}>
                  {loadingType === 'ip' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {ipResults && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    IP: {ipResults.ip}
                  </CardTitle>
                  {getRiskBadge(ipResults.risk_level)}
                </div>
                <CardDescription>
                  Risk Score: {ipResults.risk_score}/100 • {ipResults.abuse_reports} abuse reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Country</p>
                    <p className="font-semibold">{ipResults.country || 'Unknown'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">ISP</p>
                    <p className="font-semibold text-sm truncate">{ipResults.isp || 'Unknown'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Last Reported</p>
                    <p className="font-semibold text-sm">
                      {ipResults.last_reported ? new Date(ipResults.last_reported).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Abuse Reports</p>
                    <p className="font-semibold">{ipResults.abuse_reports}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ipResults.is_tor && (
                    <Badge variant="destructive">Tor Exit Node</Badge>
                  )}
                  {ipResults.is_vpn && (
                    <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30">VPN/Proxy</Badge>
                  )}
                  {ipResults.is_datacenter && (
                    <Badge variant="outline">Datacenter</Badge>
                  )}
                  {ipResults.categories.map((cat, idx) => (
                    <Badge key={idx} variant="secondary">{cat}</Badge>
                  ))}
                </div>

                {ipResults.blocklists.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Blocklist Matches
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ipResults.blocklists.map((bl, idx) => (
                        <Badge key={idx} variant="destructive">{bl}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {ipResults.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Recommendations
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {ipResults.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!ipResults.is_malicious && ipResults.risk_score < 20 && (
                  <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      This IP has a clean reputation
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scheduled Monitoring Tab */}
        <TabsContent value="scheduled" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Monitoring
              </CardTitle>
              <CardDescription>
                Set up automated monitoring for emails and domains with alerts when new breaches are detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-2">
                  Configure automatic scans to run daily, weekly, or monthly
                </p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Get notified via email when new breaches are detected for your monitored assets
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled>
                    <Mail className="h-4 w-4 mr-2" />
                    Add Email Monitor
                  </Button>
                  <Button variant="outline" disabled>
                    <Globe className="h-4 w-4 mr-2" />
                    Add Domain Monitor
                  </Button>
                </div>
                <Badge variant="outline" className="mt-4">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>

          {monitoredItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Active Monitors
                </CardTitle>
                <CardDescription>
                  Items currently being monitored for new breaches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monitoredItems.map((monitor) => (
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
                        <Button variant="ghost" size="sm" onClick={(e) => deleteMonitor(monitor.id, e)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
