"use client";
import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExerciseCard from "./ExerciseCard";
import ExerciseLogDrawer from "./ExerciseLogDrawer";
import {
  isDayCompletedToday,
  addSession,
  getActiveSession,
  saveActiveSession,
  todayString,
} from "@/lib/storage";

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function WorkoutView({ plan, sessions, onSessionComplete }) {
  const [activeTab, setActiveTab] = useState(plan.days[0]?.id ?? "");
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [showFinishAnimation, setShowFinishAnimation] = useState(false);
  const [openExercise, setOpenExercise] = useState(null);
  const timerRef = useRef(null);
  const [finishedDuration, setFinishedDuration] = useState(0);

  // Restore active session from storage on mount
  useEffect(() => {
    const stored = getActiveSession();
    if (stored) {
      startTransition(() => {
        setActiveSession(stored);
        setActiveTab(stored.dayId);
        setElapsed(Math.floor((Date.now() - stored.startTime) / 1000));
      });
    }
  }, []);

  // Timer tick
  useEffect(() => {
    if (activeSession) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  // Re-sync elapsed from startTime when the PWA returns to foreground.
  // Mobile browsers throttle/pause setInterval in the background, so the
  // interval-based counter drifts. visibilitychange fires reliably when the
  // user switches back, giving us a chance to correct elapsed from the
  // authoritative startTime timestamp.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && activeSession) {
        setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeSession]);

  const currentDay = plan.days.find((d) => d.id === activeTab);
  const isCurrentDaySession = activeSession?.dayId === activeTab;
  const isDoneToday = !activeSession && isDayCompletedToday(activeTab);

  function startSession() {
    const session = {
      dayId: activeTab,
      dayLabel: currentDay?.label ?? activeTab,
      startTime: Date.now(),
      checked: [],
      setLogs: {},
    };
    setActiveSession(session);
    saveActiveSession(session);
    setElapsed(0);
  }

  function handleSaveLog(exerciseName, rows) {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const checked = prev.checked.includes(exerciseName)
        ? prev.checked
        : [...prev.checked, exerciseName];
      const updated = {
        ...prev,
        checked,
        setLogs: { ...(prev.setLogs || {}), [exerciseName]: rows },
      };
      saveActiveSession(updated);
      return updated;
    });
    setOpenExercise(null);
  }

  const finishSession = useCallback(() => {
    if (!activeSession) return;
    // Derive duration from startTime rather than the elapsed counter so that
    // any time spent with the app backgrounded (where setInterval was throttled)
    // is correctly included in the final total.
    const finalDuration = Math.floor((Date.now() - activeSession.startTime) / 1000);
    setFinishedDuration(finalDuration);
    const session = {
      id: `${Date.now()}`,
      date: todayString(),
      dayId: activeSession.dayId,
      dayLabel: activeSession.dayLabel,
      duration: finalDuration,
      completedExercises: activeSession.checked,
      setLogs: activeSession.setLogs || {},
    };
    const newSessions = addSession(session);
    saveActiveSession(null);
    setActiveSession(null);
    setElapsed(0);
    setShowFinishAnimation(true);
    setTimeout(() => {
      setShowFinishAnimation(false);
      onSessionComplete(newSessions);
    }, 2200);
  }, [activeSession, onSessionComplete]);

  return (
    <div className="flex flex-col flex-1 relative pb-28">
      {/* Active session timer banner */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden bg-brand-red/10 border-b border-brand-red/20"
          >
            <div className="flex items-center justify-between px-5 py-2.5">
              <div className="flex items-center gap-2.5">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-brand-red"
                />
                <span className="text-xs font-semibold text-brand-red uppercase tracking-wider">
                  {activeSession.dayLabel} in progress
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-brand-red tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day tabs */}
      <div className="flex border-b border-white/10 sticky top-0 bg-brand-navy/95 backdrop-blur-xl z-10">
        {plan.days.map((day) => {
          const done = !activeSession && isDayCompletedToday(day.id);
          const isActive = activeTab === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setActiveTab(day.id)}
              className={[
                "flex-1 py-3.5 text-xs font-bold uppercase tracking-widest transition-all relative px-2 min-w-0",
                isActive ? "text-brand-red" : "text-gray-500 hover:text-gray-300",
              ].join(" ")}
            >
              <span className="block truncate">
                {day.label}
                {done && <span className="ml-1 text-emerald-500">✓</span>}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red rounded-t-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Exercise list */}
      <div className="px-4 pt-4 space-y-3 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {currentDay?.exercises?.map((exercise, i) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                index={i}
                isSession={isCurrentDaySession}
                isDone={
                  isCurrentDaySession &&
                  activeSession.checked.includes(exercise.name)
                }
                onOpen={() => setOpenExercise(exercise)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-navy/90 backdrop-blur-xl border-t border-white/10 z-20 flex justify-center">
        <div className="w-full max-w-lg">
          {isDoneToday ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs overflow-hidden px-4"
            >
              <span className="truncate">{currentDay?.label}</span>
              <span className="shrink-0">done today ✓</span>
            </motion.div>
          ) : activeSession && isCurrentDaySession ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={finishSession}
              className="w-full bg-brand-red text-white font-bold py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-brand-red/30"
            >
              Finish Workout
            </motion.button>
          ) : activeSession && !isCurrentDaySession ? (
            <div className="w-full bg-white/5 border border-white/10 text-gray-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest text-xs overflow-hidden px-4">
              <span className="shrink-0">Session active on</span>
              <span className="truncate">{activeSession.dayLabel}</span>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={startSession}
              className="w-full bg-brand-red hover:bg-brand-maroon text-white font-bold py-4 rounded-2xl transition-colors uppercase tracking-widest text-sm shadow-lg shadow-brand-red/20 flex items-center justify-center gap-2 overflow-hidden"
            >
              <span className="shrink-0">Start</span>
              <span className="truncate">{currentDay?.label}</span>
              <span className="shrink-0">Workout</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Exercise log drawer */}
      <AnimatePresence>
        {openExercise && activeSession && (
          <ExerciseLogDrawer
            exercise={openExercise}
            existingLog={activeSession.setLogs?.[openExercise.name] ?? null}
            onSave={(rows) => handleSaveLog(openExercise.name, rows)}
            onClose={() => setOpenExercise(null)}
          />
        )}
      </AnimatePresence>

      {/* Finish animation overlay */}
      <AnimatePresence>
        {showFinishAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/95 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-brand-red/20 border-2 border-brand-red flex items-center justify-center"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewBox="0 0 40 30"
                  className="w-12 h-9"
                  fill="none"
                >
                  <motion.path
                    d="M2 16l10 10L38 2"
                    stroke="#FF204E"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  />
                </motion.svg>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <p className="text-white font-black text-2xl tracking-tight">Session done.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Logged in {formatTime(finishedDuration)}
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
