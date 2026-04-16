import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.hash = "/";
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? "Something went wrong";
      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="max-w-md text-center">
            <AlertTriangle size={36} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-200 mb-2">{title}</h2>
            <p className="text-sm text-gray-400 mb-1">
              This part of the app encountered an error. Your data is safe.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-600 font-mono mt-2 mb-4 break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={this.handleRetry}
                className="btn btn-safe flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Try again
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn flex items-center gap-2"
              >
                <Home size={14} />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
