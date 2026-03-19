/**
 * Wave 9 Step 6: Project Environment Indicator
 * Shows connection states for Supabase, env vars, edge functions, etc.
 */

import { Database, Key, Cloud, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EnvironmentStatusBarProps {
  supabaseConnected: boolean;
  envVarCount: number;
  edgeFunctionCount: number;
  storageBucketCount: number;
  onClickSupabase?: () => void;
  onClickEnvVars?: () => void;
  onClickEdgeFunctions?: () => void;
  onClickStorage?: () => void;
}

function StatusDot({ active, color }: { active: boolean; color: string }) {
  return (
    <span className={cn(
      "h-1.5 w-1.5 rounded-full shrink-0",
      active ? color : "bg-white/10"
    )} />
  );
}

export function EnvironmentStatusBar({
  supabaseConnected, envVarCount, edgeFunctionCount, storageBucketCount,
  onClickSupabase, onClickEnvVars, onClickEdgeFunctions, onClickStorage,
}: EnvironmentStatusBarProps) {
  const items = [
    {
      icon: Database,
      label: 'Supabase',
      status: supabaseConnected ? 'Connected' : 'Not connected',
      active: supabaseConnected,
      dotColor: 'bg-emerald-400',
      onClick: onClickSupabase,
    },
    {
      icon: Key,
      label: 'Env Vars',
      status: `${envVarCount} configured`,
      active: envVarCount > 0,
      dotColor: 'bg-amber-400',
      onClick: onClickEnvVars,
    },
    {
      icon: Cloud,
      label: 'Edge Functions',
      status: `${edgeFunctionCount} deployed`,
      active: edgeFunctionCount > 0,
      dotColor: 'bg-cyan-400',
      onClick: onClickEdgeFunctions,
    },
    {
      icon: HardDrive,
      label: 'Storage',
      status: `${storageBucketCount} bucket${storageBucketCount !== 1 ? 's' : ''}`,
      active: storageBucketCount > 0,
      dotColor: 'bg-violet-400',
      onClick: onClickStorage,
    },
  ];

  return (
    <div className="flex items-center gap-0.5 px-2 py-0.5 bg-white/[0.015] border-b border-white/[0.04]">
      {items.map((item) => (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <button
              onClick={item.onClick}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
            >
              <StatusDot active={item.active} color={item.dotColor} />
              <item.icon className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px]">
            {item.label}: {item.status}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
