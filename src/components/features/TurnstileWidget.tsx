import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    __TURNSTILE_SITE_KEY?: string;
  }
}

type Props = {
  onTokenChange: (token: string) => void;
  className?: string;
};

export function TurnstileWidget({ onTokenChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>();
  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  useEffect(() => {
    const siteKey = window.__TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    let canceled = false;
    let waitTimer: ReturnType<typeof setInterval> | undefined;

    const renderWidget = () => {
      if (canceled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => onTokenChangeRef.current(token),
        'expired-callback': () => onTokenChangeRef.current(''),
        'error-callback': () => onTokenChangeRef.current(''),
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      waitTimer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(waitTimer);
          renderWidget();
        }
      }, 150);
    }

    return () => {
      canceled = true;
      if (waitTimer) clearInterval(waitTimer);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, []);

  if (typeof window === 'undefined' || !window.__TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className={className} aria-label="Security verification" />;
}

export function resetTurnstileWidgets() {
  try {
    window.turnstile?.reset();
  } catch {
    /* ignore */
  }
}
