import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Building2, 
  TrendingUp,
  Scan,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { useSafeWebData } from '@/hooks/useSafeWebData';
import { SafeWebAssetManager } from './SafeWebAssetManager';
import { MSPClientManager } from './MSPClientManager';
import { ThreatAnalytics } from './ThreatAnalytics';
import BillingDashboard from './BillingDashboard';

export const SafeWebDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    assets, 
    threats, 
    mspClients, 
    loading, 
    totalThreats, 
    criticalThreats, 
    newThreats, 
    activeAssets 
  } = useSafeWebData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const severityColors = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SafeWeb Dashboard</h1>
          <p className="text-muted-foreground">Monitor your digital assets for dark web threats</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Active Protection
        </Badge>
      </div>

      {newThreats > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {newThreats} new threat{newThreats > 1 ? 's' : ''} that require attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="threats" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            MSP Clients
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAssets}</div>
                <p className="text-xs text-muted-foreground">
                  {assets.length} total assets monitored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Threats</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalThreats}</div>
                <p className="text-xs text-muted-foreground">
                  {newThreats} new this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{criticalThreats}</div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MSP Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mspClients.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active client accounts
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Threats</CardTitle>
                <CardDescription>Latest threats detected across all assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {threats.slice(0, 5).map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{threat.title}</p>
                      <p className="text-sm text-muted-foreground">{threat.description}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={severityColors[threat.severity as keyof typeof severityColors]}
                        >
                          {threat.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(threat.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {threats.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No threats detected. Your assets are secure.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Protection Status</CardTitle>
                <CardDescription>Overview of monitored assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assets.slice(0, 5).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{asset.asset_value}</p>
                      <p className="text-sm text-muted-foreground capitalize">{asset.asset_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                        {asset.status}
                      </Badge>
                      {asset.threats_found > 0 && (
                        <Badge variant="destructive">{asset.threats_found} threats</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {assets.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No assets configured. Add assets to start monitoring.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets">
          <SafeWebAssetManager />
        </TabsContent>

        <TabsContent value="threats">
          <ThreatAnalytics />
        </TabsContent>

        <TabsContent value="clients">
          <MSPClientManager />
        </TabsContent>

        <TabsContent value="billing">
          <BillingDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};