import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
  retryCount: number;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorId: this.generateErrorId(),
      retryCount: 0
    };
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Enhanced Error Boundary caught error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Send error to analytics with context
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      context: this.props.context,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Analytics reporting
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: this.props.level === 'critical',
        error_id: this.state.errorId,
        context: this.props.context,
      });
    }

    // Console logging for development
    console.group('🚨 Error Boundary Report');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error ID:', this.state.errorId);
    console.error('Context:', this.props.context);
    console.groupEnd();
  };

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: undefined, 
        errorInfo: undefined,
        errorId: this.generateErrorId(),
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, show contact support option
      this.setState({ retryCount: this.maxRetries });
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const bugReportUrl = `mailto:support@ultriumai.com?subject=Bug Report - ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0D%0AContext: ${this.props.context}%0D%0AError: ${this.state.error?.message}%0D%0A%0D%0APlease describe what you were doing when this error occurred:`;
    window.open(bugReportUrl);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isMaxRetries = this.state.retryCount >= this.maxRetries;
      const severity = this.props.level === 'critical' ? 'critical' : 
                      this.props.level === 'page' ? 'high' : 'medium';

      return (
        <div className="min-h-[400px] bg-background flex items-center justify-center p-4 animate-fade-in">
          <Card className="w-full max-w-lg border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4 animate-pulse-glow">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                Something went wrong
                <Badge variant="destructive" className="text-xs">
                  {severity.toUpperCase()}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Error ID: <code className="bg-muted px-1 rounded text-xs">{this.state.errorId}</code>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {this.props.level === 'critical' 
                  ? 'A critical error occurred that prevents the application from functioning properly.'
                  : this.props.level === 'page'
                  ? 'This page encountered an error and cannot be displayed.'
                  : 'A component failed to load properly, but other parts of the application should still work.'
                }
              </p>

              {this.props.context && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Context: {this.props.context}
                  </AlertDescription>
                </Alert>
              )}
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-3 rounded text-xs">
                  <summary className="cursor-pointer font-medium">Technical Details</summary>
                  <pre className="mt-2 overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                {!isMaxRetries ? (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                  </Button>
                ) : (
                  <Alert className="border-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Multiple retry attempts failed. Please contact support for assistance.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="sm"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                  <Button 
                    onClick={this.handleReportBug}
                    variant="outline"
                    size="sm"
                  >
                    <Bug className="mr-2 h-4 w-4" />
                    Report Bug
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Need immediate help?{' '}
                  <a 
                    href="mailto:support@ultriumai.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    <Mail className="inline h-3 w-3 mr-1" />
                    Contact Support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;