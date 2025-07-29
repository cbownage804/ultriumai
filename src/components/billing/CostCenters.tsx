import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building, 
  Plus, 
  Edit,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CostCenters = () => {
  // Mock data - would come from API
  const costCenters = [
    {
      id: '1',
      code: 'IT-001',
      name: 'Information Technology',
      department: 'IT Department',
      manager: 'john.doe@company.com',
      budget: 50000,
      spent: 32500,
      budgetPeriod: 'annual',
      isActive: true,
      lastActivity: '2024-01-15'
    },
    {
      id: '2',
      code: 'HR-001',
      name: 'Human Resources',
      department: 'HR Department',
      manager: 'jane.smith@company.com',
      budget: 25000,
      spent: 18750,
      budgetPeriod: 'annual',
      isActive: true,
      lastActivity: '2024-01-12'
    },
    {
      id: '3',
      code: 'FIN-001',
      name: 'Finance Operations',
      department: 'Finance Department',
      manager: 'mike.wilson@company.com',
      budget: 35000,
      spent: 31200,
      budgetPeriod: 'annual',
      isActive: true,
      lastActivity: '2024-01-14'
    },
    {
      id: '4',
      code: 'MKT-001',
      name: 'Marketing Technology',
      department: 'Marketing Department',
      manager: 'sarah.jones@company.com',
      budget: 40000,
      spent: 42300,
      budgetPeriod: 'annual',
      isActive: true,
      lastActivity: '2024-01-13'
    }
  ];

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100) return { status: 'over', color: 'destructive' };
    if (percentage > 80) return { status: 'warning', color: 'warning' };
    return { status: 'good', color: 'default' };
  };

  const getBudgetIcon = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage > 100) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (percentage > 80) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Cost Centers</h2>
          <p className="text-muted-foreground">
            Track IT spending and budget allocation by department
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Cost Center
        </Button>
      </div>

      {/* Cost Center Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">8</div>
            <div className="text-sm text-muted-foreground">Active Cost Centers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">$150,000</div>
            <div className="text-sm text-muted-foreground">Total Budget</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">$124,750</div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">83%</div>
            <div className="text-sm text-muted-foreground">Budget Utilization</div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Cost Centers
          </CardTitle>
          <CardDescription>
            Monitor departmental IT spending and budget performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Cost Center</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.map((center) => {
                const budgetStatus = getBudgetStatus(center.spent, center.budget);
                const utilization = (center.spent / center.budget) * 100;
                
                return (
                  <TableRow key={center.id}>
                    <TableCell className="font-medium">{center.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{center.name}</div>
                        <div className="text-sm text-muted-foreground">{center.department}</div>
                      </div>
                    </TableCell>
                    <TableCell>{center.manager}</TableCell>
                    <TableCell className="font-medium">
                      ${center.budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${center.spent.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{utilization.toFixed(1)}%</span>
                          {getBudgetIcon(center.spent, center.budget)}
                        </div>
                        <Progress 
                          value={Math.min(utilization, 100)} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          budgetStatus.status === 'over' ? 'destructive' :
                          budgetStatus.status === 'warning' ? 'secondary' : 'default'
                        }
                      >
                        {budgetStatus.status === 'over' ? 'Over Budget' :
                         budgetStatus.status === 'warning' ? 'Near Limit' : 'On Track'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Cost Center
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View Usage Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Generate Report
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Budget History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};