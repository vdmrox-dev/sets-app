"use client";
import { motion } from "framer-motion";

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M8 2.5 14.5 13.5H1.5L8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3.25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.75" r="0.7" fill="currentColor" />
    </svg>
  );
}

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400 shrink-0"
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path
          d="M6 3.5 11 8l-5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function ExerciseCard({ exercise, index, isSession, isDone, onOpen, onOpenInfo }) {
  const repsLabel = exercise.perSetReps
    ? exercise.perSetReps.join(", ")
    : exercise.repsMin === exercise.repsMax
      ? String(exercise.repsMin)
      : `${exercise.repsMin}–${exercise.repsMax}`;

  const title = (
    <h3
      className={[
        "font-bold leading-snug text-gray-100",
        isDone ? "line-through" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {exercise.name}
    </h3>
  );

  const prescription = (
    <p className="text-brand-red text-sm font-mono font-bold mt-1">
      {exercise.sets} × {repsLabel}
    </p>
  );

  const status = isSession && (
    isDone ? (
      <p className="text-xs mt-1.5 font-semibold text-emerald-500">✓ Done</p>
    ) : (
      <p className="text-xs mt-1.5 font-semibold text-gray-600 flex items-center gap-1.5">
        <WarningIcon />
        Pending
      </p>
    )
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      className={[
        "relative rounded-xl border p-3 select-none",
        "bg-brand-plum/20 border-brand-plum/40",
        isDone ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transition: "opacity 0.2s" }}
    >
      {isSession ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Log sets for ${exercise.name}`}
          className="w-full flex items-center gap-3 text-left px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 active:scale-[0.98] transition-transform"
        >
          <div className="min-w-0 flex-1">
            {title}
            {prescription}
            {status}
          </div>
          <Chevron />
        </button>
      ) : (
        <div className="px-1 py-1">
          {title}
          {prescription}
        </div>
      )}

      {/* Secondary to logging. Not a bar, so it doesn't read as the main tap. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenInfo?.();
        }}
        aria-label={`How to perform ${exercise.name}`}
        className="mt-1.5 px-1 py-1.5 text-[10px] uppercase tracking-[0.18em] font-mono text-gray-500 active:text-gray-300 transition-colors"
      >
        How to
      </button>
    </motion.div>
  );
}
