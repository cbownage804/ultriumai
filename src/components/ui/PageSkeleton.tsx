/**
 * Page Skeleton Components
 * Branded loading states for Suspense boundaries
 */
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface PageSkeletonProps {
  variant?: 'dashboard' | 'list' | 'detail' | 'form' | 'cards';
  className?: string;
}

/**
 * Unified page skeleton for Suspense fallbacks
 * Uses Vanguard dark theme with subtle animations
 */
export function PageSkeleton({ variant = 'dashboard', className }: PageSkeletonProps) {
  return (
    <div className={cn('min-h-screen bg-background p-4 sm:p-6 lg:p-8 animate-fade-in', className)}>
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-white/5" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
          <Skeleton className="h-10 w-32 bg-white/5" />
        </div>

        {/* Content based on variant */}
        {variant === 'dashboard' && <DashboardSkeleton />}
        {variant === 'list' && <ListSkeleton />}
        {variant === 'detail' && <DetailSkeleton />}
        {variant === 'form' && <FormSkeleton />}
        {variant === 'cards' && <CardsSkeleton />}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-black/40 border border-white/10">
            <Skeleton className="h-4 w-20 mb-2 bg-white/5" />
            <Skeleton className="h-8 w-16 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-5 w-32 mb-4 bg-white/5" />
          <Skeleton className="h-48 w-full bg-white/5" />
        </div>
        <div className="p-6 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-5 w-32 mb-4 bg-white/5" />
          <Skeleton className="h-48 w-full bg-white/5" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="p-6 rounded-lg bg-black/40 border border-white/10">
        <Skeleton className="h-5 w-40 mb-4 bg-white/5" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
              <Skeleton className="h-4 flex-1 bg-white/5" />
              <Skeleton className="h-4 w-24 bg-white/5" />
              <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 flex-1 max-w-sm bg-white/5" />
        <Skeleton className="h-10 w-24 bg-white/5" />
        <Skeleton className="h-10 w-24 bg-white/5" />
      </div>

      {/* List items */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-black/40 border border-white/10 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg bg-white/5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 bg-white/5" />
              <Skeleton className="h-3 w-32 bg-white/5" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-white/5" />
            <Skeleton className="h-8 w-8 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-6 w-48 mb-4 bg-white/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-white/5" />
            <Skeleton className="h-4 w-5/6 bg-white/5" />
            <Skeleton className="h-4 w-4/6 bg-white/5" />
          </div>
        </div>
        <div className="p-6 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
          <Skeleton className="h-64 w-full bg-white/5" />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-5 w-24 mb-3 bg-white/5" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20 bg-white/5" />
                <Skeleton className="h-4 w-24 bg-white/5" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-black/40 border border-white/10">
          <Skeleton className="h-5 w-28 mb-3 bg-white/5" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 rounded-lg bg-black/40 border border-white/10">
      <Skeleton className="h-6 w-48 mb-6 bg-white/5" />
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-white/5" />
            <Skeleton className="h-10 w-full bg-white/5" />
          </div>
        ))}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/5" />
          <Skeleton className="h-32 w-full bg-white/5" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Skeleton className="h-10 w-24 bg-white/5" />
          <Skeleton className="h-10 w-32 bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 rounded-lg bg-black/40 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-12 w-12 rounded-lg bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-white/5" />
              <Skeleton className="h-3 w-20 bg-white/5" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mb-2 bg-white/5" />
          <Skeleton className="h-4 w-3/4 mb-4 bg-white/5" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
            <Skeleton className="h-8 w-20 bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Minimal loading spinner for smaller components
 */
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-2 border-violet-500/20" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
      </div>
    </div>
  );
}

export default PageSkeleton;
