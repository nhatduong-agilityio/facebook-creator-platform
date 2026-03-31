'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

type ToastTone = 'success' | 'error' | 'info';

type ToastRecord = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

type ToastContextValue = {
  pushToast: (input: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismissToast: (id: string) => void;
};

const toneClasses: Record<ToastTone, string> = {
  success:
    'border-[color:color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color:color-mix(in_srgb,var(--panel)_88%,var(--success-soft))] text-[var(--foreground)]',
  error:
    'border-[color:color-mix(in_srgb,var(--danger)_34%,transparent)] bg-[color:color-mix(in_srgb,var(--panel)_88%,var(--danger-soft))] text-[var(--foreground)]',
  info: 'border-[var(--line-strong)] bg-[var(--panel-strong)] text-[var(--foreground)]'
};

const toneBadgeClasses: Record<ToastTone, string> = {
  success: 'text-[var(--success)]',
  error: 'text-[var(--danger)]',
  info: 'text-[var(--accent-secondary)]'
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timeoutMapRef = useRef(new Map<string, number>());
  const idRef = useRef(0);

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));

    const timeoutId = timeoutMapRef.current.get(id);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutMapRef.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ title, description, tone = 'info' }: ToastInput) => {
      idRef.current += 1;
      const id = `toast-${idRef.current}`;

      setToasts(current => [...current, { id, title, description, tone }]);

      const timeoutId = window.setTimeout(
        () => {
          dismissToast(id);
        },
        tone === 'error' ? 6500 : 4200
      );

      timeoutMapRef.current.set(id, timeoutId);
    },
    [dismissToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      pushToast,
      success: (title, description) => {
        pushToast({ title, description, tone: 'success' });
      },
      error: (title, description) => {
        pushToast({ title, description, tone: 'error' });
      },
      info: (title, description) => {
        pushToast({ title, description, tone: 'info' });
      },
      dismissToast
    }),
    [dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end"
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          {toasts.map(toast => (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
              className={`pointer-events-auto rounded-[1rem] border px-4 py-3 shadow-[var(--shadow-soft)] ${toneClasses[toast.tone]}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.14em] ${toneBadgeClasses[toast.tone]}`}
                  >
                    {toast.tone}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                      {toast.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--panel-contrast)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  onClick={() => {
                    dismissToast(toast.id);
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider.');
  }

  return context;
}
