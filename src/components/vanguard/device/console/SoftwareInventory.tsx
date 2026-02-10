import { useState, useEffect, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Package,
  Search,
  RefreshCw,
  Download,
  Trash2,
  MoreVertical,
  Loader2,
  Plus,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface InstalledSoftware {
  name: string;
  version: string;
  publisher: string;
  installDate?: Date;
  size?: number;
  type: "application" | "update" | "driver";
  uninstallable: boolean;
}

interface SoftwareInventoryProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function SoftwareInventory({ agentId, sendCommand }: SoftwareInventoryProps) {
  const [software, setSoftware] = useState<InstalledSoftware[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [installPackage, setInstallPackage] = useState("");
  const [packageManager, setPackageManager] = useState<"chocolatey" | "winget">("chocolatey");
  const [installing, setInstalling] = useState(false);
  const [uninstallingName, setUninstallingName] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadSoftware();
    }
  }, [agentId]);

  const loadSoftware = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand("get_installed_software");
      if (result?.software) {
        setSoftware(
          result.software.map((s: any) => ({
            ...s,
            installDate: s.installDate ? new Date(s.installDate) : undefined,
          }))
        );
      } else if (result?.pending) {
        toast.info("Software list request queued - waiting for agent");
      }
    } catch (err) {
      // Keep current data
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!installPackage.trim()) return;

    setInstalling(true);
    try {
      const result = await sendCommand("install_software", {
        package: installPackage,
        manager: packageManager,
      });
      if (result?.pending) {
        toast.info(`Installation of ${installPackage} queued - waiting for agent`);
      } else {
        toast.success(`Installing ${installPackage}...`);
      }
      setShowInstallDialog(false);
      setInstallPackage("");
      setTimeout(loadSoftware, 10000);
    } catch (err) {
      toast.error(`Failed to install ${installPackage}`);
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (name: string) => {
    if (!confirm(`Uninstall ${name}?`)) return;

    setUninstallingName(name);
    try {
      const result = await sendCommand("uninstall_software", { name });
      if (result?.pending) {
        toast.info(`Uninstall of ${name} queued - waiting for agent`);
      } else {
        toast.success(`Uninstalling ${name}...`);
      }
      setTimeout(loadSoftware, 10000);
    } catch (err) {
      toast.error(`Failed to uninstall ${name}`);
    } finally {
      setUninstallingName(null);
    }
  };

  const filteredSoftware = software.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.publisher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportList = () => {
    const csv = [
      ["Name", "Version", "Publisher", "Install Date", "Size (MB)"],
      ...filteredSoftware.map((s) => [
        `"${s.name}"`,
        s.version,
        `"${s.publisher}"`,
        s.installDate ? format(s.installDate, "yyyy-MM-dd") : "",
        s.size?.toString() || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `software-inventory-${agentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Software list exported");
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Installed Software
              <Badge variant="secondary">{software.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowInstallDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Install
              </Button>
              <Button variant="outline" size="sm" onClick={exportList}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadSoftware} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Publisher</TableHead>
                    <TableHead>Installed</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSoftware.map((sw, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-medium">{sw.name}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{sw.version}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{sw.publisher}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sw.installDate ? format(sw.installDate, "MMM dd, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {sw.size ? `${sw.size} MB` : "-"}
                      </TableCell>
                      <TableCell>
                        {sw.uninstallable && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={uninstallingName === sw.name}
                              >
                                {uninstallingName === sw.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleUninstall(sw.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Uninstall
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Install Software
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Package Name</label>
              <Input
                placeholder="e.g., googlechrome, vscode, 7zip"
                value={installPackage}
                onChange={(e) => setInstallPackage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uses Chocolatey package manager. Find packages at{" "}
                <a
                  href="https://community.chocolatey.org/packages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  chocolatey.org <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInstall} disabled={installing || !installPackage.trim()}>
              {installing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Install
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
