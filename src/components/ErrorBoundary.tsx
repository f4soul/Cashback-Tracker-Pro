import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Произошла непредвиденная ошибка.';
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Ошибка базы данных: ${parsed.error}`;
            if (parsed.error.includes('permission-denied')) {
              errorMessage = 'У вас нет прав для выполнения этой операции. Пожалуйста, убедитесь, что вы вошли в систему.';
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[var(--surface-0)]">
          <div className="max-w-md w-full bg-white/95 dark:bg-[var(--surface-2)]/95 backdrop-blur-2xl rounded-[var(--radius-app)] p-8 shadow-[var(--elevation-highlight),0_20px_40px_rgb(0,0,0,0.1)] dark:shadow-[var(--elevation-highlight),0_20px_60px_rgb(0,0,0,0.4)] border border-slate-100 dark:border-[var(--border-hairline)] text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-[var(--radius-sm)] flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">Упс! Что-то пошло не так</h2>
            <p className="text-slate-500 dark:text-[var(--text-secondary)] mb-8 text-sm font-semibold leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 w-full py-4 bg-[var(--accent-color)] text-white rounded-[var(--radius-app)] font-bold hover:brightness-110 transition-all shadow-md shadow-[var(--accent-color)]/30 active:scale-95 cursor-pointer"
            >
              <RefreshCcw className="w-5 h-5" />
              Перезагрузить приложение
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
