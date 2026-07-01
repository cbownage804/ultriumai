/**
 * RayPresence — the top-right "Ray is here" indicator.
 *
 * A small monochrome eye with a soft violet pulse. Click opens a
 * popover with Ray's current status, last activity, and quick actions
 * (Ask Ray, open Timeline). Present on every authenticated screen so
 * the user always knows Ray is watching.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, MessageSquare, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isWraythDomain } from '@/utils/subdomain';

const STATUSES = [
  'Watching breach feeds…',
  'Reviewing your vault…',
  'Checking advisories…',
  'Listening for new activity…',
  'Everything looks calm.',
];

function path(p: string) {
  return isWraythDomain() ? p : `/app${p}`;
}

export function RayPresence() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % STATUSES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const openAskRay = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative min-h-[44px] min-w-[44px] rounded-full"
          aria-label="Ray presence"
        >
          <span className="relative inline-flex items-center justify-center">
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-violet-500/20"
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Eye className="h-4 w-4 text-violet-300 relative" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            <motion.span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-green-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            Ray is here
          </div>
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-2 text-sm text-foreground/90"
          >
            {STATUSES[i]}
          </motion.p>
        </div>
        <div className="p-1.5">
          <button
            onClick={openAskRay}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-violet-300" />
            <span className="flex-1 text-left">Ask Ray anything</span>
            <span className="text-[10px] text-muted-foreground tracking-wider">⌘K</span>
          </button>
          <Link
            to={path('/timeline')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <Activity className="h-4 w-4 text-violet-300" />
            <span>Ray's timeline</span>
          </Link>
          <Link
            to={path('/trust')}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-sm text-foreground/90 hover:bg-accent transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-violet-300" />
            <span>Trust Center</span>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default RayPresence;
