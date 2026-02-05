import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Plus, Eye, EyeOff, Copy, Trash2, Key, Lock, Shield, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { useDeviceAtlasPasswords, DevicePassword } from "@/hooks/useDeviceAtlasPasswords";
import { useNavigate } from "react-router-dom";

interface DevicePasswordsTabProps {
  agent: VanguardAgent;
  onAddPassword: () => void;
  onDeletePassword?: (id: string) => Promise<void>;
}

export function DevicePasswordsTab({ agent, onAddPassword, onDeletePassword }: DevicePasswordsTabProps) {
  const navigate = useNavigate();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Use Atlas passwords linked to this device
  const { passwords, isLoading, deletePassword: atlasDeletePassword } = useDeviceAtlasPasswords(
    agent.id,
    agent.client_id
  );

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
    await atlasDeletePassword(id);
  };

  const goToAtlas = () => {
    navigate('/atlas/passwords');
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Stored Passwords
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Credentials synced with Vanguard Atlas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={goToAtlas} 
            className="gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Atlas
          </Button>
          <Button 
            size="sm" 
            onClick={onAddPassword} 
            className="gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New password
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {passwords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Lock className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 mb-2">No passwords stored</p>
            <p className="text-xs text-slate-500 mb-4">
              Store device-related passwords securely
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddPassword} 
              className="gap-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
            >
              <Plus className="h-4 w-4" />
              Add password
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-cyan-300">
                All passwords are encrypted and stored securely. Click the eye icon to reveal.
              </span>
            </div>
            
            <div className="rounded-lg border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Username</TableHead>
                    <TableHead className="text-slate-400">Password</TableHead>
                    <TableHead className="text-slate-400">Notes</TableHead>
                    <TableHead className="text-slate-400 w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {passwords.map((pwd: DevicePassword) => (
                    <TableRow key={pwd.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-cyan-500/20">
                            <Key className="h-3 w-3 text-cyan-400" />
                          </div>
                          <span className="font-medium text-slate-200">{pwd.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 font-mono text-sm">
                        {pwd.username || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-300 min-w-[100px]">
                            {visiblePasswords.has(pwd.id) ? (pwd.password_encrypted || '') : "••••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
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
                            className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                            onClick={() => copyPassword(pwd.password_encrypted || '')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm max-w-[200px]">
                        <span className="line-clamp-1">{pwd.notes || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-red-500/20 hover:text-red-400"
                          onClick={() => handleDelete(pwd.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
