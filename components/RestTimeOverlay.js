"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function formatRest(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RestTimeOverlay({ startedAt, onClose }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const elapsed =
    now == null || !startedAt ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="relative flex flex-col items-center"
      >
        <p className="text-[11px] uppercase tracking-[0.28em] font-mono text-gray-500">
          Rest time
        </p>
        <p className="mt-4 font-mono font-black text-brand-red tabular-nums leading-none text-7xl tracking-tight">
          {formatRest(elapsed)}
        </p>
        <p className="mt-5 text-xs text-gray-600">Until you&apos;re ready for the next set</p>

        <button
          type="button"
          onClick={onClose}
          className="mt-10 w-56 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest active:scale-[0.97] transition-transform"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
