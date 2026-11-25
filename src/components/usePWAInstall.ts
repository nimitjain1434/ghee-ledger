import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt) {
      return window.__deferredPWAInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [chromeIntentUrl, setChromeIntentUrl] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const isStandalone =
        mediaQuery.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    const inApp =
      /whatsapp|fbav|fban|instagram|telegram|line|micromessenger|snapchat|; wv\)/i.test(
        userAgent
      );

    let inFrame = false;
    try {
      inFrame = window.self !== window.top;
    } catch {
      inFrame = true;
    }

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsInAppBrowser(inApp);
    setIsInIframe(inFrame);

    if (
      isAndroidDevice &&
      (window.location.protocol === 'https:' || window.location.protocol === 'http:')
    ) {
      const scheme = window.location.protocol.replace(':', '');
      const urlWithoutScheme = `${window.location.host}${window.location.pathname}${window.location.search}`;
      setChromeIntentUrl(
        `intent://${urlWithoutScheme}#Intent;scheme=${scheme};package=com.android.chrome;end`
      );
    }

    // Hydrate if index.html captured early prompt before React mounted
    if (window.__deferredPWAInstallPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__deferredPWAInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPWAInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__deferredPWAInstallPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener?.('change', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener?.('change', checkStandalone);
    };
  }, []);

  const install = async () => {
    const promptEvent = deferredPrompt || window.__deferredPWAInstallPrompt;
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        window.__deferredPWAInstallPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPWAInstallPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    chromeIntentUrl,
    install,
  };
}
