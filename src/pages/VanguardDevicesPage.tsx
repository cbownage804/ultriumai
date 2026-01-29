import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronDown,
  Star,
  MessageCircle,
  Download,
  Filter,
  Settings2,
  Play,
  Zap,
  Package,
  Target,
  MoreHorizontal,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { useMSP } from "@/hooks/useMSP";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function VanguardDevicesPage() {
  const navigate = useNavigate();
  const { agents } = useVanguardAgents();
  const { clients } = useMSP();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  // Mock device data matching Atera style
  const mockDevices = [
    {
      id: "1",
      name: "Kudo-MBP16",
      starred: false,
      hasAI: false,
      availability: "offline",
      deviceType: "Mac",
      siteName: "Pescespada Island",
      lastLogin: "juliankudo",
      lastLoginDate: null,
    },
    {
      id: "2",
      name: "Ned's PC",
      starred: false,
      hasAI: true,
      availability: "online",
      deviceType: "PC",
      siteName: "Pescespada Island",
      lastLogin: "teddyadmin",
      lastLoginDate: new Date("2024-03-18T14:39:32"),
    },
    {
      id: "3",
      name: "Klaus' WIN10-2",
      starred: false,
      hasAI: true,
      availability: "online",
      deviceType: "PC",
      siteName: "Pescespada Island",
      lastLogin: "teddyadmin",
      lastLoginDate: new Date("2024-01-04T07:30:12"),
    },
    {
      id: "4",
      name: "Intern laptop",
      starred: false,
      hasAI: true,
      availability: "offline",
      deviceType: "PC",
      siteName: "Pescespada Island",
      lastLogin: "GuyGoodman-Ratner",
      lastLoginDate: new Date("2022-09-12T16:17:00"),
    },
  ];

  // Use real agents if available, otherwise mock data
  const devices = agents.length > 0
    ? agents.map((agent) => ({
        id: agent.id,
        name: agent.name || agent.device_id || "Unknown",
        starred: false,
        hasAI: true,
        availability: agent.last_heartbeat && 
          Date.now() - new Date(agent.last_heartbeat).getTime() < 5 * 60 * 1000
            ? "online"
            : "offline",
        deviceType: agent.os_info?.includes("Mac") ? "Mac" : 
                   agent.os_info?.includes("Linux") ? "Linux" : "PC",
        siteName: clients.find(c => c.id === agent.client_id)?.company_name || "Unknown Site",
        lastLogin: "",
        lastLoginDate: agent.last_heartbeat ? new Date(agent.last_heartbeat) : null,
      }))
    : mockDevices;

  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDeviceSelection = (id: string) => {
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleAllDevices = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map((d) => d.id));
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-black/60 border-b border-cyan-500/30 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">Devices</h1>
            <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
              <MessageCircle className="h-4 w-4" />
              Give feedback
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white gap-2 shadow-lg shadow-cyan-500/25 border-0">
              New device
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-black/80 rounded-xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/5 backdrop-blur-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between gap-4 bg-black/40">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-500/60" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-black/60 border-cyan-500/30 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400/60 bg-black/40">
                Save view
              </Button>
              <Select defaultValue="default">
                <SelectTrigger className="w-[130px] h-9 border-cyan-500/30 bg-black/60 text-white hover:border-cyan-400/50">
                  <SelectValue placeholder="Default view" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="default" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Default view</SelectItem>
                  <SelectItem value="custom" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Custom view</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[120px] h-9 border-cyan-500/30 bg-black/60 text-white hover:border-cyan-400/50">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="all" className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">All sites</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1.5">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 gap-1.5">
                <Settings2 className="h-4 w-4" />
                Table settings
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 border-b border-cyan-500/15 flex items-center justify-between bg-black/30">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                <Play className="h-4 w-4" />
                Run script
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                <Zap className="h-4 w-4" />
                Assign automation profile
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                <Package className="h-4 w-4" />
                Software installation
              </button>
              <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 transition-colors">
                <Target className="h-4 w-4" />
                Assign threshold profile
              </button>
              <button className="text-sm text-slate-500 hover:text-cyan-400 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-slate-400">
              Displaying <span className="text-cyan-400 font-medium">{filteredDevices.length}</span> of <span className="text-cyan-400 font-medium">{devices.length}</span> devices
            </span>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-500/20 bg-black/50">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                    onCheckedChange={toggleAllDevices}
                    className="border-cyan-500/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                </th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Device name</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-2 py-3 w-12">AI</th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Availability</th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Device type</th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Site name</th>
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Last login</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Remote access</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-cyan-500/10 hover:bg-cyan-500/10 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => toggleDeviceSelection(device.id)}
                      className="border-cyan-500/50 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">{device.name}</span>
                      <button className="text-slate-600 hover:text-yellow-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <Star className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {device.hasAI && (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                        <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full ring-2",
                          device.availability === "online" 
                            ? "bg-green-400 ring-green-400/30 shadow-lg shadow-green-500/50" 
                            : "bg-red-500 ring-red-500/30"
                        )}
                      />
                      <span className={cn(
                        "text-sm font-medium capitalize",
                        device.availability === "online" ? "text-green-400" : "text-red-400"
                      )}>
                        {device.availability}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">{device.deviceType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                      {device.siteName}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-300">
                      {device.lastLogin}
                      {device.lastLoginDate && (
                        <span className="text-slate-500 ml-1">
                          ({format(device.lastLoginDate, "MMM d, yyyy h:mm a")})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    {device.availability === "online" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20 hover:border-cyan-400/60 bg-black/40"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Connect
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black border-cyan-500/30">
                          <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Remote Desktop</DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Terminal</DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">File Manager</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1 border-slate-700 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/40 bg-black/40">
                          Manage
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-black border-cyan-500/30">
                        <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Run Script</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Software Installation</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-200 focus:bg-cyan-500/20 focus:text-cyan-400">Assign Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 focus:bg-red-500/20 focus:text-red-400">Delete Device</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div className="py-12 text-center text-slate-500 bg-black/30">
              <p>No devices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
