import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart3, 
  Plus, 
  Search,
  Filter,
  Download,
  Activity,
  HardDrive,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const UsageTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - would come from API
  const usageData = [
    {
      id: '1',
      client: 'Acme Corp',
      costCenter: null,
      usageType: 'api_calls',
      usageAmount: 15420,
      usageUnit: 'calls',
      billingRate: 0.02,
      trackingDate: '2024-01-15',
      totalCost: 308.40
    },
    {
      id: '2',
      client: 'TechStart Inc',
      costCenter: null,
      usageType: 'storage_gb',
      usageAmount: 2500,
      usageUnit: 'gb',
      billingRate: 0.15,
      trackingDate: '2024-01-15',
      totalCost: 375.00
    },
    {
      id: '3',
      client: null,
      costCenter: 'IT-001',
      usageType: 'support_hours',
      usageAmount: 45.5,
      usageUnit: 'hours',
      billingRate: 125.00,
      trackingDate: '2024-01-15',
      totalCost: 5687.50
    },
    {
      id: '4',
      client: 'Global Systems',
      costCenter: null,
      usageType: 'device_count',
      usageAmount: 350,
      usageUnit: 'devices',
      billingRate: 8.50,
      trackingDate: '2024-01-15',
      totalCost: 2975.00
    }
  ];

  const usageChartData = [
    { date: '2024-01-01', apiCalls: 12000, storage: 2200, supportHours: 35, devices: 320 },
    { date: '2024-01-05', apiCalls: 13500, storage: 2350, supportHours: 42, devices: 335 },
    { date: '2024-01-10', apiCalls: 14200, storage: 2400, supportHours: 38, devices: 340 },
    { date: '2024-01-15', apiCalls: 15420, storage: 2500, supportHours: 45, devices: 350 }
  ];

  const getUsageIcon = (type: string) => {
    const icons = {
      api_calls: <Activity className="h-4 w-4" />,
      storage_gb: <HardDrive className="h-4 w-4" />,
      support_hours: <Clock className="h-4 w-4" />,
      device_count: <Zap className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <BarChart3 className="h-4 w-4" />;
  };

  const getUsageTypeLabel = (type: string) => {
    const labels = {
      api_calls: 'API Calls',
      storage_gb: 'Storage (GB)',
      support_hours: 'Support Hours',
      device_count: 'Device Count'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getUsageTypeBadge = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      api_calls: 'default',
      storage_gb: 'secondary',
      support_hours: 'destructive',
      device_count: 'outline'
    };
    return variants[type] || 'secondary';
  };

  const filteredUsage = usageData.filter(usage =>
    (usage.client && usage.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (usage.costCenter && usage.costCenter.toLowerCase().includes(searchTerm.toLowerCase())) ||
    usage.usageType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search usage records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Record Usage
          </Button>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">15.4K</div>
                <div className="text-sm text-muted-foreground">API Calls Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">2.5TB</div>
                <div className="text-sm text-muted-foreground">Storage Used</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">45.5</div>
                <div className="text-sm text-muted-foreground">Support Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">350</div>
                <div className="text-sm text-muted-foreground">Devices Managed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
          <CardDescription>Track usage patterns over time for billing purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="apiCalls" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="storage" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="supportHours" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="devices" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Tracking
          </CardTitle>
          <CardDescription>
            Monitor usage-based billing for all clients and cost centers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client/Cost Center</TableHead>
                <TableHead>Usage Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsage.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell className="font-medium">
                    {usage.client || usage.costCenter}
                    {usage.costCenter && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Cost Center
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getUsageIcon(usage.usageType)}
                      <Badge variant={getUsageTypeBadge(usage.usageType)}>
                        {getUsageTypeLabel(usage.usageType)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {usage.usageAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>{usage.usageUnit}</TableCell>
                  <TableCell>${usage.billingRate.toFixed(2)}</TableCell>
                  <TableCell className="font-bold">
                    ${usage.totalCost.toFixed(2)}
                  </TableCell>
                  <TableCell>{usage.trackingDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};