import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  Loader2,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { toast } from "sonner";

interface HardwareReport {
  deviceId: string;
  deviceName: string;
  cpu: string;
  cpuCores: number;
  ramGb: number;
  diskGb: number;
  gpuName?: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  biosVersion: string;
  osVersion: string;
  lastUpdated: string;
}

interface HardwareInventoryReportsProps {
  agents: any[];
}

export function HardwareInventoryReports({ agents }: HardwareInventoryReportsProps) {
  const [reports, setReports] = useState<HardwareReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'manufacturer' | 'os'>('none');

  const generateReport = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockReports: HardwareReport[] = agents.map((agent, i) => ({
      deviceId: agent.id,
      deviceName: agent.device_name || `Device ${i + 1}`,
      cpu: ['Intel Core i7-12700K', 'AMD Ryzen 9 5900X', 'Intel Core i5-11400'][i % 3],
      cpuCores: [12, 12, 6][i % 3],
      ramGb: [32, 64, 16][i % 3],
      diskGb: [512, 1000, 256][i % 3],
      gpuName: i % 2 === 0 ? 'NVIDIA RTX 3080' : undefined,
      manufacturer: ['Dell', 'HP', 'Lenovo'][i % 3],
      model: ['OptiPlex 7090', 'EliteDesk 800', 'ThinkCentre M90'][i % 3],
      serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      biosVersion: '1.2.3',
      osVersion: agent.os_type || 'Windows 11 Pro',
      lastUpdated: new Date().toISOString(),
    }));
    
    setReports(mockReports);
    setIsLoading(false);
    toast.success('Hardware inventory report generated');
  };

  const exportReport = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const csv = [
        'Device,Manufacturer,Model,CPU,Cores,RAM (GB),Disk (GB),GPU,OS,Serial',
        ...reports.map(r => 
          `"${r.deviceName}","${r.manufacturer}","${r.model}","${r.cpu}",${r.cpuCores},${r.ramGb},${r.diskGb},"${r.gpuName || 'N/A'}","${r.osVersion}","${r.serialNumber}"`
        )
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hardware-inventory-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hardware-inventory-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const totalRam = reports.reduce((acc, r) => acc + r.ramGb, 0);
  const totalDisk = reports.reduce((acc, r) => acc + r.diskGb, 0);
  const avgCores = reports.length > 0 ? (reports.reduce((acc, r) => acc + r.cpuCores, 0) / reports.length).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Hardware Inventory Reports
          </CardTitle>
          <div className="flex gap-2">
            <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="os">OS Version</SelectItem>
              </SelectContent>
            </Select>
            {reports.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportReport('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </>
            )}
            <Button size="sm" onClick={generateReport} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" />
                Total Devices
              </div>
              <div className="text-2xl font-bold">{reports.length}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4" />
                Avg CPU Cores
              </div>
              <div className="text-2xl font-bold">{avgCores}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MemoryStick className="h-4 w-4" />
                Total RAM
              </div>
              <div className="text-2xl font-bold">{totalRam} GB</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                Total Storage
              </div>
              <div className="text-2xl font-bold">{(totalDisk / 1000).toFixed(1)} TB</div>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Generate Report" to create a hardware inventory</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>RAM</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>OS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.deviceId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.deviceName}</div>
                        <div className="text-xs text-muted-foreground">{report.model}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{report.manufacturer}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{report.cpu}</div>
                      <div className="text-xs text-muted-foreground">{report.cpuCores} cores</div>
                    </TableCell>
                    <TableCell>{report.ramGb} GB</TableCell>
                    <TableCell>{report.diskGb} GB</TableCell>
                    <TableCell className="text-sm">{report.osVersion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
