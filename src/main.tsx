import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Unregister any leftover dev service worker so Vite dev chunks never mix old/new ?v= hashes
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    })
    .catch(() => {});
}

if (import.meta.env.PROD) {
  // Register Service Worker with immediate update checks in production builds
  const appBootTime = Date.now();
  let hasReloadedForUpdate = false;

  if ('serviceWorker' in navigator) {
    const hadExistingController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadExistingController || hasReloadedForUpdate) return;
      // If new version activates shortly after launching/refreshing, reload once automatically.
      // Otherwise notify the UI so mid-entry form state isn't interrupted unexpectedly.
      if (Date.now() - appBootTime < 20000) {
        hasReloadedForUpdate = true;
        window.location.reload();
      } else {
        window.dispatchEvent(new CustomEvent('pwa-update-ready'));
      }
    });
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      const checkForUpdates = () => {
        if (navigator.onLine) {
          registration.update().catch(() => {});
        }
      };
      // Check immediately after boot, whenever app returns to foreground, and periodically
      checkForUpdates();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdates();
        }
      });
      window.addEventListener('online', checkForUpdates);
      setInterval(checkForUpdates, 5 * 60 * 1000);
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
