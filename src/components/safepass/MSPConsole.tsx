import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, Shield, Settings, BarChart3, AlertTriangle, CheckCircle, Plus, Edit } from 'lucide-react';
import { useVaultMSP } from '@/hooks/useSafePassMSP';

const MSPConsole = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState({
    type: 'password_requirements',
    config: {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      max_age_days: 90
    }
  });
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const { vaults, entries, report, loading } = useVaultMSP();

  const handleCreatePolicy = async () => {
    // Implementation would go here
    setShowPolicyDialog(false);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-warning';
      case 'medium': return 'text-muted-foreground';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-muted';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading MSP console...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">MSP Management Console</h2>
        </div>
        <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Security Policy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="policy-type">Policy Type</Label>
                <Select value={policyData.type} onValueChange={(value) => setPolicyData({ ...policyData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password_requirements">Password Requirements</SelectItem>
                    <SelectItem value="sharing_restrictions">Sharing Restrictions</SelectItem>
                    <SelectItem value="audit_settings">Audit Settings</SelectItem>
                    <SelectItem value="backup_settings">Backup Settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {policyData.type === 'password_requirements' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-length">Minimum Length</Label>
                    <Input
                      id="min-length"
                      type="number"
                      min="8"
                      max="64"
                      value={policyData.config.min_length}
                      onChange={(e) => setPolicyData({
                        ...policyData,
                        config: { ...policyData.config, min_length: parseInt(e.target.value) || 12 }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-age">Max Age (days)</Label>
                    <Input
                      id="max-age"
                      type="number"
                      min="30"
                      max="365"
                      value={policyData.config.max_age_days}
                      onChange={(e) => setPolicyData({
                        ...policyData,
                        config: { ...policyData.config, max_age_days: parseInt(e.target.value) || 90 }
                      })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Character Requirements</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={policyData.config.require_uppercase}
                          onChange={(e) => setPolicyData({
                            ...policyData,
                            config: { ...policyData.config, require_uppercase: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Uppercase letters</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={policyData.config.require_lowercase}
                          onChange={(e) => setPolicyData({
                            ...policyData,
                            config: { ...policyData.config, require_lowercase: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Lowercase letters</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={policyData.config.require_numbers}
                          onChange={(e) => setPolicyData({
                            ...policyData,
                            config: { ...policyData.config, require_numbers: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Numbers</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={policyData.config.require_symbols}
                          onChange={(e) => setPolicyData({
                            ...policyData,
                            config: { ...policyData.config, require_symbols: e.target.checked }
                          })}
                        />
                        <span className="text-sm">Special characters</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={() => setShowPolicyDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreatePolicy} className="flex-1 bg-gradient-primary">
                  Create Policy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{vaults?.length || 0}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{entries?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${getSecurityScoreColor(85)}`}>
                  85%
                </p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <Progress value={85} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">
                  3
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weak Passwords</span>
                    <span className="text-sm font-bold text-warning">0</span>
                  </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Reused Passwords</span>
                     <span className="text-sm font-bold text-warning">0</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Breached Passwords</span>
                     <span className="text-sm font-bold text-destructive">0</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Compliant Clients</span>
                     <span className="text-sm font-bold text-success">0</span>
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Policy compliance check completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Weak password detected for Client ABC</p>
                      <p className="text-xs text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New user onboarded</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              {vaults?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No clients found. Start by onboarding your first client!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Vaults</TableHead>
                      <TableHead>Security Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vaults?.map((vault) => (
                      <TableRow key={vault.id}>
                        <TableCell className="font-medium">{vault.client_name || 'Unknown Client'}</TableCell>
                         <TableCell>0</TableCell>
                         <TableCell>1</TableCell>
                        <TableCell>
                          <span className={getSecurityScoreColor(vault.security_score || 0)}>
                            {vault.security_score || 0}%
                          </span>
                        </TableCell>
                         <TableCell>
                           <Badge className="bg-success">
                             active
                           </Badge>
                         </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Policy management interface coming soon...</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Security Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Compliance Report</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Overall security compliance across all clients
                  </p>
                  <Button size="sm" variant="outline">Generate Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Detailed risk analysis and recommendations
                  </p>
                  <Button size="sm" variant="outline">Generate Report</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Audit Trail</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete audit log of all password activities
                  </p>
                  <Button size="sm" variant="outline">View Audit</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Usage Analytics</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    User adoption and feature usage statistics
                  </p>
                  <Button size="sm" variant="outline">View Analytics</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>MSP Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>MSP configuration settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPConsole;