"use client";
import { motion } from "framer-motion";

export default function ExerciseCard({ exercise, index, isSession, isDone, onOpen }) {
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
