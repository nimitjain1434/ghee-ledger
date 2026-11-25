import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Copy, ExternalLink, Share2 } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    chromeIntentUrl,
    install,
  } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleShareUrl = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Shreeji Pure Ghee Ledger',
          text: 'Open this link in Google Chrome or Safari to install the Ghee Khata & Billing App:',
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share failed; fall back to copy
      }
    }
    await handleCopyUrl();
  };

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
        <Smartphone className="w-3.5 h-3.5" />
        <span>Installed App (इंस्टॉल हो चुका है)</span>
      </div>
    );
  }

  return (
    <>
      <button
        id="btn-install-pwa"
        onClick={async () => {
          if (isInstallable) {
            const success = await install();
            if (!success) setShowGuide(true);
          } else {
            setShowGuide(true);
          }
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
        title="Install as Phone App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App (फ़ोन में इंस्टॉल)</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Install on Android / iPhone
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    फ़ोन में बिना इंटरनेट ऐप की तरह चलाएं
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="py-4 space-y-3.5 text-xs text-stone-700">
              {/* Context-aware alert for WhatsApp / In-App Browser or Iframe */}
              {isInIframe && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-950 space-y-2">
                  <span className="font-bold block text-xs">
                    ⚠️ Opened inside Preview Frame
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Install options are hidden inside preview frames. Open the app in a full browser tab first, then tap <strong>Install App</strong>.
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Screen to Install</span>
                  </a>
                </div>
              )}

              {isInAppBrowser && isAndroid && chromeIntentUrl && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-950 space-y-2">
                  <span className="font-bold block text-xs">
                    ⚠️ Opened inside WhatsApp / In-App Browser
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    WhatsApp&apos;s built-in browser hides the <strong>&quot;Add to Home screen&quot;</strong> button. Tap below to open directly in Google Chrome, then press <strong>Install App</strong>:
                  </p>
                  <a
                    href={chromeIntentUrl}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Directly in Chrome (क्रोम में खोलें)</span>
                  </a>
                </div>
              )}

              {/* Platform-specific instructions */}
              {isIOS ? (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs">
                    How to install on iPhone / iPad (Safari):
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <li>
                      If opened inside WhatsApp, tap the <strong>Safari / Compass</strong> button (or copy the link and paste it in <strong>Safari</strong>).
                    </li>
                    <li>
                      Tap the <strong>Share (⬆️)</strong> icon at the bottom or top of Safari.
                    </li>
                    <li>
                      Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong> (होम स्क्रीन पर जोड़ें) → <strong>Add</strong>.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs">
                    How to install on Android Phone:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <li>
                      Open this link in <strong>Google Chrome</strong> (not WhatsApp&apos;s viewer).
                    </li>
                    <li>
                      Tap the <strong>Install App</strong> button on top, OR tap Chrome&apos;s <strong>3 dots (⋮)</strong> menu at the top right.
                    </li>
                    <li>
                      Tap <strong>&quot;Add to Home screen&quot;</strong> → <strong>&quot;Install&quot;</strong> (या <strong>&quot;Install app&quot;</strong>).
                    </li>
                    <li>
                      On Samsung Internet: tap <strong>Menu (≡)</strong> → <strong>Add page to</strong> → <strong>Home screen</strong>.
                    </li>
                  </ol>

                  {/* Always offer quick Launch in Chrome on Android even if UA didn't report WebView */}
                  {isAndroid && !isInAppBrowser && chromeIntentUrl && (
                    <a
                      href={chromeIntentUrl}
                      className="w-full py-2 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-300 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Switch to Google Chrome App</span>
                    </a>
                  )}
                </div>
              )}

              {/* Share / Copy Link */}
              <div className="pt-1 space-y-2">
                <label className="block text-[11px] font-semibold text-stone-600">
                  Copy or Share App Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border border-stone-300 text-[11px] bg-stone-50 font-mono text-stone-600 truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-stone-800 transition cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareUrl}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-700 transition cursor-pointer shrink-0"
                    title="Share App Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 cursor-pointer transition shadow-xs"
              >
                Got It (समझ गया)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
