"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import MarqueeText from "./MarqueeText";

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

function addWeeks(dateStr, weeks) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + Math.round(weeks * 7));
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PlanStatus({ plan, sessions }) {
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const stats = useMemo(() => {
    const { startDate, durationWeeks } = plan.meta;
    const totalSessions = durationWeeks * plan.days.length;
    const completed = sessions.length;
    const progress = totalSessions > 0 ? Math.min(completed / totalSessions, 1) : 0;

    const start = new Date(startDate + "T12:00:00");
    const originalEnd = addWeeks(startDate, durationWeeks);
    const today = new Date();

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksSinceStart = Math.max((today - start) / msPerWeek, 0.01);
    const currentWeek = Math.min(Math.floor(weeksSinceStart) + 1, durationWeeks);

    let projectedEnd = null;
    let deltaWeeks = 0;

    if (completed > 0 && weeksSinceStart > 0.5) {
      const pace = completed / weeksSinceStart;
      if (pace > 0) {
        const projectedWeeks = totalSessions / pace;
        projectedEnd = addWeeks(startDate, projectedWeeks);
        deltaWeeks = Math.round((projectedEnd - originalEnd) / msPerWeek);
      }
    }

    const isPlanComplete = completed >= totalSessions;
    const isDeadlinePassed = today > originalEnd;
    const showReminder = (isPlanComplete || isDeadlinePassed) && !reminderDismissed;

    const lastSession = sessions.length > 0
      ? sessions[sessions.length - 1]
      : null;

    return {
      totalSessions,
      completed,
      progress,
      currentWeek,
      durationWeeks,
      originalEnd,
      projectedEnd,
      deltaWeeks,
      showReminder,
      isPlanComplete,
      lastSession,
    };
  }, [plan, sessions, reminderDismissed]);

  const restLabel = plan.meta.restSeconds
    ? `${plan.meta.restSeconds}s rest`
    : null;

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
                  {stats.isPlanComplete
                    ? "Plan complete — ready for a new challenge?"
                    : "You've been on this plan a while — consider an update."}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Tap the menu → New Plan when you're ready.
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
              {restLabel && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="text-[10px] text-gray-500 font-mono">{restLabel}</span>
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
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className="text-brand-red font-mono font-bold text-xl leading-none">
                {stats.completed}
              </span>
              <span className="text-gray-600 text-sm">/{stats.totalSessions}</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">sessions</p>
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
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest font-mono">Last</span>
                  <span className="text-xs font-semibold text-gray-300">
                    {stats.lastSession.dayLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {formatDuration(stats.lastSession.duration) && (
                    <>
                      <span className="font-mono">{formatDuration(stats.lastSession.duration)}</span>
                      <span className="text-gray-700">·</span>
                    </>
                  )}
                  <span>{timeAgo(stats.lastSession.date)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deadline drift */}
        <AnimatePresence>
          {stats.projectedEnd && stats.deltaWeeks !== 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="overflow-hidden"
            >
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-gray-600">
                  Original end: {formatDate(stats.originalEnd)}
                </span>
                <span className="text-gray-700">→</span>
                <span
                  className={
                    stats.deltaWeeks > 0 ? "text-amber-400 font-semibold" : "text-emerald-400 font-semibold"
                  }
                >
                  {formatDate(stats.projectedEnd)}{" "}
                  <span className="text-xs opacity-70">
                    ({stats.deltaWeeks > 0 ? "+" : ""}{stats.deltaWeeks}w)
                  </span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
