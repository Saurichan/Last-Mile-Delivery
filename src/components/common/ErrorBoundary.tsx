import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleResetData = () => {
    try {
      localStorage.removeItem('last_mile_optimizer_prod_v3');
      localStorage.removeItem('optimizer_analytics_events');
      localStorage.removeItem('optimizer_cookie_consent_given');
    } catch (e) {
      console.warn('Failed to clear localStorage', e);
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected runtime error occurred.';
      const stack = this.state.error?.stack || this.state.errorInfo?.componentStack;

      return (
        <div className="min-h-screen bg-[#F7F8F7] dark:bg-[#292D32] flex items-center justify-center p-4 font-sans text-[#292D32] dark:text-[#F1F3F2]">
          <div className="w-full max-w-lg bg-white dark:bg-[#33383F] border border-[#EAECEA] dark:border-[#495059] rounded-3xl p-6 sm:p-8 shadow-card space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-[#292D32] dark:text-white">
                  Something went wrong
                </h1>
                <p className="text-xs text-[#B4B6B7]">
                  The application caught a runtime error
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl text-xs font-mono text-rose-700 dark:text-rose-300 break-words">
              {errorMsg}
            </div>

            {stack && (
              <details className="text-[11px] text-[#B4B6B7] bg-[#F7F8F7] dark:bg-[#292D32] p-3 rounded-2xl border border-[#EAECEA] dark:border-[#495059]">
                <summary className="cursor-pointer font-bold select-none text-zinc-700 dark:text-zinc-300">
                  Technical Stack Trace
                </summary>
                <pre className="mt-2 text-[10px] whitespace-pre-wrap overflow-x-auto max-h-48 font-mono">
                  {stack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#168E6A] hover:bg-[#127355] text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-subtle active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleResetData}
                className="flex-1 py-2.5 px-4 bg-[#F7F8F7] hover:bg-rose-50 dark:bg-[#292D32] dark:hover:bg-rose-950/30 text-rose-600 border border-[#EAECEA] dark:border-[#495059] hover:border-rose-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Stored Data</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

