import { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Database, Globe } from 'lucide-react';

// Memoized components for better performance
export const MetricCard = memo(({ 
  title, 
  value, 
  unit, 
  trend, 
  icon: Icon 
}: {
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
}) => {
  const trendColor = useMemo(() => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  }, [trend]);

  return (
    <Card className="hover-scale">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
          </div>
          <div className={`p-2 rounded-full bg-primary/10`}>
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <Badge variant="outline" className={`mt-2 ${trendColor}`}>
          {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trend}
        </Badge>
      </CardContent>
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';

// Performance monitoring hook
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    firstInputDelay: 0
  });

  useEffect(() => {
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({ ...prev, firstContentfulPaint: entry.startTime }));
              }
              break;
            case 'largest-contentful-paint':
              setMetrics(prev => ({ ...prev, largestContentfulPaint: entry.startTime }));
              break;
            case 'layout-shift':
              if (!(entry as any).hadRecentInput) {
                setMetrics(prev => ({ 
                  ...prev, 
                  cumulativeLayoutShift: prev.cumulativeLayoutShift + (entry as any).value 
                }));
              }
              break;
            case 'first-input':
              setMetrics(prev => ({ 
                ...prev, 
                firstInputDelay: (entry as any).processingStart - entry.startTime 
              }));
              break;
          }
        }
      });

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift', 'first-input'] });

      return () => observer.disconnect();
    }
  }, []);

  return metrics;
};

// Virtualized list component for large datasets
export const VirtualizedList = memo(({ 
  items, 
  renderItem, 
  itemHeight = 50,
  containerHeight = 400 
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

// Performance dashboard component
const PerformanceDashboard = () => {
  const metrics = usePerformanceMetrics();

  const getTrend = (value: number, threshold: number): 'up' | 'down' => {
    return value < threshold ? 'up' : 'down';
  };

  const performanceData = useMemo(() => [
    {
      title: 'Page Load Time',
      value: Math.round(metrics.loadTime),
      unit: 'ms',
      trend: getTrend(metrics.loadTime, 2000),
      icon: Zap
    },
    {
      title: 'First Contentful Paint',
      value: Math.round(metrics.firstContentfulPaint),
      unit: 'ms',
      trend: getTrend(metrics.firstContentfulPaint, 1800),
      icon: Activity
    },
    {
      title: 'Largest Contentful Paint',
      value: Math.round(metrics.largestContentfulPaint),
      unit: 'ms',
      trend: getTrend(metrics.largestContentfulPaint, 2500),
      icon: Database
    },
    {
      title: 'Cumulative Layout Shift',
      value: Math.round(metrics.cumulativeLayoutShift * 1000) / 1000,
      unit: '',
      trend: getTrend(metrics.cumulativeLayoutShift, 0.1),
      icon: Globe
    }
  ], [metrics]);

  const overallScore = useMemo(() => {
    const scores = [
      metrics.firstContentfulPaint < 1800 ? 100 : Math.max(0, 100 - (metrics.firstContentfulPaint - 1800) / 20),
      metrics.largestContentfulPaint < 2500 ? 100 : Math.max(0, 100 - (metrics.largestContentfulPaint - 2500) / 30),
      metrics.cumulativeLayoutShift < 0.1 ? 100 : Math.max(0, 100 - (metrics.cumulativeLayoutShift - 0.1) * 1000),
      metrics.firstInputDelay < 100 ? 100 : Math.max(0, 100 - (metrics.firstInputDelay - 100) / 5)
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [metrics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Performance Metrics</h2>
        <Badge 
          variant={overallScore >= 90 ? "default" : overallScore >= 70 ? "secondary" : "destructive"}
          className="text-lg px-3 py-1"
        >
          Score: {overallScore}/100
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Performance Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Performance Score</span>
              <span className="font-semibold">{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceData.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default PerformanceDashboard;