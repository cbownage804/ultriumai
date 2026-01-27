import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DemoErrorBoundaryProps {
  children: ReactNode;
  demoName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface DemoErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically designed for demo components.
 * Isolates demo failures so one broken demo doesn't crash others.
 */
export class DemoErrorBoundary extends Component<DemoErrorBoundaryProps, DemoErrorBoundaryState> {
  constructor(props: DemoErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DemoErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    console.error(`[DemoErrorBoundary] Error in ${this.props.demoName || 'demo'}:`, error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {this.props.demoName ? `${this.props.demoName} Demo Unavailable` : 'Demo Unavailable'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We encountered an issue loading this demo. Please try again.
            </p>
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
