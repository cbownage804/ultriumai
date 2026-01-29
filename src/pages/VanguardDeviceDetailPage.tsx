import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { useVanguardAgent } from "@/hooks/useVanguardAgents";
import { useMSP } from "@/hooks/useMSP";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Tab Components
import { DeviceOverviewTab } from "@/components/vanguard/device/DeviceOverviewTab";
import { DeviceHardwareTab } from "@/components/vanguard/device/DeviceHardwareTab";
import { DeviceDisksTab } from "@/components/vanguard/device/DeviceDisksTab";
import { DeviceSecurityTab } from "@/components/vanguard/device/DeviceSecurityTab";
import { DeviceCustomFieldsTab } from "@/components/vanguard/device/DeviceCustomFieldsTab";
import { DevicePasswordsTab } from "@/components/vanguard/device/DevicePasswordsTab";
import { DeviceAttachmentsTab } from "@/components/vanguard/device/DeviceAttachmentsTab";
import { DeviceMonitoredTab } from "@/components/vanguard/device/DeviceMonitoredTab";

// Widget Components
import { DeviceAlertStatusWidget } from "@/components/vanguard/device/widgets/DeviceAlertStatusWidget";
import { DevicePatchesWidget } from "@/components/vanguard/device/widgets/DevicePatchesWidget";
import { DeviceMetricsWidget } from "@/components/vanguard/device/widgets/DeviceMetricsWidget";
import { DeviceAlertsWidget } from "@/components/vanguard/device/widgets/DeviceAlertsWidget";
import { DeviceProfilesWidget } from "@/components/vanguard/device/widgets/DeviceProfilesWidget";
import { DeviceShutdownActionsWidget } from "@/components/vanguard/device/widgets/DeviceShutdownActionsWidget";
import { DeviceActivityLogWidget } from "@/components/vanguard/device/widgets/DeviceActivityLogWidget";

// Widget order for customization
type WidgetId = 'alert-status' | 'patches' | 'metrics' | 'alerts' | 'profiles' | 'shutdown' | 'activity';

const DEFAULT_WIDGET_ORDER: WidgetId[] = [
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
  const { agent, metrics, isLoading, refetch } = useVanguardAgent(deviceId);
  const { clients } = useMSP();
  const [activeTab, setActiveTab] = useState("overview");
  const [availabilityMonitoring, setAvailabilityMonitoring] = useState(true);
  const [alertsPaused, setAlertsPaused] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<WidgetId | null>(null);

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
    toast.info("Opening patch management...");
  };

  const handleReboot = () => {
    toast.success("Reboot command sent");
  };

  const handleManageProfiles = () => {
    toast.info("Opening profile management...");
  };

  const handleScheduleAction = () => {
    toast.info("Opening shutdown scheduler...");
  };

  const handleLogout = () => {
    toast.success("Logout command sent");
  };

  const handleShutdown = () => {
    toast.success("Shutdown command sent");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Device not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/vanguard/devices')}>
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
        return (
          <div key={widgetId} {...commonProps}>
            <DeviceAlertStatusWidget
              warningCount={0}
              criticalCount={0}
              isPaused={alertsPaused}
              onPauseToggle={setAlertsPaused}
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
              onLaunchCopilot={(id) => toast.info(`Launching Copilot for alert ${id}`)}
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/vanguard/devices')}
              className="text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-3 w-3 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500"
              )} />
              <h1 className="text-xl font-semibold text-gray-900">{agent.name}</h1>
              <Badge variant="outline" className="text-gray-500">
                {agent.os_info || "Unknown OS"}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOnline && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Connect
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Remote Desktop</DropdownMenuItem>
                  <DropdownMenuItem>Terminal</DropdownMenuItem>
                  <DropdownMenuItem>File Manager</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Manage
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Run Script</DropdownMenuItem>
                <DropdownMenuItem>Deploy Software</DropdownMenuItem>
                <DropdownMenuItem>Patch Management</DropdownMenuItem>
                <DropdownMenuItem>Restart Device</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Copilot
            </Button>
            
            <Button variant="outline" className="gap-2">
              <Ticket className="h-4 w-4" />
              Create ticket
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset page layout
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
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
              <TabsList className="bg-white border border-gray-200 p-1 flex-wrap h-auto">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gray-100">
                  <Monitor className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="hardware" className="gap-2 data-[state=active]:bg-gray-100">
                  <Monitor className="h-4 w-4" />
                  Hardware
                </TabsTrigger>
                <TabsTrigger value="disks" className="gap-2 data-[state=active]:bg-gray-100">
                  <HardDrive className="h-4 w-4" />
                  Disks
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-gray-100">
                  <Shield className="h-4 w-4" />
                  OS & Security
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-2 data-[state=active]:bg-gray-100">
                  <FileText className="h-4 w-4" />
                  Custom fields
                </TabsTrigger>
                <TabsTrigger value="passwords" className="gap-2 data-[state=active]:bg-gray-100">
                  <Key className="h-4 w-4" />
                  Passwords
                </TabsTrigger>
                <TabsTrigger value="attachments" className="gap-2 data-[state=active]:bg-gray-100">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </TabsTrigger>
                <TabsTrigger value="monitored" className="gap-2 data-[state=active]:bg-gray-100">
                  <Server className="h-4 w-4" />
                  Monitored devices
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <DeviceOverviewTab
                  agent={agent}
                  clientName={clientName}
                  clientId={agent.client_id}
                  availabilityMonitoring={availabilityMonitoring}
                  onAvailabilityChange={setAvailabilityMonitoring}
                />
              </TabsContent>

              <TabsContent value="hardware" className="mt-4">
                <DeviceHardwareTab agent={agent} />
              </TabsContent>

              <TabsContent value="disks" className="mt-4">
                <DeviceDisksTab agent={agent} />
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <DeviceSecurityTab agent={agent} />
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <DeviceCustomFieldsTab 
                  agent={agent} 
                  onAddField={() => toast.info("Opening custom field editor...")}
                />
              </TabsContent>

              <TabsContent value="passwords" className="mt-4">
                <DevicePasswordsTab 
                  agent={agent}
                  onAddPassword={() => toast.info("Opening password form...")}
                />
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <DeviceAttachmentsTab 
                  agent={agent}
                  onUpload={() => toast.info("Opening file uploader...")}
                />
              </TabsContent>

              <TabsContent value="monitored" className="mt-4">
                <DeviceMonitoredTab 
                  agent={agent}
                  onAddDevice={() => toast.info("Opening add monitored device form...")}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset page layout?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            This will reset all widget positions to their default locations.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetLayout}>
              Reset layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
