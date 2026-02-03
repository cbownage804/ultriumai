import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Ban,
  Shield,
  Network,
  Download,
  Trash2,
  Check,
  X
} from "lucide-react";
import { useXDRResponseActions, useApproveResponseAction } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const actionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  isolate: { label: "Isolate Device", icon: <Network className="h-4 w-4" /> },
  unisolate: { label: "Unisolate Device", icon: <Network className="h-4 w-4" /> },
  kill_process: { label: "Kill Process", icon: <Ban className="h-4 w-4" /> },
  quarantine_file: { label: "Quarantine File", icon: <Shield className="h-4 w-4" /> },
  delete_file: { label: "Delete File", icon: <Trash2 className="h-4 w-4" /> },
  block_ip: { label: "Block IP", icon: <Ban className="h-4 w-4" /> },
  block_domain: { label: "Block Domain", icon: <Ban className="h-4 w-4" /> },
  rollback: { label: "Rollback Files", icon: <Download className="h-4 w-4" /> },
  collect_forensics: { label: "Collect Forensics", icon: <Download className="h-4 w-4" /> },
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  executing: "bg-purple-500",
  completed: "bg-green-500",
  failed: "bg-destructive",
  rejected: "bg-muted",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  approved: <Check className="h-4 w-4" />,
  executing: <PlayCircle className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  rejected: <X className="h-4 w-4" />,
};

export function ResponseActionsPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: actions, isLoading } = useXDRResponseActions({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const approveAction = useApproveResponseAction();

  const stats = {
    total: actions?.length || 0,
    pending: actions?.filter(a => a.action_status === "pending").length || 0,
    completed: actions?.filter(a => a.action_status === "completed").length || 0,
    failed: actions?.filter(a => a.action_status === "failed").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Total Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="executing">Executing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Response Actions
            {actions && <Badge variant="secondary">{actions.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading actions...
              </div>
            ) : !actions?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <PlayCircle className="h-8 w-8 mb-2" />
                <p>No response actions</p>
                <p className="text-xs">Actions are created during threat response</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    className={`p-4 rounded-lg border bg-card ${
                      action.action_status === "pending" ? "border-yellow-500/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {actionTypeLabels[action.action_type]?.icon}
                          <span className="font-medium">
                            {actionTypeLabels[action.action_type]?.label || action.action_type}
                          </span>
                          <Badge className={statusColors[action.action_status]}>
                            <span className="flex items-center gap-1">
                              {statusIcons[action.action_status]}
                              {action.action_status}
                            </span>
                          </Badge>
                          {action.requires_approval && action.action_status === "pending" && (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                              Requires Approval
                            </Badge>
                          )}
                        </div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          <span>Initiated by: {action.initiated_by || "System"}</span>
                          {action.approved_by && (
                            <span className="ml-4">Approved by: {action.approved_by}</span>
                          )}
                        </div>

                        {action.error_message && (
                          <div className="mt-2 text-sm text-destructive">
                            Error: {action.error_message}
                          </div>
                        )}

                        {action.action_payload && (
                          <div className="mt-2">
                            <code className="text-xs font-mono bg-muted p-2 rounded block overflow-x-auto">
                              {JSON.stringify(action.action_payload, null, 2)}
                            </code>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                        </span>
                        {action.action_status === "pending" && action.requires_approval && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="gap-1"
                              onClick={() => approveAction.mutate(action.id)}
                            >
                              <Check className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1">
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
