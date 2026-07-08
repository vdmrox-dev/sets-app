"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      // SW already waiting when the page loaded (most common post-deploy case)
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateReady(true);
      }

      // SW installs while the page is open
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    }).catch(() => {});

    // When new SW takes control, reload to apply update
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return (
    <AnimatePresence>
      {updateReady && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto"
        >
          <div className="bg-brand-plum border border-brand-red/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-xl shadow-black/40">
            <div>
              <p className="text-white text-sm font-semibold">Update available</p>
              <p className="text-gray-500 text-xs">A new version of SETS is ready.</p>
            </div>
            <button
              onClick={() => {
                navigator.serviceWorker.getRegistration().then((reg) => {
                  reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
                });
              }}
              className="shrink-0 bg-brand-red text-white text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider"
            >
              Update
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
