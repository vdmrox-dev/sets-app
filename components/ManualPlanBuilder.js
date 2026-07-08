"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { savePlan, todayString } from "@/lib/storage";

function Stepper({ value, onChange, min = 1, max = 30 }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xl leading-none active:scale-90 transition-transform select-none"
      >
        −
      </button>
      <span className="text-white font-mono font-bold w-7 text-center tabular-nums text-base">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-xl leading-none active:scale-90 transition-transform select-none"
      >
        +
      </button>
    </div>
  );
}

export default function ManualPlanBuilder({ onPlanSaved, hasPlan }) {
  const [planName, setPlanName] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [days, setDays] = useState([]);
  const [newDayName, setNewDayName] = useState("");

  const [formDayId, setFormDayId] = useState(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState([10, 10, 10]);

  const [showConfirm, setShowConfirm] = useState(false);

  function addDay() {
    const label = newDayName.trim();
    if (!label) return;
    const id = `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setDays((prev) => [...prev, { id, label, exercises: [] }]);
    setNewDayName("");
  }

  function removeDay(dayId) {
    setDays((prev) => prev.filter((d) => d.id !== dayId));
    if (formDayId === dayId) resetForm();
  }

  function openForm(dayId) {
    setFormDayId(dayId);
    setExName("");
    setExSets(3);
    setExReps([10, 10, 10]);
  }

  function resetForm() {
    setFormDayId(null);
    setExName("");
    setExSets(3);
    setExReps([10, 10, 10]);
  }

  function updateSets(n) {
    setExSets(n);
    setExReps((prev) => {
      if (n > prev.length) {
        const last = prev[prev.length - 1] ?? 10;
        return [...prev, ...Array(n - prev.length).fill(last)];
      }
      return prev.slice(0, n);
    });
  }

  function addExercise() {
    if (!exName.trim() || !formDayId) return;
    const exercise = { name: exName.trim(), sets: exSets, perSetReps: [...exReps] };
    setDays((prev) =>
      prev.map((d) =>
        d.id === formDayId ? { ...d, exercises: [...d.exercises, exercise] } : d
      )
    );
    setExName("");
    setExSets(3);
    setExReps([10, 10, 10]);
  }

  function removeExercise(dayId, idx) {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((_, i) => i !== idx) } : d
      )
    );
  }

  function handleSave() {
    if (hasPlan) {
      setShowConfirm(true);
    } else {
      doSave();
    }
  }

  function doSave() {
    const plan = {
      meta: {
        name: planName.trim(),
        edition: "Custom",
        startDate: todayString(),
        durationWeeks,
      },
      days: days.map((d) => ({ id: d.id, label: d.label, exercises: d.exercises })),
    };
    savePlan(plan);
    onPlanSaved(plan);
  }

  const canSave = planName.trim().length > 0 && days.length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-4">

        {/* Plan name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">Plan Name</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Push Pull Legs"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
          />
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">Duration</label>
          <div className="flex items-center gap-4">
            <Stepper value={durationWeeks} onChange={setDurationWeeks} min={1} max={52} />
            <span className="text-gray-400 text-sm">weeks</span>
          </div>
        </div>

        {/* Day cards */}
        {days.length > 0 && (
          <div className="space-y-4">
            {days.map((day) => (
              <motion.div
                key={day.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Day header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <span className="text-white font-bold text-sm uppercase tracking-widest">
                    {day.label}
                  </span>
                  <button
                    onClick={() => removeDay(day.id)}
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Exercise list */}
                {day.exercises.length > 0 && (
                  <div className="divide-y divide-white/5">
                    {day.exercises.map((ex, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-100 text-sm font-semibold truncate">{ex.name}</p>
                          <p className="text-brand-red text-xs font-mono font-bold mt-0.5">
                            {ex.sets} × {ex.perSetReps.join(", ")}
                          </p>
                        </div>
                        <button
                          onClick={() => removeExercise(day.id, idx)}
                          className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs ml-3 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exercise form or Add button */}
                <AnimatePresence mode="wait">
                  {formDayId === day.id ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-4 py-4 space-y-4 border-t border-white/10"
                    >
                      <input
                        type="text"
                        value={exName}
                        onChange={(e) => setExName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addExercise()}
                        placeholder="Exercise name, e.g. Bench Press"
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
                      />

                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                          Sets
                        </p>
                        <Stepper value={exSets} onChange={updateSets} min={1} max={10} />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                          Reps per set
                        </p>
                        <div className="space-y-2.5">
                          {exReps.map((reps, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-gray-600 text-xs w-10 shrink-0 font-mono">
                                Set {i + 1}
                              </span>
                              <Stepper
                                value={reps}
                                onChange={(val) =>
                                  setExReps((prev) =>
                                    prev.map((r, idx) => (idx === i ? val : r))
                                  )
                                }
                                min={1}
                                max={50}
                              />
                              <span className="text-gray-600 text-xs">reps</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={resetForm}
                          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold active:scale-95 transition-transform"
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={addExercise}
                          disabled={!exName.trim()}
                          className={[
                            "flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors",
                            exName.trim()
                              ? "bg-brand-red text-white"
                              : "bg-white/10 text-gray-600 cursor-not-allowed",
                          ].join(" ")}
                        >
                          Add Exercise
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => openForm(day.id)}
                      className="w-full px-4 py-3 text-left text-brand-red text-sm font-semibold flex items-center gap-2 border-t border-white/10 hover:bg-white/5 transition-colors active:bg-white/10"
                    >
                      <span className="text-lg leading-none">+</span>
                      <span>Add Exercise</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add day */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">
            {days.length === 0 ? "Add your first training day" : "Add another day"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDay()}
              placeholder="e.g. Push, Legs, Upper…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
            />
            <button
              onClick={addDay}
              disabled={!newDayName.trim()}
              className={[
                "px-4 py-3 rounded-xl text-sm font-bold transition-colors shrink-0",
                newDayName.trim()
                  ? "bg-brand-red text-white active:scale-95"
                  : "bg-white/10 text-gray-600 cursor-not-allowed",
              ].join(" ")}
            >
              Add Day
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-4 border-t border-white/10 bg-brand-navy/90 backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {showConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-center text-sm text-gray-400">
                This will replace your current plan. Continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={doSave}
                  className="flex-1 py-3.5 rounded-2xl bg-brand-red text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-brand-red/30"
                >
                  Replace
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="save"
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!canSave}
              className={[
                "w-full font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-sm",
                canSave
                  ? "bg-brand-red text-white shadow-lg shadow-brand-red/20 active:scale-[0.97]"
                  : "bg-white/10 text-gray-600 cursor-not-allowed",
              ].join(" ")}
            >
              Save Plan
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
