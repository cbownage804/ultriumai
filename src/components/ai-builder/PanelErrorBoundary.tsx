import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  panelName?: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PanelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[PanelErrorBoundary] ${this.props.panelName || 'Unknown'} crashed:`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#0f0f14] border border-white/10 rounded-xl m-2">
          <AlertTriangle className="h-8 w-8 text-amber-400/70" />
          <div>
            <p className="text-sm font-medium text-white/70">
              {this.props.panelName || 'Panel'} failed to load
            </p>
            <p className="text-xs text-white/30 mt-1 max-w-xs">
              {this.state.error?.message?.slice(0, 120)}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
