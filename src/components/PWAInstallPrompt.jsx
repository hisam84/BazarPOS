'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently
    const isDismissed = sessionStorage.getItem('bazarpos_pwa_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('bazarpos_pwa_dismissed', 'true');
  };

  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 sm:max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl text-white flex items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h4 className="font-bold text-xs text-white truncate">Install BazarPOS App</h4>
              <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-300 font-bold text-[9px] rounded uppercase border border-indigo-400/20">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              Use as full-screen mobile app with offline support
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-md shadow-indigo-600/30"
          >
            <Download size={14} />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
