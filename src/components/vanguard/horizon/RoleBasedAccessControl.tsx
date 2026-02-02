import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, Users, Plus, Edit2, Trash2, Key, Lock,
  Eye, EyeOff, Settings, Search, Copy, Check, Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRBAC } from '@/hooks/useHorizon';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface UserRole {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
  lastActive?: string;
}

export const RoleBasedAccessControl: React.FC = () => {
  const { toast } = useToast();
  const { roles: dbRoles, isLoading, createRole, updateRole, deleteRole, refetch } = useRBAC();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Map DB roles to UI format
  const roles = dbRoles.map(r => ({
    id: r.id,
    name: r.role_name,
    description: r.description || '',
    isSystem: r.is_system_role,
    userCount: 0, // Would come from a join
    permissions: (r.permissions || []).map((p, i) => ({
      id: `${r.id}-${i}`,
      name: p,
      description: '',
      category: 'General',
      enabled: true
    })) as Permission[],
    createdAt: r.created_at
  }));

  const selectedRole = roles.find(r => r.id === selectedRoleId) || null;

  type RoleUI = typeof roles[number];

  const [permissionCategories] = useState([
    {
      name: 'Device Management',
      permissions: [
        { id: 'device.view', name: 'View Devices', description: 'View device list and details', enabled: true },
        { id: 'device.manage', name: 'Manage Devices', description: 'Edit device settings and properties', enabled: true },
        { id: 'device.delete', name: 'Delete Devices', description: 'Remove devices from the system', enabled: false },
        { id: 'device.remote', name: 'Remote Access', description: 'Initiate remote sessions', enabled: true }
      ]
    },
    {
      name: 'Ticketing',
      permissions: [
        { id: 'ticket.view', name: 'View Tickets', description: 'View ticket list and details', enabled: true },
        { id: 'ticket.create', name: 'Create Tickets', description: 'Create new support tickets', enabled: true },
        { id: 'ticket.assign', name: 'Assign Tickets', description: 'Assign tickets to technicians', enabled: true },
        { id: 'ticket.close', name: 'Close Tickets', description: 'Close and resolve tickets', enabled: true }
      ]
    },
    {
      name: 'Security',
      permissions: [
        { id: 'security.view', name: 'View Security', description: 'View security dashboards', enabled: true },
        { id: 'security.hunt', name: 'Threat Hunting', description: 'Run threat hunts and IOC searches', enabled: false },
        { id: 'security.remediate', name: 'Remediation', description: 'Execute security remediations', enabled: false },
        { id: 'security.playbooks', name: 'Manage Playbooks', description: 'Create and edit IR playbooks', enabled: false }
      ]
    },
    {
      name: 'Administration',
      permissions: [
        { id: 'admin.users', name: 'Manage Users', description: 'Create and manage user accounts', enabled: false },
        { id: 'admin.roles', name: 'Manage Roles', description: 'Create and edit roles', enabled: false },
        { id: 'admin.tenants', name: 'Manage Tenants', description: 'Create and manage tenants', enabled: false },
        { id: 'admin.billing', name: 'Billing Access', description: 'View and manage billing', enabled: false }
      ]
    }
  ]);

  const [userRoles] = useState<UserRole[]>([
    { id: '1', userId: 'u1', userName: 'John Smith', email: 'john@company.com', role: 'Super Admin', lastActive: new Date().toISOString() },
    { id: '2', userId: 'u2', userName: 'Jane Doe', email: 'jane@acme.com', role: 'Tenant Admin', tenantId: '1', tenantName: 'Acme Corp', lastActive: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', userId: 'u3', userName: 'Bob Wilson', email: 'bob@company.com', role: 'Senior Technician', lastActive: new Date(Date.now() - 7200000).toISOString() },
    { id: '4', userId: 'u4', userName: 'Alice Brown', email: 'alice@techstart.com', role: 'Technician', tenantId: '2', tenantName: 'TechStart Inc' },
    { id: '5', userId: 'u5', userName: 'Charlie Davis', email: 'charlie@company.com', role: 'Security Analyst', lastActive: new Date(Date.now() - 86400000).toISOString() }
  ]);

  const handleCreateRoleSubmit = async () => {
    try {
      await createRole({ role_name: newRoleName, description: newRoleDescription });
      setShowCreateDialog(false);
      setNewRoleName('');
      setNewRoleDescription('');
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoleClick = async (role: RoleUI) => {
    if (role.isSystem) {
      toast({
        title: "Cannot Delete",
        description: "System roles cannot be deleted.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await deleteRole(role.id);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive"
      });
    }
  };

  const filteredRoles = roles.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role-Based Access Control
          </h2>
          <p className="text-muted-foreground">Granular permissions per technician role</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Define a custom role with specific permissions</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input placeholder="e.g., Help Desk Agent" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description of this role..." />
              </div>
              <div className="space-y-2">
                <Label>Base Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Start from existing role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Blank (No permissions)</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="senior">Senior Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateRoleSubmit} className="w-full">
                Create & Configure Permissions
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => !r.isSystem).length}</p>
              </div>
              <Edit2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{roles.reduce((acc, r) => acc + r.userCount, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Permission Categories</p>
                <p className="text-2xl font-bold">{permissionCategories.length}</p>
              </div>
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="assignments">User Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Role Definitions</CardTitle>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search roles..." 
                    className="pl-8 w-48"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {filteredRoles.map((role) => (
                    <div 
                      key={role.id} 
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${role.isSystem ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Shield className={`h-5 w-5 ${role.isSystem ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {role.name}
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRoleClick(role); }}
                            disabled={role.isSystem}
                          >
                            <Trash2 className={`h-4 w-4 ${role.isSystem ? 'text-muted-foreground' : 'text-destructive'}`} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {role.userCount} users
                        </span>
                        <span>Created: {role.createdAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Configuration</CardTitle>
              <CardDescription>Configure permissions for each role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select defaultValue="4">
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select role to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {permissionCategories.map((category) => (
                    <div key={category.name} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {category.name}
                      </h4>
                      <div className="space-y-3">
                        {category.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox checked={permission.enabled} />
                              <div>
                                <p className="text-sm font-medium">{permission.name}</p>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </div>
                            <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {permission.id}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button>Save Changes</Button>
                <Button variant="outline">Reset to Default</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>Manage which roles are assigned to users</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {userRoles.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-full">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.tenantName && (
                          <Badge variant="outline">{user.tenantName}</Badge>
                        )}
                        <Select defaultValue={user.role}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.name}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
