import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Monitor, Search, Filter, Play, Users } from "lucide-react";

interface Agent {
  id: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'updating';
  type: 'server' | 'workstation';
  os: string;
  client: string;
  department?: string;
  lastSeen: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgents: string[];
  onSelectionChange: (agentIds: string[]) => void;
  onExecute: (agentIds: string[], scriptId: string) => void;
  scriptId?: string;
  trigger?: React.ReactNode;
}

export const AgentSelector = ({ 
  agents, 
  selectedAgents, 
  onSelectionChange, 
  onExecute, 
  scriptId,
  trigger 
}: AgentSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.ip.includes(searchTerm) ||
                         agent.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    const matchesClient = clientFilter === 'all' || agent.client === clientFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesClient;
  });

  const uniqueClients = [...new Set(agents.map(a => a.client))];
  const onlineAgents = filteredAgents.filter(a => a.status === 'online');
  const offlineAgents = filteredAgents.filter(a => a.status === 'offline');

  const handleSelectAll = () => {
    const allOnlineIds = onlineAgents.map(a => a.id);
    onSelectionChange(allOnlineIds);
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const handleAgentToggle = (agentId: string) => {
    const newSelection = selectedAgents.includes(agentId)
      ? selectedAgents.filter(id => id !== agentId)
      : [...selectedAgents, agentId];
    onSelectionChange(newSelection);
  };

  const handleExecute = () => {
    if (scriptId && selectedAgents.length > 0) {
      onExecute(selectedAgents, scriptId);
      setOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'updating': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="h-8">
            <Users className="h-4 w-4 mr-2" />
            Select Agents ({selectedAgents.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Select Target Agents
          </DialogTitle>
          <DialogDescription>
            Choose which agents to execute the script on. Only online agents can execute scripts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hostname, IP, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="updating">Updating</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="server">Servers</SelectItem>
                <SelectItem value="workstation">Workstations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {uniqueClients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedAgents.length} of {filteredAgents.length} agents selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAll}>
                  Select All Online ({onlineAgents.length})
                </Button>
                <Button size="sm" variant="outline" onClick={handleSelectNone}>
                  Select None
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Online ({onlineAgents.length})
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Offline ({offlineAgents.length})
              </div>
            </div>
          </div>

          {/* Agent List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg flex items-center justify-between hover:bg-muted/50 transition-colors ${
                    agent.status === 'offline' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => handleAgentToggle(agent.id)}
                      disabled={agent.status === 'offline'}
                    />
                    <div className="flex items-center gap-2">
                      {agent.type === 'server' ? (
                        <Server className="h-4 w-4 text-primary" />
                      ) : (
                        <Monitor className="h-4 w-4 text-blue-500" />
                      )}
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                    </div>
                    <div>
                      <div className="font-medium">{agent.hostname}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.ip} • {agent.os} • {agent.client}
                        {agent.department && ` • ${agent.department}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={agent.status === 'online' ? 'default' : 'secondary'}>
                      {agent.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {agent.lastSeen}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Execute Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExecute}
              disabled={selectedAgents.length === 0 || !scriptId}
              className="bg-gradient-to-r from-primary to-primary/90"
            >
              <Play className="h-4 w-4 mr-2" />
              Execute on {selectedAgents.length} Agent{selectedAgents.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};