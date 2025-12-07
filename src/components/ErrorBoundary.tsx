import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <Button onClick={this.handleReset} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}