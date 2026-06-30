import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Star,
  Globe,
  CreditCard,
  FileText,
  Lock,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { EntryAttachments } from './EntryAttachments';
import { ShareEntry } from './ShareEntry';

interface PasswordCardProps {
  entry: {
    id: string;
    title: string;
    username: string;
    password: string;
    website: string;
    notes: string;
    category: string;
    is_favorite: boolean;
    password_strength: number;
    vault_id: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const categoryIcons: Record<string, typeof Globe> = {
  login: Globe,
  General: Globe,
  payment: CreditCard,
  identity: FileText,
  'secure-note': Lock,
};

export const PasswordCard = ({ entry, onEdit, onDelete, onToggleFavorite }: PasswordCardProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const CategoryIcon = categoryIcons[entry.category] || Globe;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const getStrengthInfo = (strength: number) => {
    if (strength >= 80) return { color: 'bg-primary', text: 'No Breaches', textColor: 'text-primary', badgeBg: 'bg-primary/10 border-primary/30' };
    if (strength >= 60) return { color: 'bg-primary', text: 'Medium', textColor: 'text-primary', badgeBg: 'bg-primary/10 border-primary/30' };
    return { color: 'bg-red-500', text: 'Weak', textColor: 'text-red-500', badgeBg: 'bg-red-500/10 border-red-500/30' };
  };

  const strengthInfo = getStrengthInfo(entry.password_strength);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card className="group relative overflow-hidden border border-primary/10 bg-[#141414] backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
        {/* Strength indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <div 
            className={`h-full ${strengthInfo.color} transition-all duration-500`}
            style={{ width: `${entry.password_strength}%` }}
          />
        </div>

        <div className="p-4 pt-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
                <CategoryIcon className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{entry.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onToggleFavorite}
                  >
                    <Star className={`w-4 h-4 transition-colors ${entry.is_favorite ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-primary'}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs bg-muted/50">
                    {entry.category}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${strengthInfo.textColor} ${strengthInfo.badgeBg}`}>
                    {strengthInfo.text}
                  </Badge>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Username</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted/50 px-2 py-1 rounded font-mono truncate flex-1">
                      {entry.username || '—'}
                    </code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(entry.username, 'Username')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy username</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Password</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted/50 px-2 py-1 rounded font-mono truncate flex-1">
                      {showPassword ? entry.password : '••••••••••••'}
                    </code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{showPassword ? 'Hide' : 'Show'} password</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(entry.password, 'Password')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy password</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Website */}
              {entry.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <a 
                    href={entry.website.startsWith('http') ? entry.website : `https://${entry.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate flex items-center gap-1"
                  >
                    {entry.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Notes preview */}
              {entry.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                  "{entry.notes}"
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <EntryAttachments entryId={entry.id} entryTitle={entry.title} />
                  <ShareEntry entryId={entry.id} entryTitle={entry.title} vaultId={entry.vault_id} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
