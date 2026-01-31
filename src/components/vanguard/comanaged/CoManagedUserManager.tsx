import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Plus, 
  Upload, 
  MoreVertical, 
  Star,
  Mail,
  Shield,
  UserX
} from "lucide-react";
import { toast } from "sonner";

interface CoManagedUserManagerProps {
  organizationId: string;
}

interface EndUser {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  is_vip: boolean;
  portal_access_enabled: boolean;
  last_login_at: string | null;
  ticket_count: number;
}

export function CoManagedUserManager({ organizationId }: CoManagedUserManagerProps) {
  const [users] = useState<EndUser[]>([
    {
      id: "1",
      full_name: "Sarah Johnson",
      email: "sarah.johnson@acmecorp.com",
      job_title: "VP of Sales",
      department: "Sales",
      is_vip: true,
      portal_access_enabled: true,
      last_login_at: "2026-01-30T10:30:00Z",
      ticket_count: 8
    },
    {
      id: "2",
      full_name: "Michael Chen",
      email: "m.chen@acmecorp.com",
      job_title: "Software Developer",
      department: "Engineering",
      is_vip: false,
      portal_access_enabled: true,
      last_login_at: "2026-01-29T15:45:00Z",
      ticket_count: 3
    },
    {
      id: "3",
      full_name: "Emily Rodriguez",
      email: "e.rodriguez@acmecorp.com",
      job_title: "HR Manager",
      department: "Human Resources",
      is_vip: false,
      portal_access_enabled: true,
      last_login_at: null,
      ticket_count: 0
    },
    {
      id: "4",
      full_name: "James Wilson",
      email: "j.wilson@acmecorp.com",
      job_title: "CEO",
      department: "Executive",
      is_vip: true,
      portal_access_enabled: true,
      last_login_at: "2026-01-28T09:00:00Z",
      ticket_count: 2
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatLastLogin = (date: string | null) => {
    if (!date) return "Never";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-black/40 border-cyan-500/30 text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* User Table */}
      <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-cyan-500/20 hover:bg-transparent">
              <TableHead className="text-white/60">User</TableHead>
              <TableHead className="text-white/60">Department</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-white/60">Last Login</TableHead>
              <TableHead className="text-white/60">Tickets</TableHead>
              <TableHead className="text-white/60 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-cyan-500/20 hover:bg-cyan-500/5">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-medium">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-white font-medium flex items-center gap-2">
                        {user.full_name}
                        {user.is_vip && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        )}
                      </p>
                      <p className="text-xs text-white/40">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-white text-sm">{user.department}</p>
                    <p className="text-xs text-white/40">{user.job_title}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={user.portal_access_enabled 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-red-500/20 text-red-400"
                  }>
                    {user.portal_access_enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-white/60 text-sm">
                    {formatLastLogin(user.last_login_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-white text-sm">{user.ticket_count}</span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Portal Invite
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10">
                        <Star className="h-4 w-4 mr-2" />
                        {user.is_vip ? 'Remove VIP' : 'Mark as VIP'}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-cyan-500/10">
                        <Shield className="h-4 w-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:bg-red-500/10">
                        <UserX className="h-4 w-4 mr-2" />
                        Disable Access
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-white/40 text-center">
        Showing {filteredUsers.length} of {users.length} users
      </p>
    </div>
  );
}
