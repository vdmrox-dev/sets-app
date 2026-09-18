"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { serializeLogRows } from "@/lib/sessionLog";

function emptyRow(exercise, index) {
  return {
    weight: "",
    reps: String(exercise.perSetReps?.[index] ?? exercise.repsMax ?? 10),
    done: false,
  };
}

export default function ExerciseLogDrawer({
  exercise,
  existingLog,
  previousLog,
  onDraft,
  onRestStart,
  onClose,
}) {
  const initRows = () => {
    if (existingLog && existingLog.length > 0) {
      return existingLog.map((r, i) => ({
        weight: r.weight != null ? String(r.weight) : "",
        reps: r.reps != null
          ? String(r.reps)
          : String(exercise.perSetReps?.[i] ?? exercise.repsMax ?? 10),
        done: !!r.done,
      }));
    }
    const source = previousLog && previousLog.length > 0 ? previousLog : null;
    if (source) {
      return source.map((r, i) => ({
        weight: r.weight != null ? String(r.weight) : "",
        reps: r.reps != null
          ? String(r.reps)
          : String(exercise.perSetReps?.[i] ?? exercise.repsMax ?? 10),
        done: false,
      }));
    }
    return Array.from({ length: exercise.sets }, (_, i) => emptyRow(exercise, i));
  };

  const [rows, setRows] = useState(initRows);

  const repsLabel = exercise.perSetReps
    ? exercise.perSetReps.join(", ")
    : exercise.repsMin === exercise.repsMax
    ? String(exercise.repsMin)
    : `${exercise.repsMin}–${exercise.repsMax}`;

  function commit(next) {
    setRows(next);
    onDraft?.(serializeLogRows(next));
  }

  function updateRow(i, field, value) {
    commit(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  function toggleDone(i) {
    const turningOn = !rows[i].done;
    commit(rows.map((r, idx) => (idx === i ? { ...r, done: !r.done } : r)));
    if (turningOn) onRestStart?.();
  }

  function addRow() {
    commit([...rows, emptyRow(exercise, rows.length)]);
  }

  function handleClose() {
    onDraft?.(serializeLogRows(rows));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
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
          <h2 className="text-white font-bold text-lg leading-tight">{exercise.name}</h2>
          <p className="text-brand-red font-mono text-sm font-bold mt-0.5">
            {exercise.sets} × {repsLabel}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-gray-600 text-xs font-bold uppercase tracking-wider w-10 shrink-0">
                Set {i + 1}
              </span>

              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={row.weight}
                  onChange={(e) => updateRow(i, "weight", e.target.value)}
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-mono text-center focus:outline-none focus:border-brand-red/50 transition-colors"
                />
                <span className="text-gray-500 text-xs shrink-0">kg</span>
              </div>

              <span className="text-gray-600 text-sm shrink-0">×</span>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={String(exercise.perSetReps?.[i] ?? exercise.repsMax ?? 10)}
                  value={row.reps}
                  onChange={(e) => updateRow(i, "reps", e.target.value)}
                  className="w-14 bg-white/5 border border-white/10 rounded-xl px-2 py-2.5 text-white text-sm font-mono text-center focus:outline-none focus:border-brand-red/50 transition-colors"
                />
                <span className="text-gray-500 text-xs shrink-0">reps</span>
              </div>

              <button
                type="button"
                onClick={() => toggleDone(i)}
                aria-pressed={row.done}
                aria-label={row.done ? `Set ${i + 1} done` : `Mark set ${i + 1} done`}
                className={[
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 active:scale-90 transition-all",
                  row.done
                    ? "bg-brand-red/20 border border-brand-red/40 text-brand-red"
                    : "bg-white/5 border border-white/15 text-gray-600",
                ].join(" ")}
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" aria-hidden="true">
                  <path
                    d="M3 8.5 6.5 12 13 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={addRow}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
                <path
                  d="M8 3v10M3 8h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest active:scale-[0.97] transition-transform"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
