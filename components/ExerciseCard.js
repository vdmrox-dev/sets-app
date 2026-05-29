"use client";
import { motion, AnimatePresence } from "framer-motion";

export default function ExerciseCard({ exercise, index, isSession, isChecked, onToggle }) {
  const repsLabel =
    exercise.repsMin === exercise.repsMax
      ? String(exercise.repsMin)
      : `${exercise.repsMin}–${exercise.repsMax}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
      onClick={isSession ? onToggle : undefined}
      className={[
        "relative p-4 rounded-xl border transition-colors select-none",
        exercise.highlight
          ? "bg-brand-maroon/15 border-brand-red/40"
          : "bg-brand-plum/20 border-brand-plum/40",
        isSession ? "cursor-pointer active:scale-[0.98]" : "",
        isChecked ? "opacity-40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transition: "opacity 0.2s, transform 0.1s" }}
    >
      {/* Session checkbox */}
      {isSession && (
        <div
          className={[
            "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
            isChecked
              ? "bg-brand-red border-brand-red"
              : "border-gray-600",
          ].join(" ")}
        >
          <AnimatePresence>
            {isChecked && (
              <motion.svg
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                viewBox="0 0 10 8"
                className="w-3 h-3"
                fill="none"
              >
                <path
                  d="M1 4l2.5 2.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>
      )}

      <h3
        className={[
          "font-bold leading-snug",
          exercise.highlight ? "text-brand-red" : "text-gray-100",
          isChecked ? "line-through" : "",
          isSession ? "pr-8" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {exercise.name}
      </h3>

      <p className="text-brand-red text-sm font-mono font-bold mt-1">
        {exercise.sets} × {repsLabel}
      </p>

      {exercise.note && !isChecked && (
        <p className="mt-1.5 text-gray-500 text-xs leading-relaxed">
          {exercise.note}
        </p>
      )}
    </motion.div>
  );
}
