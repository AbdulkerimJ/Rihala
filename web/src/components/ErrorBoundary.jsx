import React from 'react';
import { AlertTriangle } from "lucide-react";
import { Button } from './ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In development, log the error to the console
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    // In a real production app, you might send this to a monitoring service here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex w-full flex-col items-center justify-center p-6 min-h-[400px] flex-1">
          <div className="max-w-md w-full rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-primary">
              Something went wrong
            </h2>
            <p className="mb-8 text-sm text-secondary">
              The page encountered an unexpected problem.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">
                Reload
              </Button>
              <Button onClick={this.handleReset} variant="danger" className="w-full">
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
