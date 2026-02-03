import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string | null;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return { hasError: true, errorMessage: message };
  }

  public componentDidCatch() {
    void 0;
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-black text-white flex justify-center p-6">
        <div className="w-full max-w-[500px]">
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-xl font-black">Something went wrong</div>
            <div className="mt-2 text-sm text-white/70">
              The app hit an unexpected error. Reload the app and try again.
            </div>
            {this.state.errorMessage && (
              <div className="mt-4 text-xs text-white/50 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-5 w-full rounded-xl bg-[#E6B36A] text-black font-extrabold py-2 text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
