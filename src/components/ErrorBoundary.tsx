import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Captura erros de renderização e mostra um fallback com "Recarregar"
 * em vez de deixar a tela preta. Reseta ao trocar de rota (via key).
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Falha ao renderizar a tela:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#0D1117]">
          <div className="w-14 h-14 rounded-2xl bg-[#21262D] border border-[#30363D] flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <h1 className="text-[#E6EDF3] font-bold text-base">Não foi possível abrir esta tela</h1>
            <p className="text-[#8B949E] text-sm mt-1 max-w-xs">
              Seus dados foram salvos. Recarregue para continuar.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="btn-primary-gradient px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Recarregar
          </button>
          {this.state.error?.message && (
            <p className="text-[10px] text-[#484F58] font-mono max-w-xs break-words mt-1">
              {this.state.error.message}
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
