import React, { useState, useEffect } from 'react';

/**
 * InstallPrompt Component
 * Manages the "Install App" logic for PWA.
 * Handles Android (beforeinstallprompt) and iOS (manual instructions).
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if app is already installed/standalone
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Listen for the native install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, we show the prompt after a small delay to ensure user engagement
    if (ios) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install dialog
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // We've used the prompt, so we can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  // If already standalone or not visible, don't show anything
  if (isStandalone || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-brand-900 text-white p-5 rounded-3xl shadow-2xl border border-white/10 backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden group">
        {/* Decorative Gradient Background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-brand-400/20 blur-2xl rounded-full" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-lg leading-tight uppercase italic tracking-tight">Level up your experience!</h3>
            <p className="text-sm font-semibold text-brand-100 mt-1">
              {isIOS 
                ? "Install SnapCart to your home screen for faster access." 
                : "Install the SnapCart app for real-time tracking and offline mode."}
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>

        {isIOS ? (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-4">
            <div className="text-xs font-black text-brand-200">
              Tap <span className="bg-white/10 px-2 py-0.5 rounded border border-white/10 text-white inline-flex items-center gap-1 mx-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg> Share</span> then <span className="text-white font-black italic">"Add to Home Screen"</span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-white text-brand-900 font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
          >
            Install SnapCart Now →
          </button>
        )}
      </div>
    </div>
  );
}
