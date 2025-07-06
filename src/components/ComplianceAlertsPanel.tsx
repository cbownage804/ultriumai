import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  framework: string | null;
  control_id: string | null;
  status: string;
  created_at: string;
  metadata: any;
}

interface ComplianceAlertsPanelProps {
  alerts: Alert[];
  onRefresh: () => void;
}

export const ComplianceAlertsPanel = ({ alerts, onRefresh }: ComplianceAlertsPanelProps) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolution, setResolution] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  const getSeverityBadge = (severity: string) => {
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge className={colors[severity as keyof typeof colors] || colors.low}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'acknowledged':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const handleResolveAlert = async () => {
    if (!selectedAlert || !resolution.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a resolution description",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this would call the API to resolve the alert
    console.log('Resolving alert:', selectedAlert.id, 'with resolution:', resolution);
    
    toast({
      title: "Alert Resolved",
      description: "The compliance alert has been marked as resolved"
    });
    
    setSelectedAlert(null);
    setResolution('');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Alerts</h2>
          <p className="text-muted-foreground">Monitor and resolve compliance issues</p>
        </div>
        <div className="flex space-x-2">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <Card key={alert.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(alert.status)}
                      <h3 className="font-medium">{alert.title}</h3>
                      {getSeverityBadge(alert.severity)}
                      {alert.framework && (
                        <Badge variant="outline">
                          {alert.framework.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Type: {alert.alert_type.replace('_', ' ')}</span>
                      {alert.control_id && <span>Control: {alert.control_id}</span>}
                      <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {alert.status === 'open' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            Resolve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Compliance Alert</DialogTitle>
                            <DialogDescription>
                              Provide details about how this alert was resolved
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">{alert.title}</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                {alert.description}
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="resolution">Resolution Details *</Label>
                              <Textarea
                                id="resolution"
                                placeholder="Describe how this issue was resolved..."
                                value={resolution}
                                onChange={(e) => setResolution(e.target.value)}
                                rows={4}
                              />
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedAlert(null);
                                  setResolution('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleResolveAlert}>
                                Mark as Resolved
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground text-center">
                {filterSeverity !== 'all' || filterStatus !== 'all' 
                  ? "No alerts match your current filters"
                  : "All compliance alerts have been resolved or no issues detected"
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};