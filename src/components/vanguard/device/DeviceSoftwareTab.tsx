import { useState, useMemo } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Search, Download, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";

interface InstalledSoftware {
  name: string;
  version: string;
  publisher: string;
  install_date?: string;
  uninstall_string?: string;
}

interface DeviceSoftwareTabProps {
  agent: VanguardAgent;
  sendCommand?: (cmd: string, payload?: any) => Promise<any>;
}

export function DeviceSoftwareTab({ agent, sendCommand }: DeviceSoftwareTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [uninstallTarget, setUninstallTarget] = useState<InstalledSoftware | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);

  // Get software from agent config (populated by telemetry)
  const installedSoftware: InstalledSoftware[] = useMemo(() => {
    const software = (agent.config as any)?.installed_software || [];
    return software.sort((a: InstalledSoftware, b: InstalledSoftware) => 
      a.name.localeCompare(b.name)
    );
  }, [agent.config]);

  const filteredSoftware = useMemo(() => {
    if (!searchQuery.trim()) return installedSoftware;
    const query = searchQuery.toLowerCase();
    return installedSoftware.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.publisher?.toLowerCase().includes(query) ||
        s.version?.toLowerCase().includes(query)
    );
  }, [installedSoftware, searchQuery]);

  const exportList = () => {
    const csv = [
      ["Name", "Version", "Publisher", "Install Date"],
      ...filteredSoftware.map((s) => [
        `"${s.name || ''}"`,
        `"${s.version || ''}"`,
        `"${s.publisher || ''}"`,
        s.install_date || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `software-inventory-${agent.name || agent.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Software list exported");
  };

  const handleUninstall = async () => {
    if (!uninstallTarget || !sendCommand) {
      toast.error("Uninstall not available - agent connection required");
      setUninstallTarget(null);
      return;
    }

    setIsUninstalling(true);
    try {
      await sendCommand("uninstall_software", {
        software_name: uninstallTarget.name,
        uninstall_string: uninstallTarget.uninstall_string,
      });
      toast.success(`Uninstall command sent for ${uninstallTarget.name}`);
    } catch (err) {
      toast.error(`Failed to uninstall ${uninstallTarget.name}`);
    } finally {
      setIsUninstalling(false);
      setUninstallTarget(null);
    }
  };

  const lastTelemetry = (agent.config as any)?.last_telemetry_at;

  if (installedSoftware.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Installed Software
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No software inventory available</p>
            <p className="text-xs text-slate-500">
              Software data is collected during agent telemetry sync (every 5 minutes)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Installed Software
              <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                {installedSoftware.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastTelemetry && (
                <span className="text-xs text-slate-500">
                  Last sync: {new Date(lastTelemetry).toLocaleString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportList}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search software by name, publisher, or version..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-cyan-500/20 hover:bg-transparent">
                  <TableHead className="text-cyan-400">Name</TableHead>
                  <TableHead className="text-cyan-400">Version</TableHead>
                  <TableHead className="text-cyan-400">Publisher</TableHead>
                  <TableHead className="text-cyan-400">Installed</TableHead>
                  <TableHead className="text-cyan-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSoftware.map((sw, i) => (
                  <TableRow key={`${sw.name}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                    <TableCell>
                      <div className="font-medium text-slate-200">{sw.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-400">
                      {sw.version || '-'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {sw.publisher || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sw.install_date || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUninstallTarget(sw)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        disabled={!sendCommand}
                        title={sendCommand ? "Uninstall software" : "Agent connection required"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSoftware.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No software matching "{searchQuery}"</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Uninstall Confirmation Dialog */}
      <AlertDialog open={!!uninstallTarget} onOpenChange={(open) => !open && setUninstallTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Uninstall Software</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to uninstall <span className="text-white font-medium">{uninstallTarget?.name}</span>?
              This action will send a remote uninstall command to the device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUninstall}
              disabled={isUninstalling}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isUninstalling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uninstalling...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Uninstall
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
