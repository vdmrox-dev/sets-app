"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { savePlan, clearPlan, clearSessions, saveActiveSession } from "@/lib/storage";

export default function MenuSheet({ open, onClose, onPlanLoaded, onNewPlan, hasPlan, plan }) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const plan = JSON.parse(ev.target.result);
        if (!plan.meta || !plan.days) {
          alert("Invalid plan format.");
          return;
        }
        savePlan(plan);
        onPlanLoaded(plan);
        onClose();
      } catch {
        alert("Could not parse the file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClearData() {
    if (confirm("Clear all data? This will remove your plan and all session history.")) {
      clearPlan();
      clearSessions();
      saveActiveSession(null);
      onPlanLoaded(null);
      onClose();
    }
  }

  const items = [
    {
      icon: "↑",
      label: "Import Plan",
      sublabel: "Load a JSON training plan",
      onClick: () => fileInputRef.current?.click(),
      show: true,
    },
    {
      icon: "✦",
      label: "New Plan",
      sublabel: "Generate AI instructions",
      onClick: () => { onNewPlan(); onClose(); },
      show: true,
    },
    {
      icon: "↓",
      label: "Export Plan",
      sublabel: "Download current plan as JSON",
      onClick: () => { exportPlan(); onClose(); },
      show: hasPlan,
    },
    {
      icon: "⊘",
      label: "Clear All Data",
      sublabel: "Remove plan and session history",
      onClick: handleClearData,
      show: hasPlan,
      danger: true,
    },
  ];

  function exportPlan() {
    if (!plan) return;
    const filename = `sets-${plan.meta.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-brand-plum/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-4 py-2 pb-8 space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-mono px-2 pb-2">Menu</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              {items
                .filter((item) => item.show)
                .map((item) => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.97 }}
                    onClick={item.onClick}
                    className={[
                      "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors text-left",
                      item.danger
                        ? "hover:bg-brand-red/10 active:bg-brand-red/20"
                        : "hover:bg-white/5 active:bg-white/10",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0",
                        item.danger
                          ? "bg-brand-red/20 text-brand-red"
                          : "bg-white/10 text-gray-300",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={[
                          "font-semibold text-sm",
                          item.danger ? "text-brand-red" : "text-white",
                        ].join(" ")}
                      >
                        {item.label}
                      </p>
                      <p className="text-gray-500 text-xs">{item.sublabel}</p>
                    </div>
                  </motion.button>
                ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
