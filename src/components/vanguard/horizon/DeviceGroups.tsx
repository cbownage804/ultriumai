import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folders,
  Plus,
  Search,
  MoreVertical,
  Tag,
  Monitor,
  Edit,
  Trash2,
  Play,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface DeviceGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  deviceCount: number;
  tags: string[];
  automationProfile?: string;
}

interface DeviceGroupsProps {
  agents: any[];
  onSelectGroup?: (groupId: string) => void;
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500'
];

export function DeviceGroups({ agents, onSelectGroup }: DeviceGroupsProps) {
  const [groups, setGroups] = useState<DeviceGroup[]>([
    { id: '1', name: 'Production Servers', description: 'Critical production infrastructure', color: 'bg-red-500', deviceCount: 12, tags: ['production', 'critical'] },
    { id: '2', name: 'Development', description: 'Development workstations', color: 'bg-blue-500', deviceCount: 8, tags: ['dev'] },
    { id: '3', name: 'Remote Workers', description: 'WFH laptops and devices', color: 'bg-green-500', deviceCount: 25, tags: ['remote', 'laptop'] },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DeviceGroup | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500',
    tags: '',
  });

  const handleCreateGroup = () => {
    const group: DeviceGroup = {
      id: crypto.randomUUID(),
      name: newGroup.name,
      description: newGroup.description,
      color: newGroup.color,
      deviceCount: 0,
      tags: newGroup.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setGroups([...groups, group]);
    setShowCreateDialog(false);
    setNewGroup({ name: '', description: '', color: 'bg-blue-500', tags: '' });
    toast.success('Device group created');
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
    toast.success('Group deleted');
  };

  const handleAssignDevices = () => {
    if (selectedGroup) {
      setGroups(groups.map(g => 
        g.id === selectedGroup.id 
          ? { ...g, deviceCount: selectedDevices.length }
          : g
      ));
      toast.success(`${selectedDevices.length} devices assigned to ${selectedGroup.name}`);
    }
    setShowAssignDialog(false);
    setSelectedDevices([]);
    setSelectedGroup(null);
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folders className="h-5 w-5" />
              Device Groups & Tags
            </CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onSelectGroup?.(group.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${group.color}`} />
                        <div>
                          <h4 className="font-medium">{group.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {group.description}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group);
                            setShowAssignDialog(true);
                          }}>
                            <Monitor className="h-4 w-4 mr-2" />
                            Assign Devices
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Play className="h-4 w-4 mr-2" />
                            Run Script
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Apply Policy
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Monitor className="h-4 w-4" />
                        {group.deviceCount} devices
                      </div>
                      <div className="flex gap-1">
                        {group.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {group.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{group.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Device Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Production Servers"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Group description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full ${color} ${newGroup.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    onClick={() => setNewGroup(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={newGroup.tags}
                onChange={(e) => setNewGroup(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="production, critical, servers"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!newGroup.name}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Devices Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Devices to {selectedGroup?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50"
                >
                  <Checkbox
                    checked={selectedDevices.includes(agent.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDevices([...selectedDevices, agent.id]);
                      } else {
                        setSelectedDevices(selectedDevices.filter(id => id !== agent.id));
                      }
                    }}
                  />
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{agent.device_name}</div>
                    <div className="text-sm text-muted-foreground">{agent.os_type}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button onClick={handleAssignDevices}>
              Assign {selectedDevices.length} Device{selectedDevices.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
