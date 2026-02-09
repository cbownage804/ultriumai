import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Key, Search, RefreshCw, Loader2, AlertTriangle, CheckCircle2, Download,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SoftwareLicenseAuditProps {
  agents: any[];
}

export function SoftwareLicenseAudit({ agents }: SoftwareLicenseAuditProps) {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadLicenses(); }, []);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data, error } = await supabase
        .from('software_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (!error) setLicenses(data || []);
    } catch (e) { console.error(e); }
    setIsLoading(false);
  };

  const getStatusBadge = (license: any) => {
    switch (license.status) {
      case 'active': case 'compliant':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'expiring': case 'under-licensed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Under-licensed</Badge>;
      case 'over-licensed':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Over-licensed</Badge>;
      default:
        return <Badge variant="outline">{license.status}</Badge>;
    }
  };

  const filteredLicenses = licenses.filter(l =>
    (l.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.vendor || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCost = licenses.reduce((acc, l) => acc + ((l.cost_per_seat || 0) * (l.seats_total || 0)), 0);
  const underCount = licenses.filter(l => (l.seats_used || 0) > (l.seats_total || 0)).length;
  const overCount = licenses.filter(l => (l.seats_total || 0) - (l.seats_used || 0) > 5).length;

  const exportAudit = () => {
    const csv = [
      'Software,Vendor,Licensed,Installed,Type,Expires,Annual Cost,Status',
      ...licenses.map(l =>
        `"${l.name}","${l.vendor || ''}",${l.seats_total || 0},${l.seats_used || 0},"${l.license_type || ''}","${l.expiry_date || 'N/A'}",${(l.cost_per_seat || 0) * (l.seats_total || 0)},"${l.status}"`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('License audit exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />Software License Audit
          </CardTitle>
          <div className="flex items-center gap-4">
            {underCount > 0 && <Badge variant="destructive">{underCount} Under-licensed</Badge>}
            {overCount > 0 && <Badge className="bg-yellow-500">{overCount} Over-licensed</Badge>}
            <Button variant="outline" size="sm" onClick={exportAudit}><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline" size="sm" onClick={loadLicenses} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search software..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>
      <CardContent>
        {licenses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="p-3"><div className="text-sm text-muted-foreground">Total Annual Cost</div><div className="text-2xl font-bold">${totalCost.toLocaleString()}</div></Card>
            <Card className="p-3"><div className="text-sm text-muted-foreground">Total Licenses</div><div className="text-2xl font-bold">{licenses.reduce((a, l) => a + (l.seats_total || 0), 0)}</div></Card>
            <Card className="p-3"><div className="text-sm text-muted-foreground">Compliance Rate</div><div className="text-2xl font-bold">{licenses.length > 0 ? ((licenses.filter(l => (l.seats_used || 0) <= (l.seats_total || 0)).length / licenses.length) * 100).toFixed(0) : 100}%</div></Card>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Licensed</TableHead>
                  <TableHead>Installed</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => {
                  const usage = (license.seats_total || 0) > 0 ? ((license.seats_used || 0) / (license.seats_total || 1)) * 100 : 0;
                  return (
                    <TableRow key={license.id}>
                      <TableCell><div><div className="font-medium">{license.name}</div><div className="text-xs text-muted-foreground">{license.vendor}</div></div></TableCell>
                      <TableCell>{license.seats_total || 0}</TableCell>
                      <TableCell>{license.seats_used || 0}</TableCell>
                      <TableCell><div className="w-24"><Progress value={Math.min(usage, 100)} className={usage > 100 ? 'bg-red-200' : ''} /><span className="text-xs text-muted-foreground">{usage.toFixed(0)}%</span></div></TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{license.license_type || 'N/A'}</Badge></TableCell>
                      <TableCell>{getStatusBadge(license)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
