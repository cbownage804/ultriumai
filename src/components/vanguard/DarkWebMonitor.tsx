import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Mail, Globe, AlertTriangle, Shield, Loader2, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

export const DarkWebMonitor = () => {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [monitoredEmails, setMonitoredEmails] = useState<any[]>([]);

  useEffect(() => {
    loadMonitoredEmails();
  }, []);

  const loadMonitoredEmails = async () => {
    // Would load from dark_web_monitors table if it exists
    // For now, use local state
  };

  const checkEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { action: 'check_email', email }
      });

      if (error) throw error;
      setResults(data);
      toast.success('Dark web check complete');
      loadMonitoredEmails();
    } catch (error: any) {
      console.error('Check error:', error);
      toast.error(error.message || 'Check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDomain = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { action: 'check_domain', domain }
      });

      if (error) throw error;
      setResults(data);
      toast.success('Domain breach check complete');
    } catch (error: any) {
      console.error('Check error:', error);
      toast.error(error.message || 'Check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return <Badge className={colors[level] || 'bg-muted'}>{level?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
              />
              <Button onClick={checkEmail} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

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
              />
              <Button onClick={checkDomain} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {results && results.breaches && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Breach Results
              </CardTitle>
              {getRiskBadge(results.risk_level)}
            </div>
            <CardDescription>
              Found {results.breaches?.length || 0} breaches • Checked: {new Date(results.checked_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.breaches?.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">No breaches found! This email is not in known data breaches.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {results.breaches?.map((breach: Breach, idx: number) => (
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
                        <span>{breach.pwn_count?.toLocaleString()} accounts</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {breach.data_classes?.map((dc: string) => (
                        <Badge key={dc} variant="secondary" className="text-xs">{dc}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Monitored Emails
          </CardTitle>
          <CardDescription>
            Previously checked email addresses and their breach status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {monitoredEmails.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No monitored emails yet</p>
            ) : (
              monitoredEmails.map((monitor) => (
                <div key={monitor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{monitor.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Last checked: {new Date(monitor.last_checked).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={monitor.breach_count > 0 ? 'destructive' : 'secondary'}>
                      {monitor.breach_count} breaches
                    </Badge>
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
