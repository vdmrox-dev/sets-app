"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import MarqueeText from "./MarqueeText";
import RecentSessionsSheet from "./RecentSessionsSheet";
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

export default function PlanStatus({ plan, sessions, onDeleteSession }) {
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

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

    // Volume is a tally, not a rate. A weekly pace would extrapolate from
    // whatever time has elapsed — one Session on day one reads as 7/week —
    // and there is no frequency target to compare it to.
    const completed = sessions.length;

    const isPlanComplete = now !== null && daysElapsed >= totalDays;
    const showReminder = isPlanComplete && !reminderDismissed;

    const lastSession = completed > 0 ? sessions[completed - 1] : null;

    return {
      completed,
      progress,
      currentWeek,
      durationWeeks,
      showReminder,
      lastSession,
    };
  }, [plan, sessions, reminderDismissed, now]);

  const chip = splitChip(plan.meta.split);

  // The Last row is gone once nothing remains to list, so drop the sheet
  // rather than leave it empty. Adjust during render so we don't cascade
  // an extra effect pass.
  if (showRecent && sessions.length === 0) {
    setShowRecent(false);
  }


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
              <div className="mt-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRecent(true)}
                  aria-label="Recent logs"
                  className="w-full flex items-center gap-3 text-left py-1 active:opacity-70 transition-opacity"
                >
                  <span
                    aria-hidden="true"
                    className="w-8 h-8 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0"
                  >
                    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                      <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
                      <path
                        d="M8 5.25v3.1l2.1 1.4"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-200 truncate leading-tight">
                      Last: {stats.lastSession.workoutLabel}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                      {formatDuration(stats.lastSession.duration) && (
                        <>
                          <span className="font-mono text-gray-400">
                            {formatDuration(stats.lastSession.duration)}
                          </span>
                          <span className="text-gray-700"> · </span>
                        </>
                      )}
                      {timeAgo(stats.lastSession.date)}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5 shrink-0 text-[10px] uppercase tracking-widest font-mono text-gray-500">
                    Recent logs
                    <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="none" aria-hidden="true">
                      <path
                        d="M6 3.5 11 8l-5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showRecent && (
          <RecentSessionsSheet
            sessions={sessions}
            onClose={() => setShowRecent(false)}
            onDeleteSession={onDeleteSession}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
