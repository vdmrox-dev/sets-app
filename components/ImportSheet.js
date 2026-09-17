"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { startNewPlan } from "@/lib/storage";
import { extractPlanFromText, parsePlanJson } from "@/lib/parsePlan";

function quotaMessage(err) {
  if (err?.name === "QuotaExceededError" || err?.code === 22 || err?.code === 1014) {
    return "This plan is too large to save on this device. Try a shorter file, or clear site data.";
  }
  return null;
}

function importErrorMessage(err) {
  return quotaMessage(err) || err?.message || "Couldn't import that plan.";
}

export default function ImportSheet({ onClose, onPlanLoaded }) {
  const [mode, setMode] = useState("choose");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  function commit(plan) {
    onPlanLoaded(startNewPlan(plan));
    onClose();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        commit(parsePlanJson(ev.target.result));
      } catch (err) {
        setError(importErrorMessage(err));
      }
    };
    reader.readAsText(file);
  }

  function handlePaste() {
    setError(null);
    try {
      commit(extractPlanFromText(pasteValue));
    } catch (err) {
      const quota = quotaMessage(err);
      setError(
        quota ||
          (err?.message && err.message !== "No JSON found"
            ? err.message
            : "Couldn't find a valid plan in your text. Paste the JSON — wrapping markdown is fine.")
      );
    }
  }

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="fixed inset-0 z-50 bg-brand-navy flex flex-col"
    >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="border-b border-white/10">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">Import Plan</h2>
                <p className="text-xs text-gray-500">
                  {mode === "paste"
                    ? "Paste JSON — wrapping markdown is fine"
                    : "Load a file or paste JSON"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {mode === "choose" ? (
              <div className="max-w-lg mx-auto w-full space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    fileInputRef.current?.click();
                  }}
                  className="w-full bg-brand-red hover:bg-brand-maroon text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm shadow-lg shadow-brand-red/20"
                >
                  From File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("paste");
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                >
                  Paste JSON
                </button>
                {error && <ErrorNote>{error}</ErrorNote>}
              </div>
            ) : (
              <div className="max-w-lg mx-auto w-full space-y-4">
                <textarea
                  value={pasteValue}
                  onChange={(e) => {
                    setPasteValue(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste the plan JSON here..."
                  rows={12}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm font-mono focus:outline-none focus:border-brand-red/50 resize-none placeholder-gray-700"
                  autoFocus
                />
                {error && <ErrorNote>{error}</ErrorNote>}
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={!pasteValue.trim()}
                  className={[
                    "w-full font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm",
                    pasteValue.trim()
                      ? "bg-brand-red hover:bg-brand-maroon text-white shadow-lg shadow-brand-red/20"
                      : "bg-white/10 text-gray-600 cursor-not-allowed",
                  ].join(" ")}
                >
                  Import Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    setError(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 text-gray-400 font-semibold py-3 rounded-2xl text-sm"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
    </motion.div>
  );
}

function ErrorNote({ children }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-brand-red text-xs bg-brand-red/10 border border-brand-red/20 rounded-xl px-4 py-3"
    >
      {children}
    </motion.p>
  );
}
