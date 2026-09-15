"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import MarqueeText from "./MarqueeText";
import { splitChip } from "@/lib/splits";

function timeAgo(dateStr) {
  const then = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "1 week ago";
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default function PlanStatus({ plan, sessions }) {
  const [reminderDismissed, setReminderDismissed] = useState(false);

  // Reading the clock is impure, so it happens in an effect rather than during
  // render. Re-reading on focus keeps the bar honest if the app is left open
  // across midnight.
  const [now, setNow] = useState(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    document.addEventListener("visibilitychange", tick);
    return () => document.removeEventListener("visibilitychange", tick);
  }, []);

  const stats = useMemo(() => {
    const { startDate, durationWeeks } = plan.meta;

    // Progress is time, not sessions. The app doesn't know how often the user
    // trains, so it can't hold them to a session target — see
    // docs/adr/0001-frequency-is-not-modelled.md.
    const totalDays = durationWeeks * 7;
    const start = new Date(startDate + "T12:00:00");
    const daysElapsed = now === null
      ? 0
      : Math.max(Math.floor((now - start) / MS_PER_DAY), 0);
    const progress = totalDays > 0 ? Math.min(daysElapsed / totalDays, 1) : 0;
    const currentWeek = Math.min(Math.floor(daysElapsed / 7) + 1, durationWeeks);

    // Volume is descriptive only: a tally and an observed average.
    const completed = sessions.length;
    const weeksElapsed = Math.max(daysElapsed / 7, 1 / 7);
    const perWeek = completed > 0 ? completed / weeksElapsed : 0;

    const isPlanComplete = now !== null && daysElapsed >= totalDays;
    const showReminder = isPlanComplete && !reminderDismissed;

    const lastSession = completed > 0 ? sessions[completed - 1] : null;

    return {
      completed,
      perWeek,
      progress,
      currentWeek,
      durationWeeks,
      showReminder,
      lastSession,
    };
  }, [plan, sessions, reminderDismissed, now]);

  const chip = splitChip(plan.meta.split);


  return (
    <div className="px-4 pt-3 space-y-3">
      <AnimatePresence>
        {stats.showReminder && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-brand-red text-sm font-semibold">
                  Plan complete — ready for a new challenge?
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tap the menu → New Plan when you&apos;re ready.
                </p>
              </div>
              <button
                onClick={() => setReminderDismissed(true)}
                className="text-gray-600 hover:text-gray-400 mt-0.5 shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                Week {stats.currentWeek} / {stats.durationWeeks}
              </span>
              {chip && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono truncate">
                    {chip}
                  </span>
                </>
              )}
            </div>
            <MarqueeText
              text={plan.meta.name}
              className="text-white font-bold text-base mt-0.5"
            />
            {plan.meta.edition && (
              <p className="text-gray-600 text-xs truncate">{plan.meta.edition}</p>
            )}
          </div>
          <div className="text-right ml-3 shrink-0">
            <span className="text-brand-red font-mono font-bold text-xl leading-none">
              {stats.completed}
            </span>
            <p className="text-xs text-gray-600 mt-0.5">
              {stats.completed === 1 ? "session" : "sessions"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progress * 100}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-brand-red rounded-full"
          />
        </div>

        {/* Last session */}
        <AnimatePresence>
          {stats.lastSession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">Average</span>
                  <span className="text-xs text-gray-500">
                    <span className="font-mono">{stats.perWeek.toFixed(1)}</span> / week
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono shrink-0">Last</span>
                    <span className="text-xs font-semibold text-gray-300 truncate">
                      {stats.lastSession.workoutLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0 ml-2">
                    {formatDuration(stats.lastSession.duration) && (
                      <>
                        <span className="font-mono">{formatDuration(stats.lastSession.duration)}</span>
                        <span className="text-gray-700">·</span>
                      </>
                    )}
                    <span>{timeAgo(stats.lastSession.date)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
