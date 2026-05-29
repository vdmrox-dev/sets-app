"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

export function useInstallState() {
  const [state, setState] = useState({ deferredPrompt: null, showButton: false, ios: false });

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem("sets_install_dismissed")) return;

    if (isIOS()) {
      setState({ deferredPrompt: null, showButton: true, ios: true });
      return;
    }

    const onPrompt = (e) => {
      e.preventDefault();
      setState({ deferredPrompt: e, showButton: true, ios: false });
    };

    const onInstalled = () => {
      setState({ deferredPrompt: null, showButton: false, ios: false });
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    localStorage.setItem("sets_install_dismissed", "1");
    setState((s) => ({ ...s, showButton: false }));
  }

  return { deferredPrompt: state.deferredPrompt, showButton: state.showButton, ios: state.ios, dismiss };
}

export default function InstallSheet({ open, onClose, deferredPrompt, ios }) {
  const [installing, setInstalling] = useState(false);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-brand-plum/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-6 py-4 pb-10 space-y-5">
              {/* Icon */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-maroon via-brand-plum to-brand-navy flex items-center justify-center border border-brand-red/30 shrink-0">
                  <span className="text-brand-red font-black text-2xl">S</span>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Install SETS</p>
                  <p className="text-gray-500 text-xs mt-0.5">Add to your home screen for the best experience</p>
                </div>
              </div>

              {ios ? (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                    <Step n={1} text={<>Tap the <strong className="text-white">Share</strong> button at the bottom of Safari</>} icon="⬆" />
                    <div className="h-px bg-white/10" />
                    <Step n={2} text={<>Scroll down and tap <strong className="text-white">Add to Home Screen</strong></>} icon="＋" />
                    <div className="h-px bg-white/10" />
                    <Step n={3} text={<>Tap <strong className="text-white">Add</strong> to confirm</>} icon="✓" />
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full bg-brand-red hover:bg-brand-maroon text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm shadow-lg shadow-brand-red/20 disabled:opacity-60"
                >
                  {installing ? "Installing…" : "Add to Home Screen"}
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full text-gray-600 text-sm py-2"
              >
                Not now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Step({ n, text, icon }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-brand-red/20 border border-brand-red/30 flex items-center justify-center text-brand-red text-sm shrink-0">
        {icon}
      </div>
      <p className="text-gray-400 text-sm leading-snug">{text}</p>
    </div>
  );
}
