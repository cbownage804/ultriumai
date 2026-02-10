import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Loader2,
  Download,
  AlertTriangle,
  Eye,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";

interface Certificate {
  thumbprint: string;
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  store: 'personal' | 'root' | 'ca' | 'trustedpeople';
  hasPrivateKey: boolean;
  serialNumber: string;
  signatureAlgorithm: string;
}

interface CertificateManagerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function CertificateManager({ agentId, sendCommand }: CertificateManagerProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [store, setStore] = useState<'personal' | 'root' | 'ca' | 'trustedpeople'>('personal');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // No auto-load - user must click Refresh to avoid flooding the command queue

  const loadCertificates = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_certificates');
      if (result?.certificates) {
        setCertificates(result.certificates);
      } else {
        setCertificates([]);
      }
    } catch (err) {
      toast.error('Failed to load certificates');
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCertificates = () => {
    const csv = [
      'Subject,Issuer,Thumbprint,Valid From,Valid To,Store,Has Private Key',
      ...certificates.map(c => 
        `"${c.subject}","${c.issuer}","${c.thumbprint}","${c.notBefore}","${c.notAfter}","${c.store}","${c.hasPrivateKey}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-${agentId}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certificates exported');
  };

  const getExpiryStatus = (notAfter: string) => {
    try {
      const days = differenceInDays(parseISO(notAfter), new Date());
      if (days < 0) return { label: 'Expired', variant: 'destructive' as const };
      if (days < 30) return { label: `${days}d left`, variant: 'destructive' as const };
      if (days < 90) return { label: `${days}d left`, variant: 'secondary' as const };
      return { label: 'Valid', variant: 'default' as const };
    } catch {
      return { label: 'Unknown', variant: 'outline' as const };
    }
  };

  const filteredCerts = certificates.filter(c => 
    c.store === store &&
    (c.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.issuer.toLowerCase().includes(searchQuery.toLowerCase()) ||
     c.thumbprint.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const storeLabels = {
    personal: 'Personal',
    root: 'Trusted Root',
    ca: 'Intermediate CA',
    trustedpeople: 'Trusted People',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Certificate Store
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCertificates}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadCertificates} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={store} onValueChange={(v: any) => setStore(v)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="root">Root CA</TabsTrigger>
                <TabsTrigger value="ca">Intermediate</TabsTrigger>
                <TabsTrigger value="trustedpeople">Trusted</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {['personal', 'root', 'ca', 'trustedpeople'].map((s) => (
              <TabsContent key={s} value={s} className="mt-0">
                <ScrollArea className="h-[350px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredCerts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No certificates in {storeLabels[store as keyof typeof storeLabels]}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Issuer</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Key</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCerts.map((cert) => {
                          const expiry = getExpiryStatus(cert.notAfter);
                          return (
                            <TableRow key={cert.thumbprint}>
                              <TableCell>
                                <div className="font-medium truncate max-w-[200px]">
                                  {cert.subject.replace(/^CN=/, '')}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                                  {cert.thumbprint.slice(0, 16)}...
                                </div>
                              </TableCell>
                              <TableCell className="truncate max-w-[150px]">
                                {cert.issuer.replace(/^CN=/, '')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {expiry.label.includes('Expired') && (
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  )}
                                  <Badge variant={expiry.variant}>{expiry.label}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                {cert.hasPrivateKey && (
                                  <Key className="h-4 w-4 text-amber-500" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setSelectedCert(cert)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
                <span className="text-muted-foreground">Subject:</span>
                <span className="font-mono break-all">{selectedCert.subject}</span>
                
                <span className="text-muted-foreground">Issuer:</span>
                <span className="font-mono break-all">{selectedCert.issuer}</span>
                
                <span className="text-muted-foreground">Thumbprint:</span>
                <span className="font-mono break-all">{selectedCert.thumbprint}</span>
                
                <span className="text-muted-foreground">Serial Number:</span>
                <span className="font-mono break-all">{selectedCert.serialNumber}</span>
                
                <span className="text-muted-foreground">Valid From:</span>
                <span>{selectedCert.notBefore}</span>
                
                <span className="text-muted-foreground">Valid To:</span>
                <span>{selectedCert.notAfter}</span>
                
                <span className="text-muted-foreground">Algorithm:</span>
                <span>{selectedCert.signatureAlgorithm}</span>
                
                <span className="text-muted-foreground">Private Key:</span>
                <span>{selectedCert.hasPrivateKey ? 'Yes' : 'No'}</span>
                
                <span className="text-muted-foreground">Store:</span>
                <span className="capitalize">{selectedCert.store}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
