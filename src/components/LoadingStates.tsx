import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dashboard Loading States
export const DashboardCardSkeleton = () => (
  <Card className="animate-fade-in">
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-20 w-full" />
    </CardContent>
  </Card>
);

export const DashboardGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
    {Array(6).fill(0).map((_, i) => (
      <DashboardCardSkeleton key={i} />
    ))}
  </div>
);

// Table Loading State
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3 animate-fade-in">
    <div className="flex space-x-4 p-4 border-b">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} className="flex space-x-4 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    ))}
  </div>
);

// Chat Loading State
export const ChatMessageSkeleton = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex space-x-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex space-x-2 justify-end">
      <div className="space-y-2 flex-1 max-w-xs">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

// Chart Loading State
export const ChartSkeleton = () => (
  <Card className="animate-fade-in">
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex items-end space-x-2 h-40">
          {Array(12).fill(0).map((_, i) => (
            <Skeleton key={i} className={`w-full h-${Math.floor(Math.random() * 20) + 10}`} />
          ))}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Security Alert Loading State
export const SecurityAlertSkeleton = () => (
  <Card className="animate-fade-in border-l-4 border-l-warning">
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <Skeleton className="h-6 w-6 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </CardContent>
  </Card>
);

// Full Page Loading State
export const FullPageSkeleton = () => (
  <div className="min-h-screen p-6 space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <DashboardGridSkeleton />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        {Array(3).fill(0).map((_, i) => (
          <SecurityAlertSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);