import { useState, useCallback } from 'react';
import { X, Play, Square, Check, XCircle, Clock, Loader2, ChevronRight, Bug, Gauge, Zap, AlertTriangle, BarChart3, RefreshCw, Plus, FileCode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface TestCase {
  id: string;
  name: string;
  file: string;
  status: 'idle' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  assertions?: number;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
  threshold: { good: number; warning: number };
}

interface TestingDebugSuiteProps {
  open: boolean;
  onClose: () => void;
  tests: TestCase[];
  onRunTests: () => void;
  onRunSingleTest: (id: string) => void;
  onGenerateTests: (filePath: string) => void;
  projectFiles: { path: string }[];
}

type ActiveTab = 'tests' | 'performance' | 'accessibility';

const MOCK_PERF_METRICS: PerformanceMetric[] = [
  { id: '1', name: 'First Contentful Paint', value: 0.8, unit: 's', status: 'good', threshold: { good: 1.0, warning: 2.5 } },
  { id: '2', name: 'Largest Contentful Paint', value: 1.9, unit: 's', status: 'good', threshold: { good: 2.5, warning: 4.0 } },
  { id: '3', name: 'Cumulative Layout Shift', value: 0.05, unit: '', status: 'good', threshold: { good: 0.1, warning: 0.25 } },
  { id: '4', name: 'Total Blocking Time', value: 180, unit: 'ms', status: 'warning', threshold: { good: 150, warning: 350 } },
  { id: '5', name: 'DOM Nodes', value: 342, unit: '', status: 'good', threshold: { good: 800, warning: 1400 } },
  { id: '6', name: 'Bundle Size', value: 124, unit: 'KB', status: 'good', threshold: { good: 200, warning: 500 } },
];

const MOCK_A11Y = [
  { id: '1', issue: 'Images missing alt text', severity: 'error' as const, count: 2, element: '<img src="...">' },
  { id: '2', issue: 'Low contrast text', severity: 'warning' as const, count: 3, element: '<p class="text-gray-300">' },
  { id: '3', issue: 'Missing form labels', severity: 'warning' as const, count: 1, element: '<input type="text">' },
  { id: '4', issue: 'Semantic headings in order', severity: 'pass' as const, count: 0, element: '' },
  { id: '5', issue: 'Keyboard navigation', severity: 'pass' as const, count: 0, element: '' },
];

export function TestingDebugSuite({ open, onClose, tests, onRunTests, onRunSingleTest, onGenerateTests, projectFiles }: TestingDebugSuiteProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tests');
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [perfMetrics] = useState(MOCK_PERF_METRICS);

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalCount = tests.length;

  const handleRunAll = useCallback(async () => {
    setIsRunningAll(true);
    onRunTests();
    await new Promise(r => setTimeout(r, 2000));
    setIsRunningAll(false);
    toast.success(`Tests complete: ${passedCount} passed, ${failedCount} failed`);
  }, [onRunTests, passedCount, failedCount]);

  if (!open) return null;

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/80">Testing & Debug</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/[0.04] shrink-0">
        {([
          { id: 'tests' as const, label: 'Tests', icon: Play },
          { id: 'performance' as const, label: 'Performance', icon: Gauge },
          { id: 'accessibility' as const, label: 'A11y', icon: Zap },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1 h-6 px-2.5 rounded text-[10px] font-medium transition-colors",
              activeTab === tab.id ? "bg-white/10 text-white/80" : "text-white/30 hover:text-white/55"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tests' ? (
        <>
          {/* Test toolbar */}
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2 text-[9px]">
              {totalCount > 0 && (
                <>
                  <span className="text-emerald-400">{passedCount} passed</span>
                  {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
                  <span className="text-white/20">{totalCount} total</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRunAll}
                disabled={isRunningAll || totalCount === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
              >
                {isRunningAll ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Play className="h-2.5 w-2.5" />}
                Run All
              </button>
            </div>
          </div>

          {/* Test list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Play className="h-5 w-5 text-white/10 mb-2" />
                  <p className="text-[11px] text-white/25">No tests yet</p>
                  <p className="text-[9px] text-white/15 mt-1 max-w-[200px]">Select a file and generate tests with AI</p>
                  {projectFiles.filter(f => f.path.endsWith('.js') || f.path.endsWith('.ts')).length > 0 && (
                    <div className="mt-3 space-y-1 w-full max-w-[220px]">
                      {projectFiles.filter(f => f.path.endsWith('.js') || f.path.endsWith('.ts')).slice(0, 3).map(f => (
                        <button
                          key={f.path}
                          onClick={() => onGenerateTests(f.path)}
                          className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-white/[0.06] text-[10px] text-white/40 hover:text-white/60 hover:bg-white/[0.03] transition-colors"
                        >
                          <FileCode className="h-3 w-3 text-white/20" />
                          <span className="font-mono truncate">{f.path}</span>
                          <Plus className="h-2.5 w-2.5 ml-auto text-cyan-400/50" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                tests.map(test => {
                  const isExpanded = expandedTest === test.id;
                  return (
                    <div key={test.id} className="rounded-md border border-white/[0.06] overflow-hidden">
                      <button
                        onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-white/[0.02] transition-colors"
                      >
                        {test.status === 'passed' && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                        {test.status === 'failed' && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                        {test.status === 'running' && <Loader2 className="h-3 w-3 text-cyan-400 animate-spin shrink-0" />}
                        {test.status === 'idle' && <div className="h-3 w-3 rounded-full border border-white/15 shrink-0" />}
                        {test.status === 'skipped' && <div className="h-3 w-3 rounded-full bg-white/10 shrink-0" />}
                        
                        <span className={cn(
                          "text-[10px] truncate flex-1 text-left",
                          test.status === 'passed' ? "text-white/60" :
                          test.status === 'failed' ? "text-red-300/80" :
                          "text-white/40"
                        )}>
                          {test.name}
                        </span>
                        
                        {test.duration && (
                          <span className="text-[8px] text-white/15 shrink-0">{test.duration}ms</span>
                        )}
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); onRunSingleTest(test.id); }}
                          className="h-4 w-4 rounded flex items-center justify-center text-white/15 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors shrink-0"
                        >
                          <Play className="h-2 w-2" />
                        </button>
                        
                        <ChevronRight className={cn("h-2.5 w-2.5 text-white/10 transition-transform shrink-0", isExpanded && "rotate-90")} />
                      </button>
                      
                      {isExpanded && test.error && (
                        <div className="px-2.5 py-2 bg-red-500/5 border-t border-red-500/10 animate-in fade-in duration-150">
                          <pre className="text-[9px] font-mono text-red-300/60 whitespace-pre-wrap leading-4">{test.error}</pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </>
      ) : activeTab === 'performance' ? (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Core Web Vitals</span>
              <button className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
                <RefreshCw className="h-2.5 w-2.5" />
              </button>
            </div>

            {perfMetrics.map(metric => (
              <div key={metric.id} className="rounded-lg border border-white/[0.06] p-2.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-white/60">{metric.name}</span>
                  <div className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium",
                    metric.status === 'good' ? "bg-emerald-500/10 text-emerald-400" :
                    metric.status === 'warning' ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                  )}>
                    {metric.status === 'good' ? <Check className="h-2 w-2" /> : <AlertTriangle className="h-2 w-2" />}
                    {metric.status}
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-white/80">{metric.value}</span>
                  <span className="text-[9px] text-white/25">{metric.unit}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      metric.status === 'good' ? "bg-emerald-400" :
                      metric.status === 'warning' ? "bg-amber-400" :
                      "bg-red-400"
                    )}
                    style={{ width: `${Math.min(100, (metric.value / metric.threshold.warning) * 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Performance score */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">92</div>
              <div className="text-[9px] text-emerald-400/60 mt-0.5">Performance Score</div>
            </div>
          </div>
        </ScrollArea>
      ) : (
        /* Accessibility */
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Accessibility Audit</span>
              <div className="flex items-center gap-1 text-[9px]">
                <span className="text-red-400">{MOCK_A11Y.filter(a => a.severity === 'error').length}</span>
                <span className="text-white/10">·</span>
                <span className="text-amber-400">{MOCK_A11Y.filter(a => a.severity === 'warning').length}</span>
                <span className="text-white/10">·</span>
                <span className="text-emerald-400">{MOCK_A11Y.filter(a => a.severity === 'pass').length} ✓</span>
              </div>
            </div>

            {MOCK_A11Y.map(item => (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg border p-2.5",
                  item.severity === 'error' ? "border-red-500/20 bg-red-500/5" :
                  item.severity === 'warning' ? "border-amber-500/20 bg-amber-500/5" :
                  "border-emerald-500/20 bg-emerald-500/5"
                )}
              >
                <div className="flex items-center gap-2">
                  {item.severity === 'error' && <XCircle className="h-3 w-3 text-red-400 shrink-0" />}
                  {item.severity === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />}
                  {item.severity === 'pass' && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                  <span className={cn(
                    "text-[10px] font-medium",
                    item.severity === 'error' ? "text-red-300/80" :
                    item.severity === 'warning' ? "text-amber-300/80" :
                    "text-emerald-300/80"
                  )}>
                    {item.issue}
                  </span>
                  {item.count > 0 && (
                    <span className="ml-auto text-[8px] text-white/20">{item.count} issues</span>
                  )}
                </div>
                {item.element && (
                  <code className="block mt-1 text-[8px] font-mono text-white/20">{item.element}</code>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/[0.06] text-[9px] text-white/20 shrink-0">
        {activeTab === 'tests' && `${totalCount} tests · ${passedCount} passed`}
        {activeTab === 'performance' && 'Score: 92/100'}
        {activeTab === 'accessibility' && `${MOCK_A11Y.filter(a => a.severity !== 'pass').length} issues found`}
      </div>
    </div>
  );
}
