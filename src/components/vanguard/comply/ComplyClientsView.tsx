import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, Building2, ChevronRight, Shield } from 'lucide-react';
import { useClientCompliance } from '@/hooks/useClientCompliance';
import { ComplyClientDetail } from './ComplyClientDetail';

const FRAMEWORK_LABELS: Record<string, string> = {
  soc2: 'SOC 2', hipaa: 'HIPAA', pci_dss: 'PCI-DSS', iso_27001: 'ISO 27001',
  nist_800_53: 'NIST 800-53', gdpr: 'GDPR', ccpa: 'CCPA / CPRA', cmmc: 'CMMC 2.0',
  fedramp: 'FedRAMP', glba: 'GLBA', wisp: 'WISP', cis_linux: 'CIS Linux', cis_windows: 'CIS Windows',
};

export function ComplyClientsView() {
  const { clients, isLoading } = useClientCompliance();
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  if (selectedClientId) {
    const client = clients.find(c => c.client_id === selectedClientId);
    return (
      <ComplyClientDetail
        clientId={selectedClientId}
        clientName={client?.company_name || 'Unknown'}
        onBack={() => setSelectedClientId(null)}
      />
    );
  }

  const filtered = clients.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score > 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score > 0) return 'bg-red-500';
    return 'bg-muted';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-black/40 border-white/10"
          />
        </div>
        <Badge variant="outline" className="border-white/20 text-white/60">
          {filtered.length} clients
        </Badge>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No clients found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(client => (
            <Card
              key={client.client_id}
              className="bg-black/40 border-white/10 hover:border-teal-500/30 cursor-pointer transition-colors"
              onClick={() => setSelectedClientId(client.client_id)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{client.company_name}</p>
                      <p className="text-xs text-muted-foreground">{client.contact_email}</p>
                    </div>

                    {/* Framework badges */}
                    <div className="hidden md:flex items-center gap-2">
                      {client.frameworks.filter(f => f.is_enabled).slice(0, 3).map(f => (
                        <Badge key={f.framework_type} className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-xs">
                          {FRAMEWORK_LABELS[f.framework_type] || f.framework_type}
                        </Badge>
                      ))}
                      {client.frameworks.filter(f => f.is_enabled).length > 3 && (
                        <Badge className="bg-white/10 text-white/60 text-xs">
                          +{client.frameworks.filter(f => f.is_enabled).length - 3}
                        </Badge>
                      )}
                      {client.frameworks.length === 0 && (
                        <Badge variant="outline" className="border-white/10 text-white/40 text-xs">No frameworks</Badge>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right mr-4 min-w-[80px]">
                      <p className={`text-lg font-bold ${getScoreColor(client.avg_score)}`}>
                        {client.avg_score > 0 ? `${client.avg_score}%` : '—'}
                      </p>
                      {client.avg_score > 0 && (
                        <Progress value={client.avg_score} className={`h-1 mt-1`} />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
