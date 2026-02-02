import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Users, Search, AlertTriangle, Shield, UserCheck, UserX, Clock } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";

interface LocalUser {
  name: string;
  full_name?: string;
  description?: string;
  enabled: boolean;
  is_admin: boolean;
  is_local: boolean;
  last_logon?: string;
  password_last_set?: string;
  password_expires?: string;
  password_changeable?: boolean;
  user_may_change_password?: boolean;
  sid?: string;
  groups?: string[];
}

interface DeviceUsersTabProps {
  agent: VanguardAgent;
}

export function DeviceUsersTab({ agent }: DeviceUsersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get local users from agent config
  const localUsers: LocalUser[] = useMemo(() => {
    return (agent.config as any)?.local_users || [];
  }, [agent.config]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return localUsers;
    const query = searchQuery.toLowerCase();
    return localUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query) ||
        u.description?.toLowerCase().includes(query)
    );
  }, [localUsers, searchQuery]);

  const adminCount = localUsers.filter(u => u.is_admin).length;
  const enabledCount = localUsers.filter(u => u.enabled).length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const lastCheck = (agent.config as any)?.last_users_check;

  if (localUsers.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Local Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No user data available</p>
            <p className="text-xs text-slate-500">
              Local users will be collected during next agent telemetry sync
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Local Users
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {enabledCount} active
            </Badge>
            {adminCount > 0 && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {adminCount} admins
              </Badge>
            )}
          </CardTitle>
          {lastCheck && (
            <span className="text-xs text-slate-500">
              Last sync: {new Date(lastCheck).toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-cyan-400">User</TableHead>
                <TableHead className="text-cyan-400">Status</TableHead>
                <TableHead className="text-cyan-400">Role</TableHead>
                <TableHead className="text-cyan-400">Last Logon</TableHead>
                <TableHead className="text-cyan-400">Password Set</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user, i) => (
                <TableRow key={`${user.name}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_admin ? (
                        <Shield className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Users className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <div className="font-medium text-slate-200">{user.name}</div>
                        {user.full_name && user.full_name !== user.name && (
                          <div className="text-xs text-slate-500">{user.full_name}</div>
                        )}
                        {user.description && (
                          <div className="text-xs text-slate-600">{user.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.enabled ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        <UserX className="h-3 w-3 mr-1" />
                        Disabled
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.is_admin && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          Admin
                        </Badge>
                      )}
                      {user.is_local && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Local
                        </Badge>
                      )}
                      {user.groups?.includes('Remote Desktop Users') && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          RDP
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(user.last_logon)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {formatDate(user.password_last_set)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No users matching "{searchQuery}"</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
