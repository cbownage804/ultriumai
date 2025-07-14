import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Target,
  Zap,
  Eye,
  Clock,
  Users,
  Globe
} from 'lucide-react';

export const SafeShieldDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const threats = [
    { name: 'Ransomware Attempt', severity: 'critical', status: 'blocked', time: '2 min ago' },
    { name: 'Phishing Email', severity: 'high', status: 'quarantined', time: '5 min ago' },
    { name: 'Suspicious Process', severity: 'medium', status: 'investigating', time: '12 min ago' },
    { name: 'Malware Download', severity: 'critical', status: 'blocked', time: '18 min ago' }
  ];

  const endpoints = [
    { name: 'CEO-LAPTOP-01', status: 'protected', score: 98, threats: 0 },
    { name: 'HR-DESKTOP-03', status: 'protected', score: 95, threats: 1 },
    { name: 'SALES-LAPTOP-07', status: 'warning', score: 82, threats: 3 },
    { name: 'IT-SERVER-01', status: 'protected', score: 99, threats: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">🛡️ SafeShield Complete Security Platform</h3>
        <p className="text-muted-foreground">AI-powered unified security that stops threats before they happen</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 mb-6">
        <Button 
          variant={activeTab === 'dashboard' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('dashboard')}
        >
          Security Dashboard
        </Button>
        <Button 
          variant={activeTab === 'threats' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('threats')}
        >
          Threat Detection
        </Button>
        <Button 
          variant={activeTab === 'endpoints' ? 'default' : 'outline'} 
          onClick={() => setActiveTab('endpoints')}
        >
          Endpoint Protection
        </Button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold text-success">99.8%</div>
              <div className="text-sm text-muted-foreground">Protection Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-primary">247</div>
              <div className="text-sm text-muted-foreground">Threats Blocked</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-info" />
              <div className="text-2xl font-bold text-info">24/7</div>
              <div className="text-sm text-muted-foreground">Monitoring</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-warning" />
              <div className="text-2xl font-bold text-warning">156</div>
              <div className="text-sm text-muted-foreground">Protected Devices</div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'threats' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Real-Time Threat Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threats.map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      threat.severity === 'critical' ? 'bg-destructive' :
                      threat.severity === 'high' ? 'bg-warning' : 'bg-info'
                    }`} />
                    <div>
                      <div className="font-medium">{threat.name}</div>
                      <div className="text-sm text-muted-foreground">{threat.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={threat.status === 'blocked' ? 'default' : 'secondary'}>
                      {threat.status}
                    </Badge>
                    {threat.status === 'blocked' && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'endpoints' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Endpoint Security Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{endpoint.name}</div>
                    <Badge variant={endpoint.status === 'protected' ? 'default' : 'secondary'}>
                      {endpoint.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Security Score</span>
                        <span>{endpoint.score}%</span>
                      </div>
                      <Progress value={endpoint.score} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {endpoint.threats} threats detected
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h4 className="text-xl font-bold mb-2">AI-Powered Threat Prevention</h4>
          <p className="text-muted-foreground mb-4">
            Advanced behavioral analysis and machine learning detect threats 10x faster than traditional solutions
          </p>
          <Button size="lg">
            Deploy SafeShield Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};