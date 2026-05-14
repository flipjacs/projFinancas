import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional reset callback; defaults to a full reload. */
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere inside the app shell and shows a
 * neutral fallback so a single broken page can't take the whole app down.
 * React Query errors and event-handler errors are not caught here — those
 * surface through `useQuery`'s `error` field and `toast.error()` instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info);
    }
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertOctagon className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Algo deu errado.</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Houve um erro inesperado ao carregar esta tela. Recarregar a página
            costuma resolver.
          </p>
        </div>
        {import.meta.env.DEV && (
          <pre className="max-w-2xl overflow-auto rounded-md border bg-background p-3 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
        )}
        <Button onClick={this.handleReset} variant="outline">
          <RotateCcw className="h-4 w-4" />
          Tentar de novo
        </Button>
      </div>
    );
  }
}
