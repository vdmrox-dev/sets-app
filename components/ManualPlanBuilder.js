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

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 14 12" className="w-3.5 h-3 " fill="none">
      <path d="M1 6l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function planToBuilderDays(plan) {
  if (!plan) return [];
  return plan.days.map((day) => ({
    id: day.id,
    label: day.label,
    exercises: day.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      perSetReps: ex.perSetReps ?? Array(ex.sets).fill(ex.repsMax ?? 10),
    })),
  }));
}

export default function ManualPlanBuilder({ onPlanSaved, hasPlan, initialPlan, isEditing = false }) {
  const [planName, setPlanName] = useState(initialPlan?.meta?.name ?? "");
  const [durationWeeks, setDurationWeeks] = useState(initialPlan?.meta?.durationWeeks ?? 8);
  const [days, setDays] = useState(() => planToBuilderDays(initialPlan));
  const [newDayName, setNewDayName] = useState("");

  // Add / edit form — shared fields
  // formDayId: which day's add form is open (null = none)
  // editIdx: index of exercise being edited (null = add mode)
  const [formDayId, setFormDayId] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState([10, 10, 10]);

  // Day label inline editing
  const [editingDayId, setEditingDayId] = useState(null);
  const [editDayName, setEditDayName] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);

  // Pending inline delete confirmation: null | { type: 'day', dayId } | { type: 'exercise', dayId, idx }
  const [pendingDelete, setPendingDelete] = useState(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "day") {
      removeDay(pendingDelete.dayId);
    } else {
      removeExercise(pendingDelete.dayId, pendingDelete.idx);
    }
    setPendingDelete(null);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  // ── Days ────────────────────────────────────────────────────────────────────

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
    if (editingDayId === dayId) setEditingDayId(null);
  }

  function startEditDayLabel(dayId, currentLabel) {
    setEditingDayId(dayId);
    setEditDayName(currentLabel);
  }

  function saveDayLabel(dayId) {
    const label = editDayName.trim();
    if (!label) return;
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, label } : d)));
    setEditingDayId(null);
    setEditDayName("");
  }

  // ── Exercise form ────────────────────────────────────────────────────────────

  function openAddForm(dayId) {
    setPendingDelete(null);
    setFormDayId(dayId);
    setEditIdx(null);
    setExName("");
    setExSets(3);
    setExReps([10, 10, 10]);
  }

  function openEditForm(dayId, idx, ex) {
    setPendingDelete(null);
    setFormDayId(dayId);
    setEditIdx(idx);
    setExName(ex.name);
    setExSets(ex.sets);
    setExReps([...ex.perSetReps]);
  }

  function resetForm() {
    setFormDayId(null);
    setEditIdx(null);
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

  function saveExercise() {
    if (!exName.trim() || !formDayId) return;
    const exercise = { name: exName.trim(), sets: exSets, perSetReps: [...exReps] };

    if (editIdx !== null) {
      // Edit mode — replace in place, preserving order
      setDays((prev) =>
        prev.map((d) =>
          d.id === formDayId
            ? { ...d, exercises: d.exercises.map((ex, i) => (i === editIdx ? exercise : ex)) }
            : d
        )
      );
      resetForm();
    } else {
      // Add mode — append, then close the form
      setDays((prev) =>
        prev.map((d) =>
          d.id === formDayId ? { ...d, exercises: [...d.exercises, exercise] } : d
        )
      );
      resetForm();
    }
  }

  function removeExercise(dayId, idx) {
    // Close edit form if it was open for this exercise
    if (formDayId === dayId && editIdx === idx) resetForm();
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((_, i) => i !== idx) } : d
      )
    );
  }

  // ── Save plan ─────────────────────────────────────────────────────────────

  function handleSave() {
    if (!isEditing && hasPlan) {
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
  const isAddFormOpen = (dayId) => formDayId === dayId && editIdx === null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
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
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  {editingDayId === day.id ? (
                    <>
                      <input
                        value={editDayName}
                        onChange={(e) => setEditDayName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveDayLabel(day.id)}
                        autoFocus
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white font-bold text-sm uppercase tracking-widest focus:outline-none focus:border-brand-red/50"
                      />
                      <button
                        onClick={() => setEditingDayId(null)}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs shrink-0"
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => saveDayLabel(day.id)}
                        className="w-7 h-7 rounded-full bg-brand-red/20 border border-brand-red/40 flex items-center justify-center text-brand-red hover:bg-brand-red/30 transition-colors shrink-0"
                      >
                        <CheckIcon />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-bold text-sm uppercase tracking-widest flex-1">
                        {day.label}
                      </span>
                      <button
                        onClick={() => startEditDayLabel(day.id, day.label)}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0"
                        title="Rename day"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setPendingDelete({ type: "day", dayId: day.id })}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors text-xs shrink-0"
                        title="Remove day"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>

                {/* Day delete confirmation */}
                <AnimatePresence>
                  {pendingDelete?.type === "day" && pendingDelete.dayId === day.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-red-300">Remove &ldquo;{day.label}&rdquo; and all its exercises?</p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={cancelDelete}
                            className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs font-semibold active:scale-95 transition-transform"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={confirmDelete}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold active:scale-95 transition-transform"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Exercise list */}
                {day.exercises.length > 0 && (
                  <div className="divide-y divide-white/5">
                    {day.exercises.map((ex, idx) => {
                      const isEditing = formDayId === day.id && editIdx === idx;

                      if (isEditing) {
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-4 space-y-4 bg-white/3"
                          >
                            <input
                              type="text"
                              value={exName}
                              onChange={(e) => setExName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveExercise()}
                              autoFocus
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
                            />

                            <div className="space-y-1.5">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Sets</p>
                              <Stepper value={exSets} onChange={updateSets} min={1} max={10} />
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Reps per set</p>
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
                                          prev.map((r, ri) => (ri === i ? val : r))
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
                                onClick={saveExercise}
                                disabled={!exName.trim()}
                                className={[
                                  "flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors",
                                  exName.trim()
                                    ? "bg-brand-red text-white"
                                    : "bg-white/10 text-gray-600 cursor-not-allowed",
                                ].join(" ")}
                              >
                                Save
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <div key={idx}>
                          <div className="flex items-center justify-between px-4 py-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-gray-100 text-sm font-semibold truncate">{ex.name}</p>
                              <p className="text-brand-red text-xs font-mono font-bold mt-0.5">
                                {ex.sets} × {ex.perSetReps.join(", ")}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 ml-3 shrink-0">
                              <button
                                onClick={() => openEditForm(day.id, idx, ex)}
                                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                                title="Edit exercise"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => setPendingDelete({ type: "exercise", dayId: day.id, idx })}
                                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors text-xs"
                                title="Remove exercise"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Exercise delete confirmation */}
                          <AnimatePresence>
                            {pendingDelete?.type === "exercise" &&
                              pendingDelete.dayId === day.id &&
                              pendingDelete.idx === idx && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mx-4 mb-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                                    <p className="text-xs text-red-300">Remove &ldquo;{ex.name}&rdquo;?</p>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        onClick={cancelDelete}
                                        className="px-3 py-1 rounded-lg bg-white/10 text-gray-400 text-xs font-semibold active:scale-95 transition-transform"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={confirmDelete}
                                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold active:scale-95 transition-transform"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add form or Add button */}
                <AnimatePresence mode="wait">
                  {isAddFormOpen(day.id) ? (
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
                        onKeyDown={(e) => e.key === "Enter" && saveExercise()}
                        placeholder="Exercise name, e.g. Bench Press"
                        autoFocus
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
                      />

                      <div className="space-y-1.5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Sets</p>
                        <Stepper value={exSets} onChange={updateSets} min={1} max={10} />
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Reps per set</p>
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
                                    prev.map((r, ri) => (ri === i ? val : r))
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
                          onClick={saveExercise}
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
                      onClick={() => openAddForm(day.id)}
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
              {isEditing ? "Save Changes" : "Save Plan"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
