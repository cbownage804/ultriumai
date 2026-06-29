import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, Scan, UserCheck, Clock, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import { useVaultSecurity } from '@/hooks/useVaultSecurity';

const SecurityDashboard = () => {
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');
  const [emergencyReason, setEmergencyReason] = useState('');
  const [selectedEmergencyAccess, setSelectedEmergencyAccess] = useState<string | null>(null);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const {
    alerts,
    securityScore,
    emergencyAccess,
    isLoading,
    runSecurityScan,
    setupEmergencyAccess,
    requestEmergencyAccess,
    resolveAlert
  } = useVaultSecurity();

  const handleSetupEmergencyAccess = async () => {
    if (!emergencyContactEmail.trim()) return;
    
    const success = await setupEmergencyAccess(emergencyContactEmail);
    if (success) {
      setEmergencyContactEmail('');
      setShowEmergencyDialog(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!selectedEmergencyAccess || !emergencyReason.trim()) return;
    
    const success = await requestEmergencyAccess(selectedEmergencyAccess, emergencyReason);
    if (success) {
      setEmergencyReason('');
      setSelectedEmergencyAccess(null);
      setShowRequestDialog(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-muted-foreground';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getThreatLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-muted';
      case 'low': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'ignored': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading security dashboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Security Dashboard</h2>
        </div>
        <Button onClick={runSecurityScan} className="bg-gradient-primary hover:bg-gradient-primary/90 touch-target w-full sm:w-auto">
          <Scan className="h-4 w-4 mr-2" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-xl sm:text-2xl font-bold ${getScoreColor(securityScore?.overall_score || 0)}`}>
                  {securityScore?.overall_score || 0}%
                </p>
              </div>
              <Shield className={`h-6 w-6 sm:h-8 sm:w-8 ${getScoreColor(securityScore?.overall_score || 0)}`} />
            </div>
            <Progress 
              value={securityScore?.overall_score || 0} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive">
                  {alerts.filter(a => a.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Weak Passwords</p>
                <p className="text-xl sm:text-2xl font-bold text-warning">
                  {securityScore?.weak_passwords || 0}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Breached</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive">
                  {securityScore?.breached_passwords || 0}
                </p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="w-full flex overflow-x-auto touch-pan-x scrollbar-hide">
          <TabsTrigger value="alerts" className="flex-1 min-w-[80px] touch-target text-xs sm:text-sm">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations" className="flex-1 min-w-[80px] touch-target text-xs sm:text-sm">Tips</TabsTrigger>
          <TabsTrigger value="emergency" className="flex-1 min-w-[80px] touch-target text-xs sm:text-sm">Emergency</TabsTrigger>
          <TabsTrigger value="monitoring" className="flex-1 min-w-[80px] touch-target text-xs sm:text-sm">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No security alerts. Your passwords are secure!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Threat Level</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{getStatusIcon(alert.status)}</TableCell>
                        <TableCell className="font-medium">
                          {alert.monitoring_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableCell>
                        <TableCell>
                          <Badge className={getThreatLevelBadge(alert.threat_level)}>
                            {alert.threat_level}
                          </Badge>
                        </TableCell>
                        <TableCell>{alert.entry_title || 'N/A'}</TableCell>
                        <TableCell>{new Date(alert.detected_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {alert.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {securityScore?.recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                  <p>Great job! No security recommendations at this time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityScore?.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{recommendation}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Take action to improve your security score
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Fix Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emergency Access</CardTitle>
                <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Setup Emergency Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Setup Emergency Access</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="emergency-email">Emergency Contact Email</Label>
                        <Input
                          id="emergency-email"
                          type="email"
                          value={emergencyContactEmail}
                          onChange={(e) => setEmergencyContactEmail(e.target.value)}
                          placeholder="Enter trusted contact's email"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          This person will be able to request access to your passwords in emergencies
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => setShowEmergencyDialog(false)} variant="outline" className="flex-1">
                          Cancel
                        </Button>
                        <Button onClick={handleSetupEmergencyAccess} className="flex-1 bg-gradient-primary">
                          Setup Access
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {emergencyAccess.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No emergency access configured. Set up trusted contacts for emergencies.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Access Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wait Period</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emergencyAccess.map((access) => (
                      <TableRow key={access.id}>
                        <TableCell>{access.contact_email}</TableCell>
                        <TableCell>{access.access_type === 'all_vaults' ? 'All Vaults' : access.vault_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{access.status}</Badge>
                        </TableCell>
                        <TableCell>{access.wait_period_hours} hours</TableCell>
                        <TableCell>
                          {access.status === 'active' && (
                            <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedEmergencyAccess(access.id)}
                                >
                                  Request Access
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Request Emergency Access</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="emergency-reason">Reason for Access</Label>
                                    <Input
                                      id="emergency-reason"
                                      value={emergencyReason}
                                      onChange={(e) => setEmergencyReason(e.target.value)}
                                      placeholder="Explain why you need emergency access"
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button onClick={() => setShowRequestDialog(false)} variant="outline" className="flex-1">
                                      Cancel
                                    </Button>
                                    <Button onClick={handleRequestAccess} className="flex-1 bg-gradient-primary">
                                      Request Access
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Security Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Scan className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Dark Web Monitoring</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Continuously monitors the dark web for compromised passwords
                  </p>
                  <Badge className="bg-success">Active</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Breach Detection</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alerts you when your passwords are found in data breaches
                  </p>
                  <Badge className="bg-success">Active</Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Password Aging</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Reminds you to update old passwords regularly
                  </p>
                  <Badge className="bg-success">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;