import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar, 
  Plus, 
  Play, 
  Pause, 
  Edit,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const BillingSchedules = () => {
  // Mock data - would come from API
  const schedules = [
    {
      id: '1',
      name: 'Acme Corp - Monthly IT Support',
      client: 'Acme Corp',
      scheduleType: 'monthly',
      amount: 2400,
      nextBilling: '2024-02-01',
      lastBilled: '2024-01-01',
      isActive: true,
      autoInvoice: true
    },
    {
      id: '2',
      name: 'TechStart Inc - Security Monitoring',
      client: 'TechStart Inc',
      scheduleType: 'monthly',
      amount: 1800,
      nextBilling: '2024-02-01',
      lastBilled: '2024-01-01',
      isActive: true,
      autoInvoice: true
    },
    {
      id: '3',
      name: 'Global Systems - Quarterly Maintenance',
      client: 'Global Systems',
      scheduleType: 'quarterly',
      amount: 9600,
      nextBilling: '2024-04-01',
      lastBilled: '2024-01-01',
      isActive: true,
      autoInvoice: false
    },
    {
      id: '4',
      name: 'IT Department - Monthly Usage',
      client: 'Internal IT',
      scheduleType: 'usage_based',
      amount: 0,
      nextBilling: '2024-02-01',
      lastBilled: '2024-01-01',
      isActive: false,
      autoInvoice: true
    }
  ];

  const getScheduleTypeBadge = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      monthly: 'default',
      quarterly: 'secondary',
      annual: 'destructive',
      usage_based: 'outline'
    };
    return variants[type] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Billing Schedules</h2>
          <p className="text-muted-foreground">
            Automate recurring billing for all customer segments
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Schedule Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Active Schedules</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">$45,600</div>
            <div className="text-sm text-muted-foreground">Monthly Recurring</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">8</div>
            <div className="text-sm text-muted-foreground">Due This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-muted-foreground">Manual Review</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing Schedules
          </CardTitle>
          <CardDescription>
            Manage automated billing for clients and internal cost centers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schedule Name</TableHead>
                <TableHead>Client/Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Last Billed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{schedule.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {schedule.autoInvoice && (
                          <Badge variant="outline" className="text-xs">
                            Auto Invoice
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{schedule.client}</TableCell>
                  <TableCell>
                    <Badge variant={getScheduleTypeBadge(schedule.scheduleType)}>
                      {schedule.scheduleType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {schedule.scheduleType === 'usage_based' 
                      ? 'Variable' 
                      : `$${schedule.amount.toLocaleString()}`
                    }
                  </TableCell>
                  <TableCell>{schedule.nextBilling}</TableCell>
                  <TableCell>{schedule.lastBilled}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                        {schedule.isActive ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Toggle active status */}}
                      >
                        {schedule.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Bill Now
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};