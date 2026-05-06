import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <div className="max-w-md rounded-2xl bg-[var(--bg-secondary)] p-8 text-center shadow-lg border border-[var(--border-subtle)]">
            <h2 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
            <p className="mb-6 text-[var(--text-secondary)]">
              An unexpected error occurred while loading the page. Please try refreshing the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-[var(--btn-primary-bg)] px-6 py-2.5 text-[var(--btn-primary-text)] font-bold transition-colors hover:bg-[var(--btn-primary-hover)]"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
