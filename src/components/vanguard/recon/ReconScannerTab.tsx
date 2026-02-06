import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Crosshair, Radio, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useReconScans, useReconEngagements } from '@/hooks/useReconPentest';

export function ReconScannerTab() {
  const { loading, scans, createScan } = useReconScans();
  const { engagements } = useReconEngagements();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    scan_name: '',
    scan_type: 'vuln_scan' as string,
    scan_profile: 'standard' as string,
    targets: '',
    port_range: '1-1024',
    engagement_id: '' as string,
  });

  const scanTypes: Record<string, string> = {
    port_scan: 'Port Scan',
    vuln_scan: 'Vulnerability Scan',
    service_enum: 'Service Enumeration',
    os_detection: 'OS Detection',
    credential_check: 'Credential Check',
    smb_enum: 'SMB Enumeration',
    web_scan: 'Web Application Scan',
    ssl_audit: 'SSL/TLS Audit',
    dns_enum: 'DNS Enumeration',
    full_pentest: 'Full Pentest',
    custom: 'Custom',
  };

  const handleCreate = async () => {
    if (!form.scan_name || !form.targets) return;
    const targets = form.targets.split(',').map(t => t.trim()).filter(Boolean);
    await createScan({
      scan_name: form.scan_name,
      scan_type: form.scan_type,
      scan_profile: form.scan_profile,
      targets,
      port_range: form.port_range,
      engagement_id: form.engagement_id || undefined,
    } as any);
    setShowCreate(false);
    setForm({ scan_name: '', scan_type: 'vuln_scan', scan_profile: 'standard', targets: '', port_range: '1-1024', engagement_id: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Scan Jobs</h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" /> New Scan
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f0f14] border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Launch Scan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Scan Name</Label>
                <Input placeholder="Network vuln scan - 192.168.1.0/24" value={form.scan_name}
                  onChange={e => setForm(f => ({ ...f, scan_name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Scan Type</Label>
                  <Select value={form.scan_type} onValueChange={v => setForm(f => ({ ...f, scan_type: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10">
                      {Object.entries(scanTypes).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Profile</Label>
                  <Select value={form.scan_profile} onValueChange={v => setForm(f => ({ ...f, scan_profile: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10">
                      <SelectItem value="stealth">Stealth (Slow/Quiet)</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="aggressive">Aggressive (Fast/Noisy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Targets (comma-separated IPs, CIDRs, or hostnames)</Label>
                <Input placeholder="192.168.1.0/24, 10.0.0.1, server.local" value={form.targets}
                  onChange={e => setForm(f => ({ ...f, targets: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm" />
              </div>
              <div>
                <Label>Port Range</Label>
                <Input placeholder="1-1024 or 1-65535" value={form.port_range}
                  onChange={e => setForm(f => ({ ...f, port_range: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm" />
              </div>
              {engagements.length > 0 && (
                <div>
                  <Label>Link to Engagement (optional)</Label>
                  <Select value={form.engagement_id} onValueChange={v => setForm(f => ({ ...f, engagement_id: v }))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f0f14] border-white/10">
                      <SelectItem value="">None</SelectItem>
                      {engagements.map(eng => (
                        <SelectItem key={eng.id} value={eng.id}>{eng.engagement_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
                <Crosshair className="h-4 w-4 mr-2" /> Launch Scan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
      ) : scans.length === 0 ? (
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
          <CardContent className="py-12 text-center text-white/30">
            <Radio className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No scans yet. Launch a scan to start discovering vulnerabilities.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {scans.map(scan => (
            <Card key={scan.id} className="bg-black/40 border-white/10 backdrop-blur-xl">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ScanIcon status={scan.status} />
                    <div>
                      <p className="text-sm font-medium text-white">{scan.scan_name}</p>
                      <p className="text-xs text-white/40">
                        {scanTypes[scan.scan_type] || scan.scan_type} • {scan.scan_profile} •
                        {scan.hosts_scanned}/{scan.hosts_total} hosts •
                        {scan.services_found} services • {scan.vulns_found} vulns
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {scan.status === 'running' && (
                      <div className="w-24">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${scan.progress_percent}%` }} />
                        </div>
                        <p className="text-xs text-white/40 text-center mt-0.5">{scan.progress_percent}%</p>
                      </div>
                    )}
                    {scan.duration_seconds && (
                      <span className="text-xs text-white/30">{Math.round(scan.duration_seconds / 60)}m</span>
                    )}
                    <StatusBadge status={scan.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScanIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
    case 'running': return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
    default: return <Clock className="h-4 w-4 text-yellow-400" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-400',
    running: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
    queued: 'bg-yellow-500/20 text-yellow-400',
    dispatched: 'bg-cyan-500/20 text-cyan-400',
  };
  return <Badge className={`text-xs ${c[status] || 'bg-white/10 text-white/40'}`}>{status}</Badge>;
}
