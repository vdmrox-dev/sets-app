"use client";
import { motion } from "framer-motion";

export default function EmptyState({ onImport, onNewPlan, onInstall, isStandalone }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-maroon via-brand-plum to-brand-navy flex items-center justify-center border border-brand-red/20 shadow-2xl shadow-brand-red/10">
            <span className="text-brand-red font-black text-4xl tracking-tighter" style={{ fontFamily: "var(--font-geist-sans)" }}>
              S
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            SETS
          </h1>
          <p className="text-gray-500 text-sm text-center">
            AI-powered workout plan manager
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full flex flex-col gap-3"
        >
          <button
            type="button"
            onClick={onImport}
            className="w-full bg-brand-red hover:bg-brand-maroon text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm shadow-lg shadow-brand-red/20"
          >
            Import Plan
          </button>
          <button
            type="button"
            onClick={onNewPlan}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            New Plan
          </button>
          {!isStandalone && (
            <button
              type="button"
              onClick={onInstall}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3" stroke="#F0A500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#F0A500" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Install App
            </button>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-700 text-xs text-center max-w-[240px]"
        >
          Import an existing JSON plan or create a new one with AI guidance.
        </motion.p>
      </motion.div>
    </div>
  );
}
