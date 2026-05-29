"use client";
import { useState, useEffect, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlan, getSessions } from "@/lib/storage";
import EmptyState from "@/components/EmptyState";
import WorkoutView from "@/components/WorkoutView";
import PlanStatus from "@/components/PlanStatus";
import MenuSheet from "@/components/MenuSheet";
import NewPlanForm from "@/components/NewPlanForm";
import InstallSheet, { useInstallState } from "@/components/InstallPrompt";

export default function Home() {
  const [plan, setPlan] = useState(undefined); // undefined = loading
  const [sessions, setSessions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const { deferredPrompt, showButton: showInstallButton, ios, dismiss: dismissInstall } = useInstallState();
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    startTransition(() => {
      setPlan(getPlan());
      setSessions(getSessions());
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
      );
    });
  }, []);

  function handlePlanLoaded(newPlan) {
    setPlan(newPlan);
    setSessions(getSessions());
  }

  function handleSessionComplete(newSessions) {
    setSessions(newSessions);
  }

  // Loading state — prevents hydration flash
  if (plan === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-brand-red font-black text-3xl tracking-tighter"
        >
          SETS
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* App shell */}
      <AnimatePresence mode="wait">
        {!plan ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              onPlanLoaded={handlePlanLoaded}
              onNewPlan={() => setShowNewPlan(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header */}
            <header className="sticky top-0 z-30 bg-brand-navy/90 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto w-full">
                <div>
                  <h1 className="text-lg font-black tracking-tighter text-white">
                    SETS
                  </h1>
                  <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest -mt-0.5">
                    Workout Manager
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {showInstallButton && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setShowInstall(true)}
                        className="w-9 h-9 rounded-xl bg-brand-red/15 hover:bg-brand-red/25 border border-brand-red/30 flex items-center justify-center transition-colors"
                        aria-label="Install app"
                        title="Install SETS"
                      >
                        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                          <path d="M8 2v8M5 7l3 3 3-3" stroke="#F0A500" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 11v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="#F0A500" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => setMenuOpen(true)}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                    aria-label="Open menu"
                  >
                    <svg viewBox="0 0 16 12" className="w-4 h-4" fill="none">
                      <line x1="0" y1="1" x2="16" y2="1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="0" y1="6" x2="12" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="0" y1="11" x2="16" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            {/* Plan status */}
            <PlanStatus plan={plan} sessions={sessions} />

            {/* Workout view */}
            <WorkoutView
              plan={plan}
              sessions={sessions}
              onSessionComplete={handleSessionComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu sheet */}
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onPlanLoaded={handlePlanLoaded}
        onNewPlan={() => setShowNewPlan(true)}
        hasPlan={!!plan}
        plan={plan}
        showInstallOption={!isStandalone}
        onInstall={() => setShowInstall(true)}
      />

      {/* New Plan form */}
      <AnimatePresence>
        {showNewPlan && (
          <NewPlanForm
            onClose={() => setShowNewPlan(false)}
            onPlanLoaded={(plan) => { handlePlanLoaded(plan); setShowNewPlan(false); }}
          />
        )}
      </AnimatePresence>

      {/* Install sheet */}
      <InstallSheet
        open={showInstall}
        onClose={() => { setShowInstall(false); dismissInstall(); }}
        deferredPrompt={deferredPrompt}
        ios={ios}
      />
    </>
  );
}
