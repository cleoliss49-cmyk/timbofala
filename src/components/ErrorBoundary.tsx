import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Keep a console trail for debugging instead of a blank screen.
    console.error("App crashed:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Ops… algo deu errado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Encontramos um erro ao renderizar esta página. Você pode recarregar ou voltar ao início.
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReload} className="flex-1">Recarregar</Button>
              <Button variant="outline" onClick={this.handleGoHome} className="flex-1">Ir para início</Button>
            </div>
            {import.meta.env.DEV && this.state.error?.message && (
              <pre className="text-xs bg-muted/40 border border-border rounded-lg p-3 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
}
