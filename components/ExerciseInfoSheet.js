"use client";
import { motion } from "framer-motion";
import { youtubeSearchUrl, exerciseInstructions } from "@/lib/exercise";

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 ml-0.5" fill="currentColor">
      <path d="M5 3.5v9l8-4.5-8-4.5z" />
    </svg>
  );
}

export default function ExerciseInfoSheet({ exercise, onClose }) {
  const instructions = exerciseInstructions(exercise);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-brand-navy border-t border-white/10 rounded-t-2xl flex flex-col max-h-[85vh]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-white/10 shrink-0">
          <h2 className="text-white font-bold text-lg leading-tight">{exercise.name}</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-mono mt-1">
            How to perform
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Instructions */}
          {instructions.length > 0 ? (
            <ul className="space-y-2.5">
              {instructions.map((cue, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-brand-red font-mono text-xs font-bold mt-0.5 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-gray-300 text-sm leading-relaxed">{cue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm leading-relaxed">
              This plan doesn&apos;t include instructions for this exercise. Search for a
              demonstration below.
            </p>
          )}

          {/* Plan-specific note, kept visibly distinct from the instructions
              above, which describe the movement itself. */}
          {exercise.note && (
            <div className="bg-brand-red/10 border border-brand-red/25 rounded-xl p-3.5">
              <p className="text-[10px] text-brand-red uppercase tracking-widest font-mono mb-1.5">
                Note for this plan
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{exercise.note}</p>
            </div>
          )}

          {/* Video search */}
          <a
            href={youtubeSearchUrl(exercise.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl bg-brand-red/10 border border-brand-red/30 text-brand-red active:scale-[0.98] transition-transform"
          >
            <span className="w-9 h-9 rounded-full bg-brand-red/20 flex items-center justify-center shrink-0">
              <PlayIcon />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">
              Watch on YouTube
            </span>
          </a>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
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
