import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Sparkles,
  Columns,
  Filter,
  Save,
  LayoutGrid,
  List,
  RefreshCw,
  Plus,
  ChevronDown,
  Power,
  Play,
  Package,
  Terminal,
  Download,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SavedView {
  id: string;
  name: string;
  columns: string[];
  filters: Record<string, string>;
}

interface DevicesToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  aiSearchEnabled: boolean;
  onAiSearchToggle: (enabled: boolean) => void;
  selectedDevices: string[];
  onBulkAction: (action: string, payload?: any) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  visibleColumns: string[];
  onColumnsChange: (columns: string[]) => void;
  savedViews: SavedView[];
  onSaveView: (name: string) => void;
  onLoadView: (view: SavedView) => void;
  onRefresh: () => void;
  onAddDevice: () => void;
}

const ALL_COLUMNS = [
  { id: "name", label: "Device Name", required: true },
  { id: "status", label: "Status", required: true },
  { id: "ip_address", label: "IP Address" },
  { id: "location", label: "Location" },
  { id: "os_info", label: "OS" },
  { id: "agent_version", label: "Agent Version" },
  { id: "last_heartbeat", label: "Last Seen" },
  { id: "cpu_usage", label: "CPU %" },
  { id: "memory_usage", label: "Memory %" },
  { id: "disk_usage", label: "Disk %" },
  { id: "hailo_board_name", label: "Hailo Board" },
  { id: "client_id", label: "Client" },
];

export function DevicesToolbar({
  searchQuery,
  onSearchChange,
  aiSearchEnabled,
  onAiSearchToggle,
  selectedDevices,
  onBulkAction,
  viewMode,
  onViewModeChange,
  visibleColumns,
  onColumnsChange,
  savedViews,
  onSaveView,
  onLoadView,
  onRefresh,
  onAddDevice,
}: DevicesToolbarProps) {
  const [newViewName, setNewViewName] = useState("");

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      onColumnsChange([...visibleColumns, columnId]);
    } else {
      onColumnsChange(visibleColumns.filter((c) => c !== columnId));
    }
  };

  return (
    <div className="space-y-3">
      {/* Main toolbar row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* AI-powered search */}
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={
              aiSearchEnabled
                ? "AI Search: 'devices with high CPU' or 'offline Windows servers'..."
                : "Search devices..."
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Switch
              id="ai-search"
              checked={aiSearchEnabled}
              onCheckedChange={onAiSearchToggle}
              className="scale-75"
            />
            <Sparkles
              className={`h-4 w-4 ${
                aiSearchEnabled ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
        </div>

        {/* Column editor */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_COLUMNS.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={visibleColumns.includes(col.id)}
                onCheckedChange={(checked) => handleColumnToggle(col.id, checked)}
                disabled={col.required}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved views */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Views
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-3">
              <div className="font-medium text-sm">Saved Views</div>
              {savedViews.length === 0 ? (
                <p className="text-xs text-muted-foreground">No saved views yet</p>
              ) : (
                <div className="space-y-1">
                  {savedViews.map((view) => (
                    <Button
                      key={view.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onLoadView(view)}
                    >
                      {view.name}
                    </Button>
                  ))}
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <Input
                  placeholder="New view name..."
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!newViewName.trim()}
                  onClick={() => {
                    onSaveView(newViewName.trim());
                    setNewViewName("");
                  }}
                >
                  <Save className="h-3 w-3 mr-2" />
                  Save Current View
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* View mode toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button size="sm" onClick={onAddDevice}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Bulk actions bar - shows when devices selected */}
      {selectedDevices.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Badge variant="secondary">
            {selectedDevices.length} device{selectedDevices.length > 1 ? "s" : ""} selected
          </Badge>

          <div className="flex-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Terminal className="h-4 w-4 mr-2" />
                Run Script
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Quick Scripts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("run_script", { script: "Get-ComputerInfo", shell: "powershell" })}>
                System Info
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("run_script", { script: "Get-Service", shell: "powershell" })}>
                List Services
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("run_script", { script: "Get-Process | Sort CPU -Descending | Select -First 10", shell: "powershell" })}>
                Top Processes
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Package className="h-4 w-4 mr-2" />
                Install Software
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Package Manager</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("install_chocolatey")}>
                Install Chocolatey
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("install_package", { manager: "chocolatey", package: "googlechrome" })}>
                Chrome (Chocolatey)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("install_package", { manager: "chocolatey", package: "7zip" })}>
                7-Zip (Chocolatey)
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("install_package", { manager: "winget", package: "Microsoft.VisualStudioCode" })}>
                VS Code (WinGet)
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Actions
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("update_agent")}>
                <Download className="h-4 w-4 mr-2" />
                Update Agent
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("check_patches")}>
                Check for Patches
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("scan_vulnerabilities")}>
                Vulnerability Scan
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("reboot")} className="text-destructive">
                <Power className="h-4 w-4 mr-2" />
                Reboot All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem onClick={() => onBulkAction("shutdown")} className="text-destructive">
                <Power className="h-4 w-4 mr-2" />
                Shutdown All
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
