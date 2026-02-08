/**
 * EmptyStates — Beautiful empty state illustrations for various panels
 */

import { motion } from 'framer-motion';
import {
  FolderOpen, Database, Zap, Package, Image, Clock, Shield,
  Terminal, Bug, Layers, BookOpen, Activity, Variable,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: typeof FolderOpen;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center py-12 px-6 text-center relative", className)}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-gradient-to-br from-cyan-500/[0.03] to-violet-500/[0.02] blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative z-10"
      >
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/20">
          <Icon className="h-7 w-7 text-white/15" />
        </div>
      </motion.div>

      <h4 className="text-sm font-medium text-white/50 mb-1 relative z-10">{title}</h4>
      <p className="text-[11px] text-white/25 max-w-[220px] leading-relaxed relative z-10">{description}</p>

      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onAction}
          className="mt-4 text-[11px] text-cyan-400/70 hover:text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all relative z-10"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// Pre-configured empty states for common panels
export const EMPTY_STATES = {
  files: { icon: FolderOpen, title: 'No files yet', description: 'Start building to generate your project files, or create a file manually.' },
  database: { icon: Database, title: 'No database connected', description: 'Connect Supabase in Settings to enable database, auth, and storage features.' },
  edgeFunctions: { icon: Zap, title: 'No edge functions', description: 'Create serverless functions for backend logic, webhooks, and API endpoints.' },
  packages: { icon: Package, title: 'No packages added', description: 'Add npm packages to extend your app with third-party libraries.' },
  assets: { icon: Image, title: 'No assets uploaded', description: 'Upload images, icons, and other assets for your project.' },
  history: { icon: Clock, title: 'No version history', description: 'Version snapshots are created automatically when you build with AI.' },
  tests: { icon: Bug, title: 'No tests yet', description: 'Generate tests from your files or write them manually to ensure quality.' },
  components: { icon: Layers, title: 'Component library empty', description: 'Browse and insert pre-built UI components to speed up development.' },
  envVars: { icon: Variable, title: 'No environment variables', description: 'Add API keys, secrets, and configuration values for your app.' },
  activity: { icon: Activity, title: 'No activity yet', description: 'Actions like file edits, builds, and deploys will appear here.' },
  terminal: { icon: Terminal, title: 'Terminal ready', description: 'Run commands to interact with your project environment.' },
} as const;
