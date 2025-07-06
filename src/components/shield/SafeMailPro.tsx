import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  Plus,
  Search,
  Globe,
  Eye,
  Ban,
  CheckCircle,
  XCircle
} from "lucide-react";

interface SafeMailDomain {
  id: string;
  domain_name: string;
  security_score: number;
  threat_level: string;
  last_scan_at: string;
  is_monitored: boolean;
  threat_count: number;
  spf_record: string;
  dmarc_record: string;
  created_at: string;
}

interface SafeMailThreat {
  id: string;
  threat_type: string;
  sender_email: string;
  subject: string;
  threat_score: number;
  risk_level: string;
  action_taken: string;
  detected_at: string;
  resolved_at: string;
  false_positive: boolean;
}

export const SafeMailPro = () => {
  const [domains, setDomains] = useState<SafeMailDomain[]>([]);
  const [threats, setThreats] = useState<SafeMailThreat[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<SafeMailDomain | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newDomainDialog, setNewDomainDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDomains();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      loadThreats(selectedDomain.id);
    }
  }, [selectedDomain]);

  const loadDomains = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: domainsData, error } = await supabase
        .from('safemail_domains')
        .select(`
          *,
          safemail_threats(count)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedDomains = domainsData?.map(domain => ({
        ...domain,
        threat_count: domain.safemail_threats?.length || 0
      })) || [];

      setDomains(enrichedDomains);
    } catch (error) {
      console.error('Error loading domains:', error);
      toast({
        title: "Error",
        description: "Failed to load email domains",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadThreats = async (domainId: string) => {
    try {
      const { data: threatsData, error } = await supabase
        .from('safemail_threats')
        .select('*')
        .eq('domain_id', domainId)
        .order('detected_at', { ascending: false });

      if (error) throw error;
      setThreats(threatsData || []);
    } catch (error) {
      console.error('Error loading threats:', error);
      toast({
        title: "Error",
        description: "Failed to load email threats",
        variant: "destructive",
      });
    }
  };

  const addDomain = async (domainData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('safemail_domains')
        .insert({
          user_id: user.user.id,
          domain_name: domainData.domain,
          security_score: Math.floor(Math.random() * 100),
          threat_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          spf_record: 'v=spf1 include:_spf.google.com ~all',
          dmarc_record: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@' + domainData.domain
        });

      if (error) throw error;

      toast({
        title: "✅ Domain Added",
        description: `${domainData.domain} is now being monitored`,
      });

      setNewDomainDialog(false);
      loadDomains();
    } catch (error) {
      console.error('Error adding domain:', error);
      toast({
        title: "Error",
        description: "Failed to add domain",
        variant: "destructive",
      });
    }
  };

  const markFalsePositive = async (threatId: string) => {
    try {
      const { error } = await supabase
        .from('safemail_threats')
        .update({ false_positive: true, resolved_at: new Date().toISOString() })
        .eq('id', threatId);

      if (error) throw error;

      toast({
        title: "✅ Marked as Safe",
        description: "Threat marked as false positive",
      });

      if (selectedDomain) {
        loadThreats(selectedDomain.id);
      }
    } catch (error) {
      console.error('Error marking false positive:', error);
      toast({
        title: "Error",
        description: "Failed to update threat status",
        variant: "destructive",
      });
    }
  };

  const getThreatTypeColor = (type: string) => {
    switch (type) {
      case 'phishing': return 'text-red-600';
      case 'malware': return 'text-purple-600';
      case 'spam': return 'text-yellow-600';
      case 'spoofing': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredThreats = threats.filter(threat =>
    threat.sender_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    threat.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            SafeMail Pro
          </h2>
          <p className="text-muted-foreground">
            Advanced email security and threat detection
          </p>
        </div>
        
        <Dialog open={newDomainDialog} onOpenChange={setNewDomainDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email Domain</DialogTitle>
            </DialogHeader>
            <DomainForm onSubmit={addDomain} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domains.map((domain) => (
          <Card 
            key={domain.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedDomain?.id === domain.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedDomain(domain)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {domain.domain_name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">Security Score:</span>
                    <span className={`font-medium ${getSecurityScoreColor(domain.security_score)}`}>
                      {domain.security_score}/100
                    </span>
                  </div>
                </div>
                <Badge variant={getRiskColor(domain.threat_level)}>
                  {domain.threat_level}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Threats:</span>
                  <div className="flex items-center gap-2">
                    {domain.threat_count > 0 ? (
                      <Badge variant="destructive">{domain.threat_count}</Badge>
                    ) : (
                      <Badge variant="default">0</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">SPF:</span>
                    <Badge variant={domain.spf_record ? "default" : "destructive"} className="text-xs">
                      {domain.spf_record ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">DMARC:</span>
                    <Badge variant={domain.dmarc_record ? "default" : "destructive"} className="text-xs">
                      {domain.dmarc_record ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last scan:</span>
                  <span className="text-sm">
                    {domain.last_scan_at 
                      ? new Date(domain.last_scan_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Domain Threats */}
      {selectedDomain && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                {selectedDomain.domain_name} - Email Threats
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threats..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ThreatsTable 
              threats={filteredThreats}
              onMarkFalsePositive={markFalsePositive}
              getThreatTypeColor={getThreatTypeColor}
              getRiskColor={getRiskColor}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Domain form component
const DomainForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    domain: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Domain Name</label>
        <Input
          value={formData.domain}
          onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
          placeholder="example.com"
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add Domain</Button>
      </div>
    </form>
  );
};

// Threats table component
const ThreatsTable = ({ threats, onMarkFalsePositive, getThreatTypeColor, getRiskColor }: any) => {
  if (threats.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No threats detected for this domain
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Threat Type</th>
            <th className="text-left p-2">Sender</th>
            <th className="text-left p-2">Subject</th>
            <th className="text-left p-2">Risk Level</th>
            <th className="text-left p-2">Action Taken</th>
            <th className="text-left p-2">Detected</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {threats.map((threat: SafeMailThreat) => (
            <tr key={threat.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${getThreatTypeColor(threat.threat_type)}`} />
                  <span className="capitalize">{threat.threat_type}</span>
                </div>
              </td>
              <td className="p-2">
                <span className="font-mono text-sm">{threat.sender_email}</span>
              </td>
              <td className="p-2">
                <span className="text-sm">{threat.subject || 'No subject'}</span>
              </td>
              <td className="p-2">
                <Badge variant={getRiskColor(threat.risk_level)}>
                  {threat.risk_level}
                </Badge>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  {threat.action_taken === 'blocked' && <Ban className="h-4 w-4 text-red-600" />}
                  {threat.action_taken === 'quarantined' && <Shield className="h-4 w-4 text-yellow-600" />}
                  {threat.action_taken === 'allowed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  <span className="capitalize text-sm">{threat.action_taken}</span>
                </div>
              </td>
              <td className="p-2">
                <span className="text-sm">
                  {new Date(threat.detected_at).toLocaleDateString()}
                </span>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-1">
                  {!threat.false_positive && !threat.resolved_at && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkFalsePositive(threat.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark Safe
                    </Button>
                  )}
                  {threat.false_positive && (
                    <Badge variant="outline" className="text-xs">
                      False Positive
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};