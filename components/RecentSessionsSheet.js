"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { retractableSessions } from "@/lib/sessionLog";

function timeAgo(dateStr) {
  const then = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diffDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));
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

export default function RecentSessionsSheet({ sessions, onClose, onDeleteSession }) {
  const recent = retractableSessions(sessions);
  const [pendingId, setPendingId] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-brand-navy border-t border-white/10 rounded-t-2xl flex flex-col max-h-[85vh]"
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-2 pb-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-bold text-lg leading-tight">Recent sessions</h2>
          <p className="text-gray-500 text-xs mt-1">
            {recent.length === 0
              ? "Nothing here can be removed."
              : recent.length === 1
                ? "This session can be removed. Older history stays."
                : `The last ${recent.length} sessions can be removed. Older history stays.`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {recent.map((session) => {
            const pending = pendingId === session.id;
            const duration = formatDuration(session.duration);
            return (
              <div
                key={session.id}
                className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-200 truncate">
                      {session.workoutLabel || "Workout"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {duration && (
                        <>
                          <span className="font-mono">{duration}</span>
                          <span className="text-gray-700"> · </span>
                        </>
                      )}
                      <span>{timeAgo(session.date)}</span>
                    </p>
                  </div>
                  {!pending && (
                    <button
                      type="button"
                      onClick={() => setPendingId(session.id)}
                      aria-label={`Delete ${session.workoutLabel || "session"}`}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-brand-maroon active:scale-90 transition-all shrink-0"
                    >
                      ×
                    </button>
                  )}
                </div>

                {pending && (
                  <div className="px-3.5 pb-3 space-y-2.5">
                    <p className="text-xs text-gray-400">
                      Delete this session? Its logged sets will be lost and it will
                      stop counting toward your totals.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPendingId(null)}
                        className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingId(null);
                          onDeleteSession?.(session.id);
                        }}
                        className="flex-1 py-2 rounded-lg bg-brand-maroon/20 border border-brand-maroon/40 text-brand-maroon text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest active:scale-[0.97] transition-transform"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
