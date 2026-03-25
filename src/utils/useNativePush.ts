import { useEffect, useState } from 'react';

/**
 * Hook to register for push notifications when running inside the Capacitor native shell.
 * Safe to call in the browser (no-ops when Capacitor is not present).
 */
export function useNativePush() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Only run inside native Capacitor shell
    if (typeof window === 'undefined') return;
    const cap = (window as any).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    let cleanup = false;

    async function init() {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        await PushNotifications.register();

        PushNotifications.addListener('registration', (regToken) => {
          if (!cleanup) {
            setToken(regToken.value);
            console.log('[Push] Device token:', regToken.value);
            // TODO: Send token to your backend for server-initiated push
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[Push] Registration error:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Push] Received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('[Push] Action:', action);
        });
      } catch (err) {
        console.warn('[Push] Not available:', err);
      }
    }

    init();

    return () => {
      cleanup = true;
    };
  }, []);

  return token;
}
