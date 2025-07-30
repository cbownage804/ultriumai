import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle,
  Users,
  Building,
  Smartphone,
  Globe,
  Settings,
  UserCheck
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

export const SafePassDemo = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('vault');
  const [showPassword, setShowPassword] = useState({});

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

  const togglePassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'text-success';
    if (strength >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getStrengthBg = (strength) => {
    if (strength >= 80) return 'bg-success';
    if (strength >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">🔐 SafePass Identity & Password Management</h3>
        <p className="text-muted-foreground">Enterprise-grade password security with breach monitoring</p>
        {user && profile && (
          <div className="mt-2 px-4 py-2 bg-primary/10 rounded-lg inline-block">
            <p className="text-sm text-primary">
              Welcome back, <strong>{profile.full_name || profile.email}</strong>
              {profile.company_name && ` from ${profile.company_name}`}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <Button 
          variant={activeTab === 'vault' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('vault')}
        >
          <Key className="h-4 w-4 mr-2" />
          Password Vault
        </Button>
        <Button 
          variant={activeTab === 'breach' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('breach')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Breach Monitor
        </Button>
        <Button 
          variant={activeTab === 'team' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('team')}
        >
          <Users className="h-4 w-4 mr-2" />
          Team Access
        </Button>
        <Button 
          variant={activeTab === 'teams' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('teams')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Teams
        </Button>
        <Button 
          variant={activeTab === 'security' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('security')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Security
        </Button>
        <Button 
          variant={activeTab === 'msp' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('msp')}
        >
          <Settings className="h-4 w-4 mr-2" />
          MSP Console
        </Button>
      </div>

      {activeTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Company Password Vault</h4>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Password
            </Button>
          </div>
          
          {passwords.map((item) => (
            <Card key={item.id} className={item.strength < 60 ? 'border-destructive/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">{item.site}</div>
                      <div className="text-sm text-muted-foreground">{item.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.shared && (
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                    <Badge variant={item.strength >= 80 ? 'default' : item.strength >= 60 ? 'outline' : 'destructive'}>
                      {item.strength}% strength
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    type={showPassword[item.id] ? 'text' : 'password'}
                    value={item.password}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => togglePassword(item.id)}
                  >
                    {showPassword[item.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={getStrengthColor(item.strength)}>
                      Password Strength: {item.strength}%
                    </span>
                  </div>
                  <span className="text-muted-foreground">Last used: {item.lastUsed}</span>
                </div>
                
                <Progress value={item.strength} className={`h-2 mt-2`} />
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

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h4 className="text-xl font-bold mb-2">Zero-Trust Password Security</h4>
          <p className="text-muted-foreground mb-4">
            Advanced encryption, breach monitoring, and seamless team collaboration
          </p>
          <Button size="lg">
            Deploy SafePass Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};