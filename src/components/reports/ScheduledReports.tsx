import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  Mail,
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Users,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ScheduledReports = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data from Supabase
  const [scheduledReports] = useState([
    {
      id: '1',
      name: 'Weekly Security Summary',
      template_name: 'Security Summary Report',
      schedule: 'Weekly on Monday at 9:00 AM',
      recipients: ['admin@company.com', 'security@company.com'],
      is_active: true,
      last_run: '2024-01-15T09:00:00Z',
      next_run: '2024-01-22T09:00:00Z',
      status: 'active'
    },
    {
      id: '2',
      name: 'Monthly Compliance Review',
      template_name: 'Compliance Assessment Report',
      schedule: 'Monthly on 1st at 8:00 AM',
      recipients: ['compliance@company.com', 'executive@company.com'],
      is_active: true,
      last_run: '2024-01-01T08:00:00Z',
      next_run: '2024-02-01T08:00:00Z',
      status: 'active'
    },
    {
      id: '3',
      name: 'Daily Performance Metrics',
      template_name: 'Performance Analytics Report',
      schedule: 'Daily at 6:00 AM',
      recipients: ['operations@company.com'],
      is_active: false,
      last_run: '2024-01-10T06:00:00Z',
      next_run: null,
      status: 'paused'
    },
    {
      id: '4',
      name: 'Quarterly Executive Report',
      template_name: 'Executive Dashboard Report',
      schedule: 'Quarterly on 1st at 10:00 AM',
      recipients: ['ceo@company.com', 'cto@company.com', 'board@company.com'],
      is_active: true,
      last_run: '2024-01-01T10:00:00Z',
      next_run: '2024-04-01T10:00:00Z',
      status: 'active'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = scheduledReports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.template_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSchedule = (reportId: string, isActive: boolean) => {
    toast({
      title: isActive ? "Schedule Activated" : "Schedule Paused",
      description: `Report schedule has been ${isActive ? 'activated' : 'paused'}`,
    });
  };

  const runNow = (reportId: string) => {
    toast({
      title: "Report Generation Started",
      description: "The scheduled report is being generated manually",
    });
  };

  const deleteSchedule = (reportId: string) => {
    toast({
      title: "Schedule Deleted",
      description: "The scheduled report has been removed",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scheduled Reports</h2>
          <p className="text-muted-foreground">Automate report generation and delivery</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Report
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search scheduled reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{report.name}</h4>
                      <p className="text-muted-foreground text-sm">{report.template_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                      <Switch
                        checked={report.is_active}
                        onCheckedChange={(checked) => toggleSchedule(report.id, checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {/* Schedule Info */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{report.schedule}</span>
                    </div>

                    {/* Recipients */}
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{report.recipients.length} recipient(s)</span>
                    </div>

                    {/* Next Run */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {report.next_run 
                          ? `Next: ${new Date(report.next_run).toLocaleDateString()}`
                          : 'Not scheduled'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Recipients List */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Recipients:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {report.recipients.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Last Run Info */}
                  {report.last_run && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Last run: {new Date(report.last_run).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runNow(report.id)}
                    disabled={!report.is_active}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Run Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteSchedule(report.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No scheduled reports found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search terms' : 'Schedule your first automated report to get started'}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};