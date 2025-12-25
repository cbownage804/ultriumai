import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, Globe, AlertTriangle, Shield, Loader2, Calendar, Users, RefreshCw, Trash2, Phone, CreditCard, MapPin, Key, User } from 'lucide-react';
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

export const DarkWebMonitor = () => {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [monitoredItems, setMonitoredItems] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadMonitoredItems();
  }, [user]);

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
      
      if (data.breaches?.length > 0) {
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
      toast.success('Domain breach check complete');
    } catch (error: any) {
      console.error('Check error:', error);
      toast.error(error.message || 'Check failed');
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Email Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Breach Check
            </CardTitle>
            <CardDescription>
              Check if an email has been exposed in data breaches. Results include any leaked phone numbers, passwords, and other data.
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
              {results.breaches?.length > 0 
                ? `Found ${results.breaches.length} breaches`
                : results.message || 'Scan complete'
              }
              {results.checked_at && ` • Checked: ${new Date(results.checked_at).toLocaleString()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.simulated && (
              <div className="p-4 bg-yellow-500/10 rounded-lg mb-4">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                  ⚠️ {results.message}
                </p>
              </div>
            )}

            {/* Sensitive Data Summary */}
            {results.breaches?.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
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

            {results.breaches?.length === 0 && !results.simulated && (
              <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  No breaches found! This email is not in known data breaches.
                </span>
              </div>
            )}

            {results.breaches?.length > 0 && (
              <div className="space-y-4">
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
    </div>
  );
};
