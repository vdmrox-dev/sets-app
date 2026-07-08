"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { savePlan, clearPlan, clearSessions, saveActiveSession } from "@/lib/storage";

export default function MenuSheet({ open, onClose, onPlanLoaded, onNewPlan, onEditPlan, hasPlan, plan, onInstall, showInstallOption }) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target.result);
        if (!loaded.meta || !loaded.days) {
          alert("Invalid plan format.");
          return;
        }
        savePlan(loaded);
        onPlanLoaded(loaded);
        onClose();
      } catch {
        alert("Could not parse the file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleNewPlan() {
    onNewPlan();
    onClose();
  }

  function handleEditPlan() {
    onEditPlan?.();
    onClose();
  }

  function handleExport() {
    if (!plan) return;
    const filename = `sets-${plan.meta.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  }

  function handleInstall() {
    onInstall?.();
    onClose();
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

  return (
    <>
      {/* File input is always mounted so its ref is never accessed during render */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

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
              className="fixed bottom-0 left-0 right-0 z-50 bg-brand-plum/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10 pb-safe"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="px-4 py-2 pb-8 space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-mono px-2 pb-2">Menu</p>

                <MenuItem icon="↑" label="Import Plan" sublabel="Load a JSON training plan" onClick={handleImport} />
                <MenuItem icon="✦" label="New Plan" sublabel="Generate with AI or build manually" onClick={handleNewPlan} />
                {hasPlan && <MenuItem icon="✎" label="Edit Current Plan" sublabel="Modify days and exercises" onClick={handleEditPlan} />}
                {hasPlan && <MenuItem icon="↓" label="Export Plan" sublabel="Download current plan as JSON" onClick={handleExport} />}
                {showInstallOption && <MenuItem icon="⬇" label="Install App" sublabel="Add SETS to your home screen" onClick={handleInstall} />}
                {hasPlan && <MenuItem icon="⊘" label="Clear All Data" sublabel="Remove plan and session history" onClick={handleClearData} danger />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuItem({ icon, label, sublabel, onClick, danger = false }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={[
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors text-left",
        danger ? "hover:bg-brand-red/10 active:bg-brand-red/20" : "hover:bg-white/5 active:bg-white/10",
      ].join(" ")}
    >
      <span className={[
        "w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0",
        danger ? "bg-brand-red/20 text-brand-red" : "bg-white/10 text-gray-300",
      ].join(" ")}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={["font-semibold text-sm", danger ? "text-brand-red" : "text-white"].join(" ")}>
          {label}
        </p>
        <p className="text-gray-500 text-xs">{sublabel}</p>
      </div>
    </motion.button>
  );
}
