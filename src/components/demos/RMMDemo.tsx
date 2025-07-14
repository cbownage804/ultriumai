import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Monitor, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Shield, 
  Download,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings
} from 'lucide-react';

export const RMMDemo = () => {
  const [activeView, setActiveView] = useState('devices');

  const devices = [
    { 
      name: 'CEO-LAPTOP-01', 
      status: 'online', 
      cpu: 35, 
      memory: 68, 
      disk: 45, 
      lastSeen: '2 min ago',
      security: 'protected'
    },
    { 
      name: 'HR-DESKTOP-03', 
      status: 'online', 
      cpu: 12, 
      memory: 34, 
      disk: 78, 
      lastSeen: '1 min ago',
      security: 'protected'
    },
    { 
      name: 'SALES-LAPTOP-07', 
      status: 'warning', 
      cpu: 89, 
      memory: 92, 
      disk: 95, 
      lastSeen: '5 min ago',
      security: 'updating'
    },
    { 
      name: 'IT-SERVER-01', 
      status: 'online', 
      cpu: 45, 
      memory: 56, 
      disk: 23, 
      lastSeen: 'Just now',
      security: 'protected'
    }
  ];

  const patches = [
    { name: 'Windows Security Update KB5034441', status: 'pending', devices: 12, critical: true },
    { name: 'Microsoft Office 2021 Update', status: 'deploying', devices: 8, critical: false },
    { name: 'Adobe Acrobat Security Patch', status: 'completed', devices: 15, critical: true },
    { name: 'Chrome Browser Update v120', status: 'scheduled', devices: 20, critical: false }
  ];

  const scripts = [
    { name: 'Security Health Check', description: 'Comprehensive security audit', runtime: '~5 min' },
    { name: 'Disk Cleanup', description: 'Free up disk space and optimize', runtime: '~10 min' },
    { name: 'Password Policy Enforcer', description: 'Ensure compliance with security policies', runtime: '~2 min' },
    { name: 'Software Inventory', description: 'Audit installed applications', runtime: '~3 min' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">🏢 SafeCenter Complete MSP Platform</h3>
        <p className="text-muted-foreground">SafeDesk Helpdesk + SafeRMM Monitoring = Complete MSP Solution</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <Button 
          variant={activeView === 'devices' ? 'default' : 'outline'} 
          onClick={() => setActiveView('devices')}
        >
          <Monitor className="h-4 w-4 mr-2" />
          SafeRMM Devices
        </Button>
        <Button 
          variant={activeView === 'patches' ? 'default' : 'outline'} 
          onClick={() => setActiveView('patches')}
        >
          <Download className="h-4 w-4 mr-2" />
          Patch Management
        </Button>
        <Button 
          variant={activeView === 'scripts' ? 'default' : 'outline'} 
          onClick={() => setActiveView('scripts')}
        >
          <Settings className="h-4 w-4 mr-2" />
          SafeDesk Tickets
        </Button>
      </div>

      {activeView === 'devices' && (
        <div className="space-y-4">
          {devices.map((device, index) => (
            <Card key={index} className={device.status === 'warning' ? 'border-warning/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{device.name}</div>
                      <div className="text-sm text-muted-foreground">{device.lastSeen}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                      {device.status}
                    </Badge>
                    <Badge variant={device.security === 'protected' ? 'default' : 'secondary'}>
                      {device.security}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Cpu className="h-4 w-4 text-primary" />
                      <span className="text-sm">CPU: {device.cpu}%</span>
                    </div>
                    <Progress value={device.cpu} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-info" />
                      <span className="text-sm">Memory: {device.memory}%</span>
                    </div>
                    <Progress value={device.memory} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <HardDrive className="h-4 w-4 text-warning" />
                      <span className="text-sm">Disk: {device.disk}%</span>
                    </div>
                    <Progress value={device.disk} className="h-2" />
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3 mr-1" />
                    Remote Control
                  </Button>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Restart
                  </Button>
                  <Button size="sm" variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Security Scan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'patches' && (
        <div className="space-y-4">
          {patches.map((patch, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {patch.name}
                        {patch.critical && (
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {patch.devices} devices affected
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      patch.status === 'completed' ? 'default' :
                      patch.status === 'deploying' ? 'secondary' :
                      patch.status === 'pending' ? 'outline' : 'secondary'
                    }>
                      {patch.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      {patch.status === 'pending' ? 'Deploy Now' : 'View Details'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeView === 'scripts' && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold mb-4">SafeDesk Help Desk Integration</h4>
          {[
            { id: 'TICK-001', client: 'Acme Corp', issue: 'Printer not working', priority: 'Medium', status: 'In Progress', assignee: 'John Doe' },
            { id: 'TICK-002', client: 'Tech Solutions', issue: 'Email sync issues', priority: 'High', status: 'Open', assignee: 'Jane Smith' },
            { id: 'TICK-003', client: 'Global Industries', issue: 'Software installation', priority: 'Low', status: 'Resolved', assignee: 'Mike Johnson' },
            { id: 'TICK-004', client: 'StartUp Inc', issue: 'Network connectivity', priority: 'Critical', status: 'Escalated', assignee: 'Sarah Wilson' }
          ].map((ticket, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{ticket.id} - {ticket.issue}</div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.client} • Assigned to {ticket.assignee}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={
                      ticket.priority === 'Critical' ? 'destructive' :
                      ticket.priority === 'High' ? 'outline' :
                      ticket.priority === 'Medium' ? 'secondary' : 'secondary'
                    }>
                      {ticket.priority}
                    </Badge>
                    <Badge variant={ticket.status === 'Resolved' ? 'default' : 'outline'}>
                      {ticket.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Monitor className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h4 className="text-xl font-bold mb-2">SafeCenter: Unified MSP Platform</h4>
          <p className="text-muted-foreground mb-4">
            Complete integration between SafeDesk helpdesk and SafeRMM monitoring for seamless MSP operations
          </p>
          <Button size="lg">
            Deploy SafeCenter Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};