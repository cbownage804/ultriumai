import { useState } from 'react';
import { Users, Mail, X, Crown, Pencil, Eye, Trash2, Plus, Copy, Check, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Role = 'viewer' | 'editor' | 'admin';

interface Collaborator {
  id: string;
  email: string;
  role: Role;
  avatarColor: string;
  joinedAt: Date;
}

interface ProjectShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  collaborators: Collaborator[];
  onInvite: (email: string, role: Role) => void;
  onChangeRole: (id: string, role: Role) => void;
  onRemove: (id: string) => void;
}

const ROLE_ICONS: Record<Role, typeof Eye> = { viewer: Eye, editor: Pencil, admin: Crown };
const ROLE_COLORS: Record<Role, string> = {
  viewer: 'text-blue-400 bg-blue-500/10',
  editor: 'text-emerald-400 bg-emerald-500/10',
  admin: 'text-amber-400 bg-amber-500/10',
};

const AVATAR_COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#22c55e', '#f59e0b', '#ec4899'];

export function ProjectShareDialog({ isOpen, onClose, projectName, collaborators, onInvite, onChangeRole, onRemove }: ProjectShareDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleInvite = () => {
    if (!email.trim() || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    onInvite(email.trim(), role);
    setEmail('');
    toast.success(`Invited ${email.trim()} as ${role}`);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/ai-studio/app-builder?share=${projectName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Share link copied');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[70vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center border border-white/[0.06]">
              <Users className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Share Project</h2>
              <p className="text-[10px] text-white/30 truncate max-w-[200px]">{projectName}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-auto">
          {/* Invite form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  placeholder="Email address..."
                  className="w-full h-9 bg-white/[0.03] border border-white/[0.08] rounded-lg pl-8 pr-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/30"
                />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="h-9 bg-white/[0.03] border border-white/[0.08] rounded-lg px-2 text-xs text-white/70 outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={handleInvite}
                className="h-9 px-3 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors text-xs font-medium flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Invite
              </button>
            </div>
          </div>

          {/* Share link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15] transition-colors text-[11px]"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Link2 className="h-3 w-3" />}
            {copied ? 'Copied!' : 'Copy share link'}
          </button>

          {/* Collaborators list */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-white/20 uppercase tracking-wider font-medium">
              {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </div>
            {collaborators.length === 0 ? (
              <p className="text-[11px] text-white/20 text-center py-4">No collaborators yet</p>
            ) : (
              collaborators.map(collab => {
                const RoleIcon = ROLE_ICONS[collab.role];
                return (
                  <div key={collab.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.02] group transition-colors">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: collab.avatarColor }}
                    >
                      {collab.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-white/70 truncate">{collab.email}</div>
                      <div className="text-[9px] text-white/20">Joined {collab.joinedAt.toLocaleDateString()}</div>
                    </div>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium", ROLE_COLORS[collab.role])}>
                      <RoleIcon className="h-2.5 w-2.5" />
                      {collab.role}
                    </div>
                    <button
                      onClick={() => onRemove(collab.id)}
                      className="h-5 w-5 rounded items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 hidden group-hover:flex transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Collaborator avatars for the top bar */
export function CollaboratorAvatars({ collaborators, onClick }: { collaborators: { id: string; email: string; avatarColor: string }[]; onClick: () => void }) {
  if (collaborators.length === 0) return null;
  const shown = collaborators.slice(0, 3);
  const extra = collaborators.length - shown.length;

  return (
    <button onClick={onClick} className="flex items-center -space-x-1.5 hover:opacity-80 transition-opacity">
      {shown.map(c => (
        <div
          key={c.id}
          className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#0a0a0f]"
          style={{ backgroundColor: c.avatarColor }}
          title={c.email}
        >
          {c.email[0].toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/50 border border-[#0a0a0f]">
          +{extra}
        </div>
      )}
    </button>
  );
}
