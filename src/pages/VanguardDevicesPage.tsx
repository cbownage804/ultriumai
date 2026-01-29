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
import { formatDistanceToNow, format } from "date-fns";

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
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Devices</h1>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
              <MessageCircle className="h-4 w-4" />
              Give feedback
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white gap-2">
              New device
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-white border-gray-300"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-gray-600 border-gray-300">
                Save view
              </Button>
              <Select defaultValue="default">
                <SelectTrigger className="w-[130px] h-9 border-gray-300">
                  <SelectValue placeholder="Default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default view</SelectItem>
                  <SelectItem value="custom">Custom view</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-[120px] h-9 border-gray-300">
                  <SelectValue placeholder="All sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="text-gray-600 gap-1.5">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 gap-1.5">
                <Settings2 className="h-4 w-4" />
                Table settings
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Play className="h-4 w-4" />
                Run script
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Zap className="h-4 w-4" />
                Assign automation profile
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Package className="h-4 w-4" />
                Software installation
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Target className="h-4 w-4" />
                Assign threshold profile
              </button>
              <button className="text-sm text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-gray-500">
              Displaying {filteredDevices.length} of {devices.length} devices
            </span>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                    onCheckedChange={toggleAllDevices}
                  />
                </th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Device name</th>
                <th className="text-center text-xs font-medium text-gray-500 px-2 py-3 w-12">AI</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Availability</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Device type</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Site name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last login</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Remote access</th>
                <th className="text-center text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr
                  key={device.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/vanguard/devices/${device.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDevices.includes(device.id)}
                      onCheckedChange={() => toggleDeviceSelection(device.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{device.name}</span>
                      <button className="text-gray-300 hover:text-yellow-400" onClick={(e) => e.stopPropagation()}>
                        <Star className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    {device.hasAI && (
                      <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100">
                        <Sparkles className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          device.availability === "online" ? "bg-green-500" : "bg-red-500"
                        )}
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {device.availability}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{device.deviceType}</span>
                  </td>
                  <td className="px-4 py-3">
                    <a href="#" className="text-sm text-teal-600 hover:underline">
                      {device.siteName}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {device.lastLogin}
                      {device.lastLoginDate && (
                        <span className="text-gray-400 ml-1">
                          ({format(device.lastLoginDate, "MMM d, yyyy h:mm a")})
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {device.availability === "online" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-teal-600 border-teal-200 hover:bg-teal-50"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Connect
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Remote Desktop</DropdownMenuItem>
                          <DropdownMenuItem>Terminal</DropdownMenuItem>
                          <DropdownMenuItem>File Manager</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          Manage
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Run Script</DropdownMenuItem>
                        <DropdownMenuItem>Software Installation</DropdownMenuItem>
                        <DropdownMenuItem>Assign Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Device</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <p>No devices found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
