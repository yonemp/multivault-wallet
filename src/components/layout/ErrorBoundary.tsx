"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { recordHealthEvent } from "@/lib/platform/health-monitor";
import { Button } from "@/components/ui/Button";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    recordHealthEvent("react", error.message, error.stack, {
      componentStack: info.componentStack?.slice(0, 500) ?? "",
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-base)] px-6 text-center">
          <p className="text-lg font-semibold text-[var(--loss)]">Terminal hit an error</p>
          <p className="max-w-md text-sm text-[var(--muted)]">{this.state.error.message}</p>
          <div className="flex gap-2">
            <Button onClick={() => this.setState({ error: null })}>Try again</Button>
            <Button variant="secondary" onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}