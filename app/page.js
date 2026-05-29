"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlan, getSessions } from "@/lib/storage";
import EmptyState from "@/components/EmptyState";
import WorkoutView from "@/components/WorkoutView";
import PlanStatus from "@/components/PlanStatus";
import MenuSheet from "@/components/MenuSheet";
import NewPlanForm from "@/components/NewPlanForm";

export default function Home() {
  const [plan, setPlan] = useState(undefined); // undefined = loading
  const [sessions, setSessions] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setPlan(getPlan());
    setSessions(getSessions());
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
    </>
  );
}
