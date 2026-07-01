/**
 * PasswordCard — Apple-Passwords-inspired row. Conversational status,
 * favicon-first identity, Ray annotations on rows that need attention.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, Copy, Star, Globe, Edit, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { lookupCatalog } from '@/lib/ray/mfaCatalog';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';

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
    created_at?: string;
  };
  /** Whether this account has a TOTP authenticator stored. */
  hasMfa?: boolean;
  /** True if this service appears in a known breach dataset. */
  hasBreach?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function hostnameFor(website: string, title: string): string {
  try {
    const url = website ? (website.startsWith('http') ? website : `https://${website}`) : '';
    if (url) return new URL(url).hostname.replace(/^www\./, '');
  } catch {/* noop */}
  return title?.toLowerCase().replace(/\s+/g, '') || '';
}

function faviconFor(host: string): string | null {
  if (!host) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
}

export const PasswordCard = ({
  entry,
  hasMfa = false,
  hasBreach = false,
  onEdit,
  onDelete,
  onToggleFavorite,
}: PasswordCardProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const host = hostnameFor(entry.website, entry.title);
  const favicon = faviconFor(host);
  const catalog = (() => {
    try { return lookupCatalog(host); } catch { return null; }
  })();
  const supportsMfa = !!catalog;

  const lastChanged = entry.created_at
    ? `Last changed ${formatDistanceToNowStrict(new Date(entry.created_at))} ago`
    : null;

  const status: { text: string; tone: 'good' | 'warn' | 'bad' } = (() => {
    if (hasBreach) return { text: 'Found in a known breach', tone: 'bad' };
    if (entry.password_strength < 60) return { text: 'Weak password', tone: 'bad' };
    if (hasMfa) return { text: 'Protected with 2FA', tone: 'good' };
    if (supportsMfa) return { text: 'Strong password · Supports 2FA', tone: 'good' };
    return { text: 'Strong password · No breach detected', tone: 'good' };
  })();

  const rayNote = (() => {
    if (hasBreach) return "Ray: this password appeared in a breach. I'd rotate it now.";
    if (entry.password_strength < 60) return "Ray: this password is weak. I can generate a stronger one for you.";
    if (supportsMfa && !hasMfa) return `Ray: ${host || entry.title} supports 2FA. I'd enable it next.`;
    return null;
  })();

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/5 bg-card/40 hover:bg-card/70 hover:border-primary/20 transition-colors">
        {/* Favicon */}
        <div className="shrink-0 w-10 h-10 rounded-lg bg-muted/50 border border-border/40 flex items-center justify-center overflow-hidden">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={favicon}
              alt=""
              className="w-6 h-6"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <Globe className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-medium text-foreground truncate">{entry.title}</h3>
            {host && <span className="text-xs text-muted-foreground truncate">{host}</span>}
            <button onClick={onToggleFavorite} className="ml-1 shrink-0" aria-label="Favorite">
              <Star className={cn('w-3.5 h-3.5', entry.is_favorite ? 'text-primary fill-primary' : 'text-muted-foreground/40 hover:text-primary')} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 truncate">
            <span className="truncate">{entry.username || '—'}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className={cn(
              'truncate',
              status.tone === 'bad' && 'text-red-400',
              status.tone === 'good' && 'text-green-400/90',
            )}>
              {status.text}
            </span>
            {hasMfa && <ShieldCheck className="w-3 h-3 text-green-400/80 shrink-0" />}
          </div>
          {rayNote && (
            <div className="text-xs italic text-violet-300/70 mt-1 truncate">{rayNote}</div>
          )}
        </div>

        {/* Last changed */}
        {lastChanged && (
          <div className="hidden md:block text-xs text-muted-foreground/70 shrink-0 mr-2">
            {lastChanged}
          </div>
        )}

        {/* Password reveal */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <code className="text-xs text-muted-foreground tabular-nums">
            {showPassword ? entry.password : '••••••••'}
          </code>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showPassword ? 'Hide' : 'Show'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleCopy(entry.password, 'Password')}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy password</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Edit / delete (hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
