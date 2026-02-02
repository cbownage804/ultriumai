import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Key,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface SoftwareLicense {
  id: string;
  software: string;
  vendor: string;
  licensedCount: number;
  installedCount: number;
  licenseType: 'perpetual' | 'subscription' | 'volume';
  expiresAt?: string;
  cost: number;
  status: 'compliant' | 'over-licensed' | 'under-licensed';
}

interface SoftwareLicenseAuditProps {
  agents: any[];
}

export function SoftwareLicenseAudit({ agents }: SoftwareLicenseAuditProps) {
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockLicenses: SoftwareLicense[] = [
      {
        id: '1',
        software: 'Microsoft Office 365',
        vendor: 'Microsoft',
        licensedCount: 50,
        installedCount: 48,
        licenseType: 'subscription',
        expiresAt: '2025-03-15',
        cost: 12500,
        status: 'compliant',
      },
      {
        id: '2',
        software: 'Adobe Creative Cloud',
        vendor: 'Adobe',
        licensedCount: 10,
        installedCount: 15,
        licenseType: 'subscription',
        expiresAt: '2025-06-01',
        cost: 6000,
        status: 'under-licensed',
      },
      {
        id: '3',
        software: 'AutoCAD',
        vendor: 'Autodesk',
        licensedCount: 5,
        installedCount: 3,
        licenseType: 'perpetual',
        cost: 8500,
        status: 'over-licensed',
      },
      {
        id: '4',
        software: 'Visual Studio Enterprise',
        vendor: 'Microsoft',
        licensedCount: 20,
        installedCount: 20,
        licenseType: 'subscription',
        expiresAt: '2025-01-15',
        cost: 4800,
        status: 'compliant',
      },
    ];
    
    setLicenses(mockLicenses);
    setIsLoading(false);
  };

  const getStatusBadge = (license: SoftwareLicense) => {
    switch (license.status) {
      case 'compliant':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Compliant</Badge>;
      case 'under-licensed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Under-licensed</Badge>;
      case 'over-licensed':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Over-licensed</Badge>;
      default:
        return null;
    }
  };

  const filteredLicenses = licenses.filter(l =>
    l.software.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCost = licenses.reduce((acc, l) => acc + l.cost, 0);
  const underLicensedCount = licenses.filter(l => l.status === 'under-licensed').length;
  const overLicensedCount = licenses.filter(l => l.status === 'over-licensed').length;

  const exportAudit = () => {
    const csv = [
      'Software,Vendor,Licensed,Installed,Type,Expires,Annual Cost,Status',
      ...licenses.map(l => 
        `"${l.software}","${l.vendor}",${l.licensedCount},${l.installedCount},"${l.licenseType}","${l.expiresAt || 'N/A'}",${l.cost},"${l.status}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('License audit exported');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Software License Audit
          </CardTitle>
          <div className="flex items-center gap-4">
            {underLicensedCount > 0 && (
              <Badge variant="destructive">{underLicensedCount} Under-licensed</Badge>
            )}
            {overLicensedCount > 0 && (
              <Badge className="bg-yellow-500">{overLicensedCount} Over-licensed</Badge>
            )}
            <Button variant="outline" size="sm" onClick={exportAudit}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={loadLicenses} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search software..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {licenses.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Total Annual Cost</div>
              <div className="text-2xl font-bold">${totalCost.toLocaleString()}</div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Total Licenses</div>
              <div className="text-2xl font-bold">
                {licenses.reduce((acc, l) => acc + l.licensedCount, 0)}
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Compliance Rate</div>
              <div className="text-2xl font-bold">
                {((licenses.filter(l => l.status === 'compliant').length / licenses.length) * 100).toFixed(0)}%
              </div>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
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
                  const usage = (license.installedCount / license.licensedCount) * 100;
                  return (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.software}</div>
                          <div className="text-xs text-muted-foreground">{license.vendor}</div>
                        </div>
                      </TableCell>
                      <TableCell>{license.licensedCount}</TableCell>
                      <TableCell>{license.installedCount}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <Progress 
                            value={Math.min(usage, 100)} 
                            className={usage > 100 ? 'bg-red-200' : ''}
                          />
                          <span className="text-xs text-muted-foreground">{usage.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{license.licenseType}</Badge>
                      </TableCell>
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
