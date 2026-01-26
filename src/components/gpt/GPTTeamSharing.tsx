import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Share2,
  Link2,
  Copy,
  Check,
  Crown,
  Edit3,
  Eye,
  Trash2,
  Mail,
  Globe,
  Lock,
  Building,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  status: 'active' | 'pending';
}

interface GPTTeamSharingProps {
  gptId: string;
  gptName: string;
  isPublic?: boolean;
  shareUrl?: string;
  teamMembers?: TeamMember[];
  onVisibilityChange?: (isPublic: boolean) => void;
  onInvite?: (email: string, role: string) => void;
  onRemoveMember?: (memberId: string) => void;
  onRoleChange?: (memberId: string, role: string) => void;
  themeColor?: string;
}

const mockTeamMembers: TeamMember[] = [
  { 
    id: '1', 
    email: 'owner@company.com', 
    name: 'John Owner', 
    role: 'owner', 
    joinedAt: '2024-01-01', 
    status: 'active' 
  },
  { 
    id: '2', 
    email: 'editor@company.com', 
    name: 'Sarah Editor', 
    role: 'editor', 
    joinedAt: '2024-01-15', 
    status: 'active' 
  },
  { 
    id: '3', 
    email: 'viewer@company.com', 
    name: 'Mike Viewer', 
    role: 'viewer', 
    joinedAt: '2024-02-01', 
    status: 'active' 
  },
  { 
    id: '4', 
    email: 'pending@company.com', 
    name: 'Pending User', 
    role: 'viewer', 
    joinedAt: '2024-02-10', 
    status: 'pending' 
  },
];

const roleIcons = {
  owner: Crown,
  editor: Edit3,
  viewer: Eye,
};

const roleColors = {
  owner: 'text-yellow-500',
  editor: 'text-blue-500',
  viewer: 'text-gray-500',
};

export function GPTTeamSharing({
  gptId,
  gptName,
  isPublic = false,
  shareUrl = `https://app.example.com/gpt/${gptId}`,
  teamMembers = mockTeamMembers,
  onVisibilityChange,
  onInvite,
  onRemoveMember,
  onRoleChange,
  themeColor = "#3b82f6"
}: GPTTeamSharingProps) {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    
    onInvite?.(inviteEmail, inviteRole);
    toast({ 
      title: "Invitation sent", 
      description: `Invited ${inviteEmail} as ${inviteRole}` 
    });
    setInviteEmail("");
    setInviteDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {isPublic ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            Visibility
          </CardTitle>
          <CardDescription>
            Control who can access "{gptName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Make GPT Public</Label>
              <p className="text-xs text-muted-foreground">
                Anyone with the link can use this GPT
              </p>
            </div>
            <Switch 
              checked={isPublic} 
              onCheckedChange={onVisibilityChange}
            />
          </div>

          {isPublic && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <Label className="text-xs text-muted-foreground">Share Link</Label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="text-sm bg-muted"
                />
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}

          <Separator />

          <div className="grid grid-cols-3 gap-3">
            <Card className={cn("p-3 cursor-pointer border-2", !isPublic && "border-primary")}>
              <div className="text-center space-y-1">
                <Lock className="h-5 w-5 mx-auto" />
                <p className="text-xs font-medium">Private</p>
                <p className="text-[10px] text-muted-foreground">Only team members</p>
              </div>
            </Card>
            <Card className="p-3 cursor-pointer">
              <div className="text-center space-y-1">
                <Building className="h-5 w-5 mx-auto" />
                <p className="text-xs font-medium">Organization</p>
                <p className="text-[10px] text-muted-foreground">All org members</p>
              </div>
            </Card>
            <Card className={cn("p-3 cursor-pointer border-2", isPublic && "border-primary")}>
              <div className="text-center space-y-1">
                <Globe className="h-5 w-5 mx-auto" />
                <p className="text-xs font-medium">Public</p>
                <p className="text-[10px] text-muted-foreground">Anyone with link</p>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} with access
              </CardDescription>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" style={{ backgroundColor: themeColor }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to collaborate on "{gptName}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">
                          <div className="flex items-center gap-2">
                            <Edit3 className="h-4 w-4" />
                            Editor - Can edit and configure
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Viewer - Can only use the GPT
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInvite} className="w-full" style={{ backgroundColor: themeColor }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Members List */}
          <ScrollArea className="h-[300px]">
            <AnimatePresence>
              <div className="space-y-2">
                {filteredMembers.map((member, index) => {
                  const RoleIcon = roleIcons[member.role];
                  
                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        {member.avatarUrl ? (
                          <AvatarImage src={member.avatarUrl} alt={member.name} />
                        ) : (
                          <AvatarFallback style={{ backgroundColor: `${themeColor}30` }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          {member.status === 'pending' && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {member.role === 'owner' ? (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Crown className="h-3 w-3 text-yellow-500" />
                            Owner
                          </Badge>
                        ) : (
                          <Select 
                            value={member.role} 
                            onValueChange={(role) => onRoleChange?.(member.id, role)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">
                                <div className="flex items-center gap-2">
                                  <Edit3 className="h-3 w-3" />
                                  Editor
                                </div>
                              </SelectItem>
                              <SelectItem value="viewer">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-3 w-3" />
                                  Viewer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => onRemoveMember?.(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
