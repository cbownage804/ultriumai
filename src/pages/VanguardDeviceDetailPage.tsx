import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVanguardBasePath } from "@/utils/subdomain";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  ChevronDown,
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Ticket,
  MoreHorizontal,
  Trash2,
  Monitor,
  HardDrive,
  Shield,
  FileText,
  Key,
  Paperclip,
  Server,
  RefreshCw,
  GripVertical,
  RotateCcw,
  Copy,
  Package,
  Download,
  Play,
  Network,
  Users,
  Activity,
} from "lucide-react";
// Vanguard Atlas (formerly SafeDoc) - no logo import needed, using Shield icon
import { useVanguardAgent, useVanguardAgents } from "@/hooks/useVanguardAgents";
import { useDeviceAtlasPasswords } from "@/hooks/useDeviceAtlasPasswords";
import { useMSP } from "@/hooks/useMSP";
import { cn } from "@/lib/utils";
import { calculateDeviceSecurityScore } from "@/utils/calculateDeviceSecurityScore";
import { toast } from "sonner";

// Tab Components
import { DeviceOverviewTab } from "@/components/vanguard/device/DeviceOverviewTab";
import { DeviceHardwareTab } from "@/components/vanguard/device/DeviceHardwareTab";
import { DeviceDisksTab } from "@/components/vanguard/device/DeviceDisksTab";
import { DeviceSoftwareTab } from "@/components/vanguard/device/DeviceSoftwareTab";
import { DeviceSecurityTab } from "@/components/vanguard/device/DeviceSecurityTab";
import { DeviceCustomFieldsTab } from "@/components/vanguard/device/DeviceCustomFieldsTab";
import { DevicePasswordsTab } from "@/components/vanguard/device/DevicePasswordsTab";
import { DeviceAttachmentsTab } from "@/components/vanguard/device/DeviceAttachmentsTab";
import { DeviceMonitoredTab } from "@/components/vanguard/device/DeviceMonitoredTab";
import { DeviceUpdatesTab } from "@/components/vanguard/device/DeviceUpdatesTab";
import { DeviceStartupTab } from "@/components/vanguard/device/DeviceStartupTab";
import { DeviceNetworkConnectionsTab } from "@/components/vanguard/device/DeviceNetworkConnectionsTab";
import { DeviceUsersTab } from "@/components/vanguard/device/DeviceUsersTab";
import { DevicePerformanceTab } from "@/components/vanguard/device/DevicePerformanceTab";

// Widget Components
import { DeviceAlertStatusWidget } from "@/components/vanguard/device/widgets/DeviceAlertStatusWidget";
import { DevicePatchesWidget } from "@/components/vanguard/device/widgets/DevicePatchesWidget";
import { DeviceMetricsWidget } from "@/components/vanguard/device/widgets/DeviceMetricsWidget";
import { DeviceAlertsWidget } from "@/components/vanguard/device/widgets/DeviceAlertsWidget";
import { DeviceProfilesWidget } from "@/components/vanguard/device/widgets/DeviceProfilesWidget";
import { DeviceShutdownActionsWidget } from "@/components/vanguard/device/widgets/DeviceShutdownActionsWidget";
import { DeviceActivityLogWidget } from "@/components/vanguard/device/widgets/DeviceActivityLogWidget";

// Dialog Components
import {
  AddPasswordDialog,
  AddCustomFieldDialog,
  AddAttachmentDialog,
  AddMonitoredDeviceDialog,
} from "@/components/vanguard/device/dialogs";

// Widget order for customization
type WidgetId = 'alert-status' | 'patches' | 'metrics' | 'alerts' | 'profiles' | 'shutdown' | 'activity' | 'atlas';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'atlas',
  'alert-status',
  'patches', 
  'metrics',
  'alerts',
  'profiles',
  'shutdown',
  'activity'
];

export default function VanguardDeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { 
    agent, 
    metrics, 
    isLoading, 
    refetch,
    sendCommand,
    addPassword,
    deletePassword,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    addAttachment,
    deleteAttachment,
    addMonitoredDevice,
    deleteMonitoredDevice,
    toggleAvailabilityMonitoring,
  } = useVanguardAgent(deviceId);
  const { clients } = useMSP();
  const { deleteAgent } = useVanguardAgents();
  const basePath = getVanguardBasePath();
  
  // Atlas passwords for this device
  const { addPassword: atlasAddPassword } = useDeviceAtlasPasswords(deviceId, agent?.client_id);
  
  // UI State
  const [activeTab, setActiveTab] = useState("overview");
  const [alertsPaused, setAlertsPaused] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);
  
  // Dialog State
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [showMonitoredDeviceDialog, setShowMonitoredDeviceDialog] = useState(false);

  // Handlers
  const handleResetLayout = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
    setShowResetDialog(false);
    toast.success("Page layout reset to default");
  };

  const handleDragStart = (widget: WidgetId) => {
    setDraggedWidget(widget);
  };

  const handleDragOver = (e: React.DragEvent, targetWidget: WidgetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetWidget) return;
    
    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetWidget);
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedWidget);
    
    setWidgetOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handleManagePatches = () => {
    if (!deviceId) return;
    navigate(`${basePath}/patches?deviceId=${encodeURIComponent(deviceId)}`);
  };

  const handleRunScript = () => {
    if (!deviceId) return;
    navigate(`${basePath}/scripts?deviceId=${encodeURIComponent(deviceId)}`);
  };

  const handleDeploySoftware = () => {
    if (!deviceId) return;
    navigate(`${basePath}/apps?deviceId=${encodeURIComponent(deviceId)}`);
  };

  const handleReboot = async () => {
    try {
      // Standardized command type used throughout Vanguard command queue
      await sendCommand('restart', { delay_seconds: 30, message: 'System will restart in 30 seconds' });
      toast.success("Restart command sent to device");
    } catch (err) {
      toast.error("Failed to send restart command");
    }
  };

  const handleManageProfiles = () => {
    navigate(`${basePath}/profiles?deviceId=${encodeURIComponent(deviceId || '')}`);
  };

  const handleScheduleAction = () => {
    // Scroll to the shutdown actions widget and show a prompt
    toast.info("Use the 'Schedule action...' option in the Scheduled shutdown actions widget on the right panel");
  };

  const handleCortex = () => {
    navigate(`${basePath}/cortex`);
  };

  const handleCreateTicket = () => {
    // Pre-fill ticket with device info
    navigate(`${basePath}/tickets?action=create&deviceId=${encodeURIComponent(deviceId || '')}&deviceName=${encodeURIComponent(agent?.name || '')}`);
  };

  const handleLogout = async () => {
    try {
      await sendCommand('logout_user');
      toast.success("Logout command sent");
    } catch (err) {
      toast.error("Failed to send logout command");
    }
  };

  const handleShutdown = async () => {
    try {
      await sendCommand('shutdown');
      toast.success("Shutdown command sent");
    } catch (err) {
      toast.error("Failed to send shutdown command");
    }
  };

  const handleSyncRustDesk = async () => {
    try {
      await sendCommand('sync_rustdesk');
      toast.success("Sync RustDesk command sent", {
        description: "The agent will install/configure RustDesk and report its ID. Refresh the page in a minute."
      });
    } catch (err) {
      toast.error("Failed to send sync command");
    }
  };

  const handleRemoteConnect = (type: 'desktop' | 'terminal' | 'files') => {
    console.log('[RemoteConnect] handleRemoteConnect called with type:', type);
    // Check for RustDesk ID - first from direct column, then fallback to config locations
    const rustdeskId = agent?.rustdesk_id || 
                       agent?.config?.hardware?.rustdesk_id || 
                       agent?.config?.remote_access?.rustdesk_id ||
                       agent?.config?.rustdesk_id;
    console.log('[RemoteConnect] rustdeskId resolved:', rustdeskId);
    
    if (!rustdeskId) {
      toast.error("RustDesk ID not available", {
        description: "The agent hasn't reported a RustDesk ID yet. Ensure RustDesk is installed on the device."
      });
      return;
    }

    const url = `rustdesk://${rustdeskId}`;

    // Best-effort: copy ID so the click always results in something the tech can use.
    // (Clipboard can fail in some browsers/iframes; that's ok.)
    try {
      void navigator.clipboard?.writeText(String(rustdeskId));
    } catch {
      // ignore
    }

    const tryLaunch = () => {
      try {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) {
          window.location.assign(url);
        }
      } catch {
        try {
          window.location.assign(url);
        } catch {
          // ignore
        }
      }
    };
    
    // For Remote Desktop, use rustdesk:// protocol
    if (type === 'desktop') {
      toast.success("Opening RustDesk...", {
        description: `ID ${rustdeskId} (copied). If nothing opens, your browser/iframe blocked the protocol—open RustDesk and enter the ID.`
      });
      tryLaunch();
      return;
    }
    
    // For Terminal and File Manager, these typically require the RustDesk GUI
    // Open RustDesk and show instructions
    if (type === 'terminal') {
      toast.success("Opening RustDesk for Terminal access...", {
        description: `ID ${rustdeskId} (copied). Use Ctrl+Shift+T in RustDesk to open terminal.`
      });
      tryLaunch();
      return;
    }
    
    if (type === 'files') {
      toast.success("Opening RustDesk for File Transfer...", {
        description: `ID ${rustdeskId} (copied). Use the File Transfer tab in RustDesk.`
      });
      tryLaunch();
    }
  };

  const handleDeleteAgent = async () => {
    if (!deviceId) return;
    
    try {
      setIsDeleting(true);
      // Navigate FIRST to prevent race condition with realtime subscription
      // causing redirect to catch-all route
      navigate(`${basePath}/devices`, { replace: true });
      // Then delete the agent
      await deleteAgent(deviceId);
    } catch (err: any) {
      console.error('Error deleting agent:', err);
      // On error, we're already on devices page, just show error
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050a0a] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#050a0a] p-6">
        <div className="text-center py-12">
          <p className="text-white/60">Device not found</p>
          <Button
            variant="outline"
            className="mt-4 border-cyan-500/30 text-white hover:bg-cyan-500/10"
            onClick={() => navigate(`${basePath}/devices`)}
          >
            Back to Devices
          </Button>
        </div>
      </div>
    );
  }

  const isOnline = agent.last_heartbeat && 
    Date.now() - new Date(agent.last_heartbeat).getTime() < 5 * 60 * 1000;
  
  const clientName = clients.find(c => c.id === agent.client_id)?.company_name || "Unknown";
  const latestMetrics = metrics[metrics.length - 1];

  // Mock data for widgets (in real app, these would come from the agent or API)
  const mockAlerts = agent.config?.alerts || [];
  const mockActivities = agent.config?.activities || [];
  const mockScheduledActions = agent.config?.scheduled_actions || [];

  // Render widget by ID
  const renderWidget = (widgetId: WidgetId) => {
    const commonProps = {
      draggable: true,
      onDragStart: () => handleDragStart(widgetId),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, widgetId),
      onDragEnd: handleDragEnd,
      className: cn(
        "cursor-move transition-all",
        draggedWidget === widgetId && "opacity-50 scale-95"
      ),
    };

    switch (widgetId) {
      case 'alert-status':
        const securityResult = calculateDeviceSecurityScore(agent);
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceAlertStatusWidget
              warningCount={0}
              criticalCount={0}
              isPaused={alertsPaused}
              onPauseToggle={setAlertsPaused}
              status={agent.status}
              lastHeartbeat={agent.last_heartbeat}
              securityScore={securityResult.score}
            />
          </div>
        );
      case 'patches':
        return (
          <div key={widgetId} {...commonProps}>
            <DevicePatchesWidget
              availableCount={0}
              pendingCount={0}
              onManagePatches={handleManagePatches}
              onReboot={handleReboot}
            />
          </div>
        );
      case 'metrics':
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceMetricsWidget
              currentMetrics={{
                cpu: latestMetrics?.cpu_percent || agent.cpu_usage || 0,
                memory: latestMetrics?.memory_percent || agent.memory_usage || 0,
                disk: latestMetrics?.disk_percent || agent.disk_usage || 0,
              }}
            />
          </div>
        );
      case 'alerts':
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceAlertsWidget
              alerts={mockAlerts}
              onCreateTicket={(id) => toast.info(`Creating ticket for alert ${id}`)}
              onLaunchCopilot={(id) => toast.info(`Launching Cortex for alert ${id}`)}
              onResolve={(id) => toast.success(`Alert ${id} resolved`)}
              onSnooze={(id) => toast.success(`Alert ${id} snoozed`)}
              onDelete={(id) => toast.success(`Alert ${id} deleted`)}
            />
          </div>
        );
      case 'profiles':
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceProfilesWidget
              thresholdProfile={agent.config?.threshold_profile || null}
              automationProfiles={agent.config?.automation_profiles || []}
              configurationPolicy={agent.config?.configuration_policy || null}
              onManageProfiles={handleManageProfiles}
            />
          </div>
        );
      case 'shutdown':
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceShutdownActionsWidget
              scheduledActions={mockScheduledActions}
              onScheduleAction={handleScheduleAction}
              onDeleteAction={(id) => toast.success(`Action ${id} deleted`)}
              onLogout={handleLogout}
              onRestart={handleReboot}
              onShutdown={handleShutdown}
            />
          </div>
        );
      case 'activity':
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceActivityLogWidget activities={mockActivities} />
          </div>
        );
      case 'atlas':
        return (
          <div key={widgetId} {...commonProps}>
            <div className="bg-black/80 rounded-lg border border-cyan-500/30 p-4 shadow-lg shadow-purple-500/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-cyan-400" />
                <h3 className="font-medium text-white">Vanguard Atlas</h3>
              </div>
              <p className="text-xs text-white/60 mb-3">
                {clientName} documentation
              </p>
              <div className="space-y-2">
                <div className="p-2 rounded bg-black/40 border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-3 w-3 text-amber-500" />
                    <span className="text-white text-xs font-medium">Domain Admin</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-cyan-400 text-xs">admin@domain.local</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-white/40 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText('admin@domain.local');
                        toast.success('Copied username');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 rounded bg-black/40 border border-cyan-500/20 hover:border-cyan-500/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="h-3 w-3 text-blue-500" />
                    <span className="text-white text-xs font-medium">Device Config</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-cyan-400 text-xs">{agent?.ip_address || '192.168.1.x'}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5 text-white/40 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(agent?.ip_address || '192.168.1.x');
                        toast.success('Copied IP address');
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 mt-2"
                  onClick={() => navigate(`${basePath}/atlas`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open Vanguard Atlas
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#050a0a]">
      {/* Page Header */}
      <div className="bg-black/80 border-b border-cyan-500/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`${basePath}/devices`)}
              className="text-white/60 hover:text-white hover:bg-cyan-500/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <h1 className="text-xl font-semibold text-white">{agent.name}</h1>
              <Badge variant="outline" className="text-white/60 border-cyan-500/30">
                {agent.os_info || "Unknown OS"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOnline && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:opacity-90 text-white gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Connect
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      className="w-full text-left text-white hover:bg-cyan-500/10 cursor-pointer px-2 py-1.5"
                      onClick={() => handleRemoteConnect('desktop')}
                    >
                      Remote Desktop
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      className="w-full text-left text-white hover:bg-cyan-500/10 cursor-pointer px-2 py-1.5"
                      onClick={() => handleRemoteConnect('terminal')}
                    >
                      Terminal
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      className="w-full text-left text-white hover:bg-cyan-500/10 cursor-pointer px-2 py-1.5"
                      onClick={() => handleRemoteConnect('files')}
                    >
                      File Manager
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-cyan-500/30 text-white hover:bg-cyan-500/10">
                  Manage
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
                <DropdownMenuItem onClick={handleRunScript} className="text-white hover:bg-cyan-500/10">
                  Run Script
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeploySoftware} className="text-white hover:bg-cyan-500/10">
                  Deploy Software
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManagePatches} className="text-white hover:bg-cyan-500/10">
                  Patch Management
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReboot} className="text-white hover:bg-cyan-500/10">
                  Restart Device
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSyncRustDesk} className="text-white hover:bg-cyan-500/10">
                  Sync RustDesk ID
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              className="gap-2 border-cyan-500/30 text-white hover:bg-cyan-500/10"
              onClick={handleCortex}
            >
              <Sparkles className="h-4 w-4" />
              Vanguard Cortex
            </Button>
            
            <Button 
              variant="outline" 
              className="gap-2 border-cyan-500/30 text-white hover:bg-cyan-500/10"
              onClick={handleCreateTicket}
            >
              <Ticket className="h-4 w-4" />
              Create ticket
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-cyan-500/10">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-cyan-500/30">
                <DropdownMenuItem onClick={() => setShowResetDialog(true)} className="text-white hover:bg-cyan-500/10">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset page layout
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)} 
                  className="text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left Side - Tabs */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-black/60 border border-cyan-500/30 p-1 flex-wrap h-auto">
                <TabsTrigger value="overview" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Monitor className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Activity className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="hardware" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Monitor className="h-4 w-4" />
                  Hardware
                </TabsTrigger>
                <TabsTrigger value="disks" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <HardDrive className="h-4 w-4" />
                  Disks
                </TabsTrigger>
                <TabsTrigger value="software" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Package className="h-4 w-4" />
                  Software
                </TabsTrigger>
                <TabsTrigger value="updates" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Download className="h-4 w-4" />
                  Updates
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Shield className="h-4 w-4" />
                  OS & Security
                </TabsTrigger>
                <TabsTrigger value="startup" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Play className="h-4 w-4" />
                  Startup
                </TabsTrigger>
                <TabsTrigger value="network" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Network className="h-4 w-4" />
                  Connections
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <FileText className="h-4 w-4" />
                  Custom fields
                </TabsTrigger>
                <TabsTrigger value="passwords" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Key className="h-4 w-4" />
                  Passwords
                </TabsTrigger>
                <TabsTrigger value="attachments" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </TabsTrigger>
                <TabsTrigger value="monitored" className="gap-2 text-white/60 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Server className="h-4 w-4" />
                  Monitored devices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <DeviceOverviewTab
                  agent={agent}
                  clientName={clientName}
                  clientId={agent.client_id}
                  availabilityMonitoring={agent.availability_monitoring_enabled ?? false}
                  onAvailabilityChange={toggleAvailabilityMonitoring}
                />
              </TabsContent>

              <TabsContent value="performance" className="mt-4">
                <DevicePerformanceTab agent={agent} metrics={metrics} />
              </TabsContent>

              <TabsContent value="hardware" className="mt-4">
                <DeviceHardwareTab agent={agent} />
              </TabsContent>

              <TabsContent value="disks" className="mt-4">
                <DeviceDisksTab agent={agent} />
              </TabsContent>

              <TabsContent value="software" className="mt-4">
                <DeviceSoftwareTab agent={agent} sendCommand={sendCommand} />
              </TabsContent>

              <TabsContent value="updates" className="mt-4">
                <DeviceUpdatesTab agent={agent} />
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <DeviceSecurityTab agent={agent} />
              </TabsContent>

              <TabsContent value="startup" className="mt-4">
                <DeviceStartupTab agent={agent} />
              </TabsContent>

              <TabsContent value="network" className="mt-4">
                <DeviceNetworkConnectionsTab agent={agent} />
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <DeviceUsersTab agent={agent} />
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <DeviceCustomFieldsTab
                  agent={agent} 
                  onAddField={() => setShowCustomFieldDialog(true)}
                  onDeleteField={deleteCustomField}
                />
              </TabsContent>

              <TabsContent value="passwords" className="mt-4">
                <DevicePasswordsTab 
                  agent={agent}
                  onAddPassword={() => setShowPasswordDialog(true)}
                  onDeletePassword={deletePassword}
                />
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <DeviceAttachmentsTab 
                  agent={agent}
                  onUpload={() => setShowAttachmentDialog(true)}
                  onDeleteAttachment={deleteAttachment}
                />
              </TabsContent>

              <TabsContent value="monitored" className="mt-4">
                <DeviceMonitoredTab 
                  agent={agent}
                  onAddDevice={() => setShowMonitoredDeviceDialog(true)}
                  onDeleteDevice={deleteMonitoredDevice}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Draggable Widgets */}
          <div className="w-80 space-y-4">
            {widgetOrder.map(renderWidget)}
          </div>
        </div>
      </div>

      {/* Reset Layout Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-black/95 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Reset page layout?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">
            This will reset all widget positions to their default locations.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} className="border-cyan-500/30 text-white hover:bg-cyan-500/10">
              Cancel
            </Button>
            <Button onClick={handleResetLayout} className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              Reset layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Password Dialog */}
      <AddPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSave={async (password) => {
          await atlasAddPassword(password);
        }}
      />

      {/* Add Custom Field Dialog */}
      <AddCustomFieldDialog
        open={showCustomFieldDialog}
        onOpenChange={setShowCustomFieldDialog}
        onSave={async (field) => {
          await addCustomField(field);
        }}
      />

      {/* Add Attachment Dialog */}
      <AddAttachmentDialog
        open={showAttachmentDialog}
        onOpenChange={setShowAttachmentDialog}
        onSave={async (attachment) => {
          await addAttachment(attachment);
        }}
      />

      {/* Add Monitored Device Dialog */}
      <AddMonitoredDeviceDialog
        open={showMonitoredDeviceDialog}
        onOpenChange={setShowMonitoredDeviceDialog}
        onSave={async (device) => {
          await addMonitoredDevice(device);
        }}
      />

      {/* Delete Agent Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-black/95 border-red-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this device?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently remove <span className="font-semibold text-white">{agent?.name}</span> from your account. 
              You will need to redeploy the agent to use it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="border-cyan-500/30 text-white hover:bg-cyan-500/10"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAgent}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Agent
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
