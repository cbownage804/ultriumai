import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Wifi,
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  MemoryStick,
  Network,
  Calendar,
  User,
  Building2,
  Folder,
  Edit,
  RefreshCw,
} from "lucide-react";
import { useVanguardAgent } from "@/hooks/useVanguardAgents";
import { useMSP } from "@/hooks/useMSP";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

export default function VanguardDeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const { agent, metrics, isLoading, refetch } = useVanguardAgent(deviceId);
  const { clients } = useMSP();
  const [activeTab, setActiveTab] = useState("overview");
  const [availabilityMonitoring, setAvailabilityMonitoring] = useState(true);

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

  // Get latest metrics
  const latestMetrics = metrics[metrics.length - 1];

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
              <TabsList className="bg-white border border-gray-200 p-1">
                <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gray-100">
                  <Monitor className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="hardware" className="gap-2 data-[state=active]:bg-gray-100">
                  <Cpu className="h-4 w-4" />
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
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Device Info */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900">Device info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">Availability monitoring</span>
                        <Switch 
                          checked={availabilityMonitoring} 
                          onCheckedChange={setAvailabilityMonitoring}
                        />
                      </div>
                      <InfoRow label="Device name" value={agent.name} />
                      <InfoRow label="Agent version" value={agent.agent_version || "Unknown"} />
                      <InfoRow label="Public IP" value={agent.ip_address || "—"} />
                      <InfoRow label="Private IP" value={agent.vpn_ip || "—"} />
                      <InfoRow 
                        label="Last seen" 
                        value={agent.last_heartbeat 
                          ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                          : "Never"
                        } 
                      />
                      <InfoRow 
                        label="Date added" 
                        value={format(new Date(agent.created_at), "MMM d, yyyy h:mm a")} 
                      />
                    </CardContent>
                  </Card>

                  {/* Owner Info */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-900">Owner info</CardTitle>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4 text-gray-400" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Site
                        </span>
                        <a href="#" className="text-sm text-teal-600 hover:underline">{clientName}</a>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          Folder
                        </span>
                        <span className="text-sm text-gray-700">—</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          User
                        </span>
                        <span className="text-sm text-gray-700">—</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="hardware" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-900">Hardware Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Vendor" value="—" />
                    <InfoRow label="Model" value="—" />
                    <InfoRow label="Serial number" value="—" />
                    <InfoRow label="Processor" value="—" />
                    <InfoRow label="Memory" value="—" />
                    <InfoRow label="Video card" value="—" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="disks" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-900">Disk Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">No disk information available</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-900">OS & Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="OS edition" value={agent.os_info || "Unknown"} />
                    <InfoRow label="Antivirus" value="—" />
                    <InfoRow label="Firewall" value="—" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-900">Custom Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">No custom fields configured</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="passwords" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-900">Passwords</CardTitle>
                    <Button size="sm" variant="outline">New password</Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">No passwords stored</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attachments" className="mt-4">
                <Card className="bg-white border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-900">Attachments</CardTitle>
                    <Button size="sm" variant="outline">Add attachment</Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">No attachments</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Widgets */}
          <div className="w-80 space-y-4">
            {/* Alert Status Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Alert status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold">0</span>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Warning</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold">0</span>
                    <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metrics Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MetricBar 
                  label="CPU" 
                  value={latestMetrics?.cpu_percent || agent.cpu_usage || 0} 
                  icon={<Cpu className="h-4 w-4" />}
                />
                <MetricBar 
                  label="Memory" 
                  value={latestMetrics?.memory_percent || agent.memory_usage || 0} 
                  icon={<MemoryStick className="h-4 w-4" />}
                />
                <MetricBar 
                  label="Disk" 
                  value={latestMetrics?.disk_percent || agent.disk_usage || 0} 
                  icon={<HardDrive className="h-4 w-4" />}
                />
              </CardContent>
            </Card>

            {/* Patches Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Patches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pending patches</span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">No recent alerts</p>
              </CardContent>
            </Card>

            {/* Activity Log Widget */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Activity log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ActivityItem 
                    time={agent.last_heartbeat ? format(new Date(agent.last_heartbeat), "h:mm a") : "—"} 
                    text="Last heartbeat received" 
                  />
                  <ActivityItem 
                    time={format(new Date(agent.created_at), "MMM d")} 
                    text="Agent installed" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const percentage = Math.min(100, Math.max(0, value));
  const color = percentage > 90 ? "bg-red-500" : percentage > 70 ? "bg-yellow-500" : "bg-green-500";
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-medium">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function ActivityItem({ time, text }: { time: string; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 w-16 shrink-0">{time}</span>
      <span className="text-gray-700">{text}</span>
    </div>
  );
}
