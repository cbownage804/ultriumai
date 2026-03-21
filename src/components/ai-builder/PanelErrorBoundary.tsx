import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  panelName?: string;
  children: React.ReactNode;
  /** When provided, calls this to force-remount the entire workspace */
  onResetWorkspace?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PanelErrorBoundary] ${this.props.panelName || 'Unknown'} crashed:`, error, info);
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, retryCount: prev.retryCount + 1 }));
  };

  handleResetWorkspace = () => {
    // Clear all caches that might cause the crash to repeat
    try { localStorage.removeItem('ai-builder-draft'); } catch {}
    try { localStorage.removeItem('ai-builder-compiled-html'); } catch {}
    try { sessionStorage.removeItem('ai-builder-lkg-preview'); } catch {}
    
    if (this.props.onResetWorkspace) {
      this.props.onResetWorkspace();
    } else {
      // Fallback: hard reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const isWorkspaceLevel = this.props.panelName === 'App Builder';
      const hasRetriedEnough = this.state.retryCount >= 2;

      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center bg-[#0f0f14] border border-white/10 rounded-xl m-2 min-h-[200px]">
          <AlertTriangle className="h-10 w-10 text-amber-400/70" />
          <div>
            <p className="text-sm font-medium text-white/70">
              {this.props.panelName || 'Panel'} failed to load
            </p>
            <p className="text-xs text-white/30 mt-1 max-w-xs">
              {this.state.error?.message?.slice(0, 150)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
            {(isWorkspaceLevel || hasRetriedEnough) && (
              <button
                onClick={this.handleResetWorkspace}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-400 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Workspace
              </button>
            )}
          </div>
          {hasRetriedEnough && !isWorkspaceLevel && (
            <p className="text-[10px] text-white/20 mt-1">
              If the issue persists, try Reset Workspace to clear cached state.
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
