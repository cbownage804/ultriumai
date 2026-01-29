import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Server,
  Download,
  Clock,
  Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHorizonStats } from "@/hooks/useHorizonStats";
import { cn } from "@/lib/utils";

interface SoftwareItem {
  name: string;
  version: string;
  publisher: string;
  installDate?: string;
  deviceCount: number;
  devices: string[];
  category: string;
  isApproved: boolean;
  hasVulnerabilities: boolean;
  vulnerabilityCount?: number;
}

interface DeviceSoftware {
  deviceId: string;
  deviceName: string;
  software: Array<{
    name: string;
    version: string;
    publisher: string;
    installDate?: string;
  }>;
}

// Mock software data - in production this would come from agent telemetry
const MOCK_SOFTWARE: SoftwareItem[] = [
  { name: "Google Chrome", version: "120.0.6099", publisher: "Google LLC", deviceCount: 45, devices: [], category: "Browsers", isApproved: true, hasVulnerabilities: false },
  { name: "Microsoft 365", version: "16.0.17231", publisher: "Microsoft Corporation", deviceCount: 42, devices: [], category: "Productivity", isApproved: true, hasVulnerabilities: false },
  { name: "Adobe Acrobat Reader", version: "23.006.20380", publisher: "Adobe Inc.", deviceCount: 38, devices: [], category: "Productivity", isApproved: true, hasVulnerabilities: true, vulnerabilityCount: 2 },
  { name: "7-Zip", version: "23.01", publisher: "Igor Pavlov", deviceCount: 35, devices: [], category: "Utilities", isApproved: true, hasVulnerabilities: false },
  { name: "Visual Studio Code", version: "1.85.1", publisher: "Microsoft Corporation", deviceCount: 28, devices: [], category: "Development", isApproved: true, hasVulnerabilities: false },
  { name: "Zoom", version: "5.16.10", publisher: "Zoom Video Communications", deviceCount: 25, devices: [], category: "Communication", isApproved: true, hasVulnerabilities: false },
  { name: "Slack", version: "4.35.126", publisher: "Slack Technologies", deviceCount: 22, devices: [], category: "Communication", isApproved: true, hasVulnerabilities: false },
  { name: "TeamViewer", version: "15.49.5", publisher: "TeamViewer AG", deviceCount: 15, devices: [], category: "Remote Access", isApproved: false, hasVulnerabilities: true, vulnerabilityCount: 1 },
  { name: "WinRAR", version: "6.24", publisher: "RARLAB", deviceCount: 12, devices: [], category: "Utilities", isApproved: false, hasVulnerabilities: true, vulnerabilityCount: 3 },
  { name: "VLC Media Player", version: "3.0.20", publisher: "VideoLAN", deviceCount: 18, devices: [], category: "Media", isApproved: true, hasVulnerabilities: false },
  { name: "Notepad++", version: "8.6.2", publisher: "Notepad++ Team", deviceCount: 30, devices: [], category: "Editors", isApproved: true, hasVulnerabilities: false },
  { name: "Git", version: "2.43.0", publisher: "The Git Development Community", deviceCount: 20, devices: [], category: "Development", isApproved: true, hasVulnerabilities: false },
  { name: "Python", version: "3.12.1", publisher: "Python Software Foundation", deviceCount: 15, devices: [], category: "Development", isApproved: true, hasVulnerabilities: false },
  { name: "Node.js", version: "20.10.0", publisher: "OpenJS Foundation", deviceCount: 12, devices: [], category: "Development", isApproved: true, hasVulnerabilities: false },
  { name: "Unknown App", version: "1.0.0", publisher: "Unknown", deviceCount: 3, devices: [], category: "Unknown", isApproved: false, hasVulnerabilities: false },
];

const CATEGORIES = ["All", "Browsers", "Productivity", "Development", "Communication", "Utilities", "Remote Access", "Media", "Editors", "Unknown"];

export function SoftwareAuditPanel() {
  const { user } = useAuth();
  const { stats, devices } = useHorizonStats();
  const [software, setSoftware] = useState<SoftwareItem[]>(MOCK_SOFTWARE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showVulnerable, setShowVulnerable] = useState(false);
  const [showUnapproved, setShowUnapproved] = useState(false);

  const filteredSoftware = software.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.publisher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesVulnerable = !showVulnerable || item.hasVulnerabilities;
    const matchesUnapproved = !showUnapproved || !item.isApproved;
    return matchesSearch && matchesCategory && matchesVulnerable && matchesUnapproved;
  });

  // Calculate stats
  const totalApps = software.length;
  const vulnerableApps = software.filter(s => s.hasVulnerabilities).length;
  const unapprovedApps = software.filter(s => !s.isApproved).length;
  const totalInstallations = software.reduce((sum, s) => sum + s.deviceCount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-500" />
              Software Audit
            </CardTitle>
            <CardDescription>
              Track and manage software across your fleet
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Unique Apps</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalApps}</p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4" />
              <span className="text-sm">Total Installations</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalInstallations}</p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border cursor-pointer transition-colors",
            showVulnerable ? "bg-red-500/10 border-red-500/30" : "bg-muted/20"
          )} onClick={() => setShowVulnerable(!showVulnerable)}>
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Vulnerable</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-red-500">{vulnerableApps}</p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border cursor-pointer transition-colors",
            showUnapproved ? "bg-yellow-500/10 border-yellow-500/30" : "bg-muted/20"
          )} onClick={() => setShowUnapproved(!showUnapproved)}>
            <div className="flex items-center gap-2 text-yellow-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">Unapproved</span>
            </div>
            <p className="text-2xl font-bold mt-1 text-yellow-500">{unapprovedApps}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search software..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {CATEGORIES.slice(0, 6).map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Software Table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Software</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Publisher</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Devices</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSoftware.map((item, idx) => (
                <TableRow key={idx} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.hasVulnerabilities && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.version}</TableCell>
                  <TableCell className="text-muted-foreground">{item.publisher}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.deviceCount}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {item.isApproved ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Unapproved
                        </Badge>
                      )}
                      {item.hasVulnerabilities && (
                        <Badge variant="destructive">
                          {item.vulnerabilityCount} CVE
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {filteredSoftware.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No software found matching your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
