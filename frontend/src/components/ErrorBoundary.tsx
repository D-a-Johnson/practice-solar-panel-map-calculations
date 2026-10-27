import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };
type ErrorBoundaryState = { failed: boolean };

/**
 * An error while rendering would otherwise unmount everything above it and
 * leave a blank page. React has no hook for this, so it's a class. React 19
 * already logs the caught error to the console.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
