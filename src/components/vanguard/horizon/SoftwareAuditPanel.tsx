import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  Download,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHorizonStats } from "@/hooks/useHorizonStats";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SoftwareItem {
  id: string;
  name: string;
  version: string;
  publisher: string;
  deviceCount: number;
  category: string;
  isApproved: boolean;
  hasVulnerabilities: boolean;
  vulnerabilityCount?: number;
}

const CATEGORIES = ["All", "Browsers", "Productivity", "Development", "Communication", "Utilities", "Remote Access", "Media", "Editors", "Unknown"];

export function SoftwareAuditPanel() {
  const { user } = useAuth();
  const { stats, devices } = useHorizonStats();
  const [software, setSoftware] = useState<SoftwareItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showVulnerable, setShowVulnerable] = useState(false);
  const [showUnapproved, setShowUnapproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSoftware();
    }
  }, [user]);

  const loadSoftware = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_software_audit')
        .select('*')
        .eq('user_id', user.id)
        .order('device_count', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setSoftware(data.map((s: any) => ({
          id: s.id,
          name: s.name,
          version: s.version || '',
          publisher: s.publisher || 'Unknown',
          deviceCount: s.device_count || 0,
          category: s.category || 'Unknown',
          isApproved: s.is_approved,
          hasVulnerabilities: s.has_vulnerabilities,
          vulnerabilityCount: s.vulnerability_count || 0
        })));
      }
    } catch (error) {
      console.error('Error loading software:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentApproval: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('vanguard_software_audit')
        .update({ is_approved: !currentApproval })
        .eq('id', id);

      if (error) throw error;

      setSoftware(prev => prev.map(s => 
        s.id === id ? { ...s, isApproved: !currentApproval } : s
      ));
      toast.success(currentApproval ? 'Software marked as unapproved' : 'Software approved');
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval status');
    }
  };

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

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
              {filteredSoftware.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {software.length === 0 ? 'No software inventory data yet' : 'No software matches your filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSoftware.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleApproval(item.id, item.isApproved)}
                        >
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
                        </Button>
                        {item.hasVulnerabilities && (
                          <Badge variant="destructive">
                            {item.vulnerabilityCount} CVE
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}