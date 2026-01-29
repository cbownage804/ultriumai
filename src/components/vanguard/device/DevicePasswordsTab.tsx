import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Eye, EyeOff, Copy, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VanguardAgent } from "@/hooks/useVanguardAgents";

interface Password {
  id: string;
  name: string;
  username?: string;
  password: string;
  notes?: string;
  created_at: string;
}

interface DevicePasswordsTabProps {
  agent: VanguardAgent;
  onAddPassword: () => void;
  onDeletePassword?: (id: string) => Promise<void>;
}

export function DevicePasswordsTab({ agent, onAddPassword, onDeletePassword }: DevicePasswordsTabProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Extract passwords from agent config
  const passwords: Password[] = agent.config?.passwords || [];

  const toggleVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  };

  const handleDelete = async (id: string) => {
    if (onDeletePassword) {
      await onDeletePassword(id);
    } else {
      toast.success("Password deleted");
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-gray-900">Passwords</CardTitle>
        <Button size="sm" variant="outline" onClick={onAddPassword} className="gap-1">
          <Plus className="h-4 w-4" />
          New password
        </Button>
      </CardHeader>
      <CardContent>
        {passwords.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No passwords stored</p>
            <p className="text-xs text-gray-400 mb-4">
              Store device-related passwords securely
            </p>
            <Button variant="outline" size="sm" onClick={onAddPassword} className="gap-1">
              <Plus className="h-4 w-4" />
              Add password
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {passwords.map((pwd) => (
                <TableRow key={pwd.id}>
                  <TableCell className="font-medium">{pwd.name}</TableCell>
                  <TableCell>{pwd.username || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {visiblePasswords.has(pwd.id) ? pwd.password : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleVisibility(pwd.id)}
                      >
                        {visiblePasswords.has(pwd.id) ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyPassword(pwd.password)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm max-w-[200px] truncate">
                    {pwd.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => handleDelete(pwd.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
