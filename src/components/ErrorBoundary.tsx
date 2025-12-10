import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-destructive to-destructive/60 mb-2">
            Something went wrong
          </h1>

          <p className="text-muted-foreground max-w-md mb-8">
            We encountered an unexpected error. Please try refreshing the page.
          </p>

          <div className="glass-card p-4 rounded-lg bg-card/50 border border-border mb-8 max-w-2xl w-full text-left overflow-hidden">
            <code className="text-xs text-destructive font-mono block overflow-auto whitespace-pre-wrap max-h-40">
              {this.state.error?.message}
            </code>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline">
              Try Again
            </Button>
            <Button onClick={this.handleReload} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}