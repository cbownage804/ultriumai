import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Smartphone, 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Ticket,
  Server,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  MessageSquare,
  Phone,
  Navigation,
  Camera,
  Settings,
  Download,
  RefreshCw
} from "lucide-react";

interface MobileDevice {
  id: string;
  name: string;
  type: "technician" | "manager" | "client";
  status: "online" | "offline";
  lastSeen: string;
  location?: string;
  battery?: number;
  signal?: number;
  version?: string;
}

interface MobileAlert {
  id: string;
  type: "urgent" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  deviceId: string;
}

interface FieldTicket {
  id: string;
  title: string;
  client: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "assigned" | "in_progress" | "completed";
  assignedTo: string;
  location: string;
  eta?: string;
}

export const MobileApp = () => {
  const [devices, setDevices] = useState<MobileDevice[]>([
    {
      id: "tech-001",
      name: "John's iPhone",
      type: "technician",
      status: "online",
      lastSeen: "2 minutes ago",
      location: "Downtown Office",
      battery: 85,
      signal: 4,
      version: "1.2.3"
    },
    {
      id: "tech-002",
      name: "Sarah's Android",
      type: "technician",
      status: "online",
      lastSeen: "5 minutes ago",
      location: "Client Site A",
      battery: 45,
      signal: 3,
      version: "1.2.3"
    },
    {
      id: "mgr-001",
      name: "Manager iPad",
      type: "manager",
      status: "offline",
      lastSeen: "1 hour ago",
      location: "Head Office",
      battery: 92,
      signal: 4,
      version: "1.2.1"
    }
  ]);

  const [alerts, setAlerts] = useState<MobileAlert[]>([
    {
      id: "alert-001",
      type: "urgent",
      title: "Critical Alert",
      message: "Server outage at Client Site B requires immediate attention",
      time: "5 minutes ago",
      deviceId: "tech-001"
    },
    {
      id: "alert-002",
      type: "warning",
      title: "Low Battery",
      message: "Technician device battery below 50%",
      time: "15 minutes ago",
      deviceId: "tech-002"
    },
    {
      id: "alert-003",
      type: "info",
      title: "Update Available",
      message: "Mobile app version 1.2.4 is available",
      time: "1 hour ago",
      deviceId: "mgr-001"
    }
  ]);

  const [fieldTickets, setFieldTickets] = useState<FieldTicket[]>([
    {
      id: "ft-001",
      title: "Network connectivity issues",
      client: "ABC Corp",
      priority: "critical",
      status: "in_progress",
      assignedTo: "John Doe",
      location: "123 Business Ave",
      eta: "15 mins"
    },
    {
      id: "ft-002",
      title: "Workstation setup",
      client: "XYZ Inc",
      priority: "medium",
      status: "assigned",
      assignedTo: "Sarah Smith",
      location: "456 Tech Street"
    },
    {
      id: "ft-003",
      title: "Server maintenance",
      client: "DEF LLC",
      priority: "high",
      status: "completed",
      assignedTo: "Mike Johnson",
      location: "789 Corporate Blvd"
    }
  ]);

  const { toast } = useToast();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "technician":
        return <Smartphone className="h-5 w-5 text-blue-500" />;
      case "manager":
        return <Smartphone className="h-5 w-5 text-purple-500" />;
      default:
        return <Smartphone className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200";
      case "offline":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const sendPushNotification = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    toast({
      title: "Push Notification Sent",
      description: `Notification sent to ${device?.name}`
    });
  };

  const generateMobileReport = () => {
    toast({
      title: "Mobile Report Generated",
      description: "Field operations report has been generated and sent to your email."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mobile Operations</h2>
          <p className="text-muted-foreground">
            Manage field technicians and mobile workforce
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateMobileReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Mobile Settings
          </Button>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.length}</p>
                <p className="text-sm text-muted-foreground">Mobile Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.filter(d => d.status === "online").length}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Ticket className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fieldTickets.filter(t => t.status === "in_progress").length}</p>
                <p className="text-sm text-muted-foreground">Active Field Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{devices.filter(d => d.type === "technician").length}</p>
                <p className="text-sm text-muted-foreground">Field Technicians</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mobile Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Devices
            </CardTitle>
            <CardDescription>
              Real-time status of field devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.type)}
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={getStatusColor(device.status)}>
                          {device.status === "online" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                          {device.status}
                        </Badge>
                        <span>{device.lastSeen}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.battery && (
                      <div className="flex items-center gap-1 text-sm">
                        <Battery className="h-4 w-4" />
                        {device.battery}%
                      </div>
                    )}
                    {device.signal && (
                      <div className="flex items-center gap-1 text-sm">
                        <Signal className="h-4 w-4" />
                        {device.signal}/4
                      </div>
                    )}
                    <Button size="sm" variant="outline" onClick={() => sendPushNotification(device.id)}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Mobile Alerts
            </CardTitle>
            <CardDescription>
              Recent alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert key={alert.id} className={alert.type === "urgent" ? "border-red-200 bg-red-50" : ""}>
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Field Tickets
          </CardTitle>
          <CardDescription>
            On-site service requests and progress tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fieldTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{ticket.title}</h4>
                    <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge variant={ticket.status === "completed" ? "default" : "secondary"}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                    <span>Client: {ticket.client}</span>
                    <span>Assigned: {ticket.assignedTo}</span>
                    <span>Location: {ticket.location}</span>
                  </div>
                  {ticket.eta && (
                    <div className="flex items-center gap-1 mt-2 text-sm font-medium text-blue-600">
                      <Clock className="h-3 w-3" />
                      ETA: {ticket.eta}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile App Downloads */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile App Distribution</CardTitle>
          <CardDescription>
            Deploy and manage mobile apps for your technicians
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-6 border rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Technician App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Field service management and ticket handling
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download APK
              </Button>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Manager App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time monitoring and team management
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download iOS
              </Button>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Client App</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Self-service portal and ticket submission
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PWA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};