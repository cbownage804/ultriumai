import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import TeamManagement from '@/components/safepass/TeamManagement';
import SecurityDashboard from '@/components/safepass/SecurityDashboard';
import MSPConsole from '@/components/safepass/MSPConsole';
import { 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Copy, 
  Plus,
  AlertTriangle,
  Users,
  Building,
  Smartphone,
  Globe,
  Settings,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import safepassLogo from '@/assets/safepass-logo.png';

export const VaultDemo = () => {
  const [activeTab, setActiveTab] = useState('vault');
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const passwords = [
    { 
      id: 1, 
      site: 'Microsoft 365', 
      username: 'admin@company.com', 
      password: 'Secure123!@#$%', 
      strength: 92, 
      shared: true,
      lastUsed: '2 hours ago'
    },
    { 
      id: 2, 
      site: 'AWS Console', 
      username: 'root', 
      password: 'Aws#Complex789$', 
      strength: 98, 
      shared: false,
      lastUsed: '1 day ago'
    },
    { 
      id: 3, 
      site: 'Company Database', 
      username: 'db_admin', 
      password: 'Simple123', 
      strength: 45, 
      shared: true,
      lastUsed: '5 min ago'
    },
    { 
      id: 4, 
      site: 'Salesforce', 
      username: 'sales@company.com', 
      password: 'StrongPass2024!', 
      strength: 95, 
      shared: true,
      lastUsed: '30 min ago'
    }
  ];

  const breaches = [
    { site: 'LinkedInBreach2021', accounts: 700000000, date: '2021-06-01', status: 'affected' },
    { site: 'Facebook2019', accounts: 533000000, date: '2019-04-01', status: 'clear' },
    { site: 'Twitter2022', accounts: 5400000, date: '2022-08-01', status: 'monitoring' }
  ];

  const togglePassword = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-emerald-500';
    if (strength >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const tabs = [
    { id: 'vault', label: 'Password Vault', icon: Key },
    { id: 'breach', label: 'Breach Monitor', icon: Shield },
    { id: 'team', label: 'Team Access', icon: Users },
    { id: 'teams', label: 'Teams', icon: UserCheck },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'msp', label: 'MSP Console', icon: Settings },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Vault branding - centered logo only */}
      <div className="flex justify-center mb-4">
        <img src={safepassLogo} alt="Vault" className="h-28 w-auto" />
      </div>

      {/* Navigation Tabs - styled like real app */}
      <ScrollArea className="w-full">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button 
                key={tab.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-shrink-0 gap-2 transition-all",
                  activeTab === tab.id 
                    ? "bg-amber-500 text-white hover:bg-amber-600 hover:text-white" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {activeTab === 'vault' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-base font-semibold">Company Password Vault</h4>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>
          
          {passwords.map((item) => (
            <Card key={item.id} className={cn(
              "bg-card/50 border-border/50",
              item.strength < 60 && "border-red-500/50"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium">{item.site}</div>
                      <div className="text-sm text-muted-foreground">{item.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.shared && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    <Badge className={cn(
                      "text-xs",
                      item.strength >= 80 
                        ? "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30" 
                        : item.strength >= 60 
                          ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                          : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                    )}>
                      {item.strength}% strength
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    type={showPassword[item.id] ? 'text' : 'password'}
                    value={item.password}
                    readOnly
                    className="flex-1 bg-background/50 border-border/50"
                  />
                  <Button 
                    size="icon" 
                    variant="outline"
                    className="shrink-0"
                    onClick={() => togglePassword(item.id)}
                  >
                    {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="outline" className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className={getStrengthColor(item.strength)}>
                    Password Strength: {item.strength}%
                  </span>
                  <span className="text-muted-foreground text-xs">Last used: {item.lastUsed}</span>
                </div>
                
                <Progress 
                  value={item.strength} 
                  className={cn(
                    "h-1.5 mt-2",
                    item.strength >= 80 
                      ? "[&>div]:bg-emerald-500" 
                      : item.strength >= 60 
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-red-500"
                  )} 
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'breach' && (
        <div className="space-y-4">
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Security Breach Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We continuously monitor the dark web and breach databases for compromised credentials
              </p>
              
              <div className="space-y-3">
                {breaches.map((breach, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{breach.site}</div>
                      <div className="text-sm text-muted-foreground">
                        {breach.accounts.toLocaleString()} accounts • {new Date(breach.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={
                      breach.status === 'affected' ? 'destructive' :
                      breach.status === 'monitoring' ? 'outline' : 'default'
                    }>
                      {breach.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Access Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <Building className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Key className="h-8 w-8 mx-auto mb-2 text-info" />
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Shared Passwords</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-success" />
                  <div className="text-2xl font-bold">98%</div>
                  <div className="text-sm text-muted-foreground">MFA Enabled</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-warning" />
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">IT Administrators</div>
                      <div className="text-sm text-muted-foreground">5 members • Full access</div>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-info/10 rounded-full flex items-center justify-center">
                      <Building className="h-4 w-4 text-info" />
                    </div>
                    <div>
                      <div className="font-medium">Sales Team</div>
                      <div className="text-sm text-muted-foreground">12 members • Limited access</div>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <div className="font-medium">HR Department</div>
                      <div className="text-sm text-muted-foreground">7 members • Department access</div>
                    </div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-4">
          <TeamManagement />
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          <SecurityDashboard />
        </div>
      )}

      {activeTab === 'msp' && (
        <div className="space-y-4">
          <MSPConsole />
        </div>
      )}

      {/* CTA with amber branding */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={safepassLogo} alt="Vault" className="h-16 w-auto" />
          </div>
          <h4 className="text-lg font-bold mb-1">Zero-Trust Password Security</h4>
          <p className="text-muted-foreground text-sm mb-3">
            Advanced encryption, breach monitoring, and seamless team collaboration
          </p>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white">
            Deploy Vault Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};