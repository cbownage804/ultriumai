import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Play,
  Square,
  Trash2,
  Search,
  MoreVertical,
  RefreshCw,
  Loader2,
  Plus,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduledTask {
  name: string;
  path: string;
  status: 'ready' | 'running' | 'disabled';
  lastRun: string;
  nextRun: string;
  triggers: string;
  actions: string;
}

interface ScheduledTasksManagerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function ScheduledTasksManager({ agentId, sendCommand }: ScheduledTasksManagerProps) {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    command: '',
    schedule: 'daily',
    time: '09:00',
  });

  useEffect(() => {
    loadTasks();
  }, [agentId]);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_scheduled_tasks');
      if (result?.tasks) {
        setTasks(result.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      toast.error('Failed to load scheduled tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskAction = async (taskName: string, action: 'run' | 'enable' | 'disable' | 'delete') => {
    setActionInProgress(`${taskName}-${action}`);
    try {
      await sendCommand('scheduled_task_action', { task_name: taskName, action });
      toast.success(`Task ${action} command sent`);
      setTimeout(() => loadTasks(), 2000);
    } catch (err) {
      toast.error(`Failed to ${action} task`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCreateTask = async () => {
    try {
      await sendCommand('create_scheduled_task', newTask);
      toast.success('Task creation command sent');
      setShowCreateDialog(false);
      setNewTask({ name: '', command: '', schedule: 'daily', time: '09:00' });
      setTimeout(() => loadTasks(), 2000);
    } catch (err) {
      toast.error('Failed to create task');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500">Ready</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'disabled':
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Tasks
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <Button variant="outline" size="sm" onClick={loadTasks} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled tasks found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.path + task.name}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{task.path}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="text-sm">{task.lastRun || 'Never'}</TableCell>
                      <TableCell className="text-sm">{task.nextRun || 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {actionInProgress?.startsWith(task.name) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTaskAction(task.name, 'run')}>
                              <Play className="h-4 w-4 mr-2" />
                              Run Now
                            </DropdownMenuItem>
                            {task.status === 'disabled' ? (
                              <DropdownMenuItem onClick={() => handleTaskAction(task.name, 'enable')}>
                                <Play className="h-4 w-4 mr-2" />
                                Enable
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleTaskAction(task.name, 'disable')}>
                                <Square className="h-4 w-4 mr-2" />
                                Disable
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleTaskAction(task.name, 'delete')}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scheduled Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input 
                value={newTask.name}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Scheduled Task"
              />
            </div>
            <div className="space-y-2">
              <Label>Command / Script</Label>
              <Textarea 
                value={newTask.command}
                onChange={(e) => setNewTask(prev => ({ ...prev, command: e.target.value }))}
                placeholder="powershell.exe -File C:\scripts\backup.ps1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select 
                  value={newTask.schedule}
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, schedule: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="startup">At Startup</SelectItem>
                    <SelectItem value="logon">At Logon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input 
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={!newTask.name || !newTask.command}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
