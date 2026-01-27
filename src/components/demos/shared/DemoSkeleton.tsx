import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DemoSkeletonProps {
  variant?: 'default' | 'cards' | 'table' | 'dashboard';
  className?: string;
}

export function DemoSkeleton({ variant = 'default', className }: DemoSkeletonProps) {
  if (variant === 'dashboard') {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        {/* Header skeleton */}
        <div className="flex justify-center">
          <Skeleton className="h-28 w-48" />
        </div>
        
        {/* Badges skeleton */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-24" />
          ))}
        </div>
        
        {/* Tabs skeleton */}
        <Skeleton className="h-10 w-full" />
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Module grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <Skeleton className="h-6 w-6 mb-2" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        <div className="flex justify-center">
          <Skeleton className="h-28 w-48" />
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-4 p-4', className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-0">
            {/* Table header */}
            <div className="flex gap-4 p-3 border-b border-border/50">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="flex gap-4 p-3 border-b border-border/30 last:border-0">
                {[1, 2, 3, 4].map((col) => (
                  <Skeleton key={col} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <div className="flex justify-center">
        <Skeleton className="h-28 w-48" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
