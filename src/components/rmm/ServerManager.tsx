import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  CheckCircle, 
  AlertTriangle, 
  Monitor,
  Terminal,
  FolderOpen,
  Package,
  Trash2,
  User,
  RotateCcw
} from "lucide-react";

interface ServerData {
  name: string;
  ip: string;
  status: string;
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUser: string;
  lastReboot: string;
  installedPrograms: number;
}

interface ServerManagerProps {
  servers: ServerData[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

export const ServerManager = ({ servers }: ServerManagerProps) => {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          Server Infrastructure
        </CardTitle>
        <CardDescription>Detailed server monitoring and management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(server.status)}
                  <div>
                    <h4 className="font-medium">{server.name}</h4>
                    <p className="text-sm text-muted-foreground">IP: {server.ip}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={server.status === 'online' ? 'default' : 'destructive'}>
                    {server.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Uptime: {server.uptime}</span>
                </div>
              </div>
              
              {/* User and Reboot Info */}
              <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Last user: {server.lastUser}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>Last reboot: {server.lastReboot}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{server.installedPrograms} programs</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>CPU</span>
                    <span className={server.cpu > 80 ? 'text-red-600' : server.cpu > 60 ? 'text-yellow-600' : 'text-green-600'}>
                      {server.cpu}%
                    </span>
                  </div>
                  <Progress value={server.cpu} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory</span>
                    <span className={server.memory > 80 ? 'text-red-600' : server.memory > 60 ? 'text-yellow-600' : 'text-green-600'}>
                      {server.memory}%
                    </span>
                  </div>
                  <Progress value={server.memory} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Disk</span>
                    <span className={server.disk > 80 ? 'text-red-600' : server.disk > 60 ? 'text-yellow-600' : 'text-green-600'}>
                      {server.disk}%
                    </span>
                  </div>
                  <Progress value={server.disk} className="h-2" />
                </div>
              </div>

              {/* Remote Access Controls */}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="h-8">
                  <Monitor className="h-3 w-3 mr-1" />
                  Remote Desktop
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <Terminal className="h-3 w-3 mr-1" />
                  PowerShell
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <Terminal className="h-3 w-3 mr-1" />
                  CMD
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  File Explorer
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <Package className="h-3 w-3 mr-1" />
                  Programs
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Uninstall
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};