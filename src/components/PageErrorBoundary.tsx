import React from 'react';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  // Remounts the boundary (clearing the error) whenever this key changes,
  // e.g. pass the current route path so navigating away and back retries.
  resetKey?: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Prevents an error thrown while rendering one page (e.g. the calendar page)
// from unmounting the entire app. Without a boundary like this, any uncaught
// render error blanks out everything, including the sidebar and every other
// page, since React unmounts the whole tree back to the nearest boundary
// (the root, if there isn't one).
class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep this visible in production too so real issues can be diagnosed
    // from a user's console/bug report instead of just a blank page.
    console.error('Page failed to render:', error, info.componentStack);
  }

  componentDidUpdate(prevProps: PageErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center gap-3">
          <p className="text-lg font-semibold">This page hit an error and couldn't load.</p>
          <p className="text-sm opacity-70 max-w-md">
            The rest of the app should still work — try another page from the sidebar, or reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default PageErrorBoundary;
