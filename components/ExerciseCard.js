"use client";
import { motion } from "framer-motion";

function InfoIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.25v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function ExerciseCard({ exercise, index, isSession, isDone, onOpen, onOpenInfo }) {
  const repsLabel = exercise.perSetReps
    ? exercise.perSetReps.join(", ")
    : exercise.repsMin === exercise.repsMax
      ? String(exercise.repsMin)
      : `${exercise.repsMin}–${exercise.repsMax}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      onClick={isSession ? onOpen : undefined}
      className={[
        "relative p-4 rounded-xl border transition-all select-none",
        "bg-brand-plum/20 border-brand-plum/40",
        isSession ? "cursor-pointer active:scale-[0.98]" : "",
        isDone ? "opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transition: "opacity 0.2s, transform 0.1s" }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
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

          <p className="text-brand-red text-sm font-mono font-bold mt-1">
            {exercise.sets} × {repsLabel}
          </p>
        </div>

        {/* Sits on every card in the same place, session or not. Stops the
            click so it never doubles as "log my sets". */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInfo?.();
          }}
          aria-label={`How to perform ${exercise.name}`}
          className="w-8 h-8 -mt-1 -mr-1 rounded-full flex items-center justify-center text-gray-600 hover:text-brand-red active:scale-90 transition-all shrink-0"
        >
          <InfoIcon />
        </button>
      </div>

      {isSession && (
        <p
          className={[
            "text-xs mt-1.5 font-semibold",
            isDone ? "text-emerald-500" : "text-gray-600",
          ].join(" ")}
        >
          {isDone ? "✓ Done" : "Pending"}
        </p>
      )}
    </motion.div>
  );
}
