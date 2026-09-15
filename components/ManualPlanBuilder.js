"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { savePlan, startNewPlan, todayString } from "@/lib/storage";
import {
  SPLITS,
  BODY_PART_COUNTS,
  CUSTOM_SPLIT,
  isBodyPart,
  splitLabels,
  splitMatchesWorkouts,
  workoutIdFromLabel,
} from "@/lib/splits";

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

function planToBuilderWorkouts(plan) {
  if (!plan) return [];
  return plan.workouts.map((workout) => ({
    id: workout.id,
    label: workout.label,
    exercises: workout.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      perSetReps: ex.perSetReps ?? Array(ex.sets).fill(ex.repsMax ?? 10),
    })),
  }));
}

export default function ManualPlanBuilder({ onPlanSaved, hasPlan, initialPlan, isEditing = false }) {
  const [planName, setPlanName] = useState(initialPlan?.meta?.name ?? "");
  const [durationWeeks, setDurationWeeks] = useState(initialPlan?.meta?.durationWeeks ?? 8);
  const [workouts, setWorkouts] = useState(() => planToBuilderWorkouts(initialPlan));
  const [newWorkoutName, setNewWorkoutName] = useState("");

  const initialSplit = initialPlan?.meta?.split ?? "";
  const [split, setSplit] = useState(initialSplit);
  const [partCount, setPartCount] = useState(
    isBodyPart(initialSplit) ? (initialPlan?.workouts?.length ?? 5) : 5
  );
  // Set when switching splits would discard workouts that already have
  // exercises, so the user gets to confirm the loss first.
  const [pendingSplit, setPendingSplit] = useState(null);

  // Add / edit form — shared fields
  // formWorkoutId: which workout's add form is open (null = none)
  // editIdx: index of exercise being edited (null = add mode)
  const [formWorkoutId, setFormWorkoutId] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [exName, setExName] = useState("");
  const [exSets, setExSets] = useState(3);
  const [exReps, setExReps] = useState([10, 10, 10]);

  // Workout label inline editing
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [editWorkoutName, setEditWorkoutName] = useState("");

  // null | "replace" (overwriting a different plan) | "split-reset" (an edit
  // that changes the split, which restarts the plan and wipes its stats)
  const [confirmKind, setConfirmKind] = useState(null);

  // Pending inline delete confirmation: null | { type: 'workout', workoutId } | { type: 'exercise', workoutId, idx }
  const [pendingDelete, setPendingDelete] = useState(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.type === "workout") {
      removeWorkout(pendingDelete.workoutId);
    } else {
      removeExercise(pendingDelete.workoutId, pendingDelete.idx);
    }
    setPendingDelete(null);
  }

  function cancelDelete() {
    setPendingDelete(null);
  }

  // ── Split ─────────────────────────────────────────────────────────────────

  // Choosing a split seeds the workout rows with its labels. Rows are only
  // seeded, never locked: the user can rename, add and remove them afterwards,
  // and the plan is saved as Custom if the count stops matching the split.
  function chooseSplit(nextSplit, nextPartCount = partCount) {
    const labels = splitLabels(nextSplit, nextPartCount) ?? [];
    const losingExercises = workouts
      .slice(labels.length)
      .some((w) => w.exercises.length > 0);
    if (losingExercises) {
      setPendingSplit({ split: nextSplit, partCount: nextPartCount });
      return;
    }
    commitSplit(nextSplit, nextPartCount);
  }

  function commitSplit(nextSplit, nextPartCount) {
    const labels = splitLabels(nextSplit, nextPartCount) ?? [];
    setSplit(nextSplit);
    setPartCount(nextPartCount);
    setPendingSplit(null);
    resetForm();
    setPendingDelete(null);
    setEditingWorkoutId(null);
    // Exercises already entered stay with their position in the sequence, so
    // switching between splits of the same size doesn't lose work.
    setWorkouts((prev) =>
      labels.map((label, i) => ({
        id: workoutIdFromLabel(label, i),
        label,
        exercises: prev[i]?.exercises ?? [],
      }))
    );
  }

  // ── Workouts ───────────────────────────────────────────────────────────────────

  function addWorkout() {
    const label = newWorkoutName.trim();
    if (!label) return;
    const id = `${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setWorkouts((prev) => [...prev, { id, label, exercises: [] }]);
    setNewWorkoutName("");
  }

  function removeWorkout(workoutId) {
    setWorkouts((prev) => prev.filter((d) => d.id !== workoutId));
    if (formWorkoutId === workoutId) resetForm();
    if (editingWorkoutId === workoutId) setEditingWorkoutId(null);
  }

  function startEditWorkoutLabel(workoutId, currentLabel) {
    setEditingWorkoutId(workoutId);
    setEditWorkoutName(currentLabel);
  }

  function saveWorkoutLabel(workoutId) {
    const label = editWorkoutName.trim();
    if (!label) return;
    setWorkouts((prev) => prev.map((d) => (d.id === workoutId ? { ...d, label } : d)));
    setEditingWorkoutId(null);
    setEditWorkoutName("");
  }

  // ── Exercise form ────────────────────────────────────────────────────────────

  function openAddForm(workoutId) {
    setPendingDelete(null);
    setFormWorkoutId(workoutId);
    setEditIdx(null);
    setExName("");
    setExSets(3);
    setExReps([10, 10, 10]);
  }

  function openEditForm(workoutId, idx, ex) {
    setPendingDelete(null);
    setFormWorkoutId(workoutId);
    setEditIdx(idx);
    setExName(ex.name);
    setExSets(ex.sets);
    setExReps([...ex.perSetReps]);
  }

  function resetForm() {
    setFormWorkoutId(null);
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
    if (!exName.trim() || !formWorkoutId) return;
    const exercise = { name: exName.trim(), sets: exSets, perSetReps: [...exReps] };

    if (editIdx !== null) {
      // Edit mode — replace in place, preserving order
      setWorkouts((prev) =>
        prev.map((d) =>
          d.id === formWorkoutId
            ? { ...d, exercises: d.exercises.map((ex, i) => (i === editIdx ? exercise : ex)) }
            : d
        )
      );
      resetForm();
    } else {
      // Add mode — append, then close the form
      setWorkouts((prev) =>
        prev.map((d) =>
          d.id === formWorkoutId ? { ...d, exercises: [...d.exercises, exercise] } : d
        )
      );
      resetForm();
    }
  }

  function removeExercise(workoutId, idx) {
    // Close edit form if it was open for this exercise
    if (formWorkoutId === workoutId && editIdx === idx) resetForm();
    setWorkouts((prev) =>
      prev.map((d) =>
        d.id === workoutId ? { ...d, exercises: d.exercises.filter((_, i) => i !== idx) } : d
      )
    );
  }

  // ── Save plan ─────────────────────────────────────────────────────────────

  // A split only stays on the plan while it still describes the workouts;
  // once the user adds or removes rows the plan is simply Custom.
  const resolvedSplit = !split
    ? null
    : splitMatchesWorkouts(split, partCount, workouts.length)
      ? split
      : CUSTOM_SPLIT;

  // Picking a different split rebuilds the rotation, which makes the logged
  // sessions meaningless, so it restarts the plan rather than editing in place.
  // Only an explicit choice counts: renaming rows, or adding one and drifting
  // to Custom, is an ordinary edit that keeps the plan's history.
  const splitIdentity = (id, count) => (isBodyPart(id) ? `body-part:${count}` : id);
  const splitChanged =
    isEditing &&
    splitIdentity(split, partCount) !==
      splitIdentity(initialSplit, initialPlan?.workouts?.length);

  function handleSave() {
    if (!isEditing && hasPlan) {
      setConfirmKind("replace");
    } else if (splitChanged) {
      setConfirmKind("split-reset");
    } else {
      doSave();
    }
  }

  function doSave() {
    const startsOver = !isEditing || splitChanged;
    const plan = {
      meta: {
        name: planName.trim(),
        edition: initialPlan?.meta?.edition ?? "Custom",
        // Editing keeps the original start date so the week counter stays
        // anchored to when the plan actually began.
        startDate: (!startsOver && initialPlan?.meta?.startDate) || todayString(),
        durationWeeks,
        ...(resolvedSplit ? { split: resolvedSplit } : {}),
      },
      workouts: workouts.map((d) => ({ id: d.id, label: d.label, exercises: d.exercises })),
    };
    if (startsOver) {
      onPlanSaved(startNewPlan(plan), { startsOver: true });
    } else {
      savePlan(plan);
      onPlanSaved(plan, { startsOver: false });
    }
  }

  const canSave = planName.trim().length > 0 && workouts.length > 0;
  const isAddFormOpen = (workoutId) => formWorkoutId === workoutId && editIdx === null;

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

        {/* Split */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">Workout Split</label>
          <p className="text-xs text-gray-500">
            Optional. Picking one fills in the workouts below — you can still rename,
            add or remove them.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPLITS.map((s) => (
              <button
                key={s.id}
                onClick={() => chooseSplit(s.id)}
                className={[
                  "px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors text-left",
                  split === s.id
                    ? "bg-brand-red/20 border-brand-red/50 text-brand-red"
                    : "bg-white/5 border-white/10 text-gray-400 active:scale-95",
                ].join(" ")}
              >
                {s.chip}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isBodyPart(split) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-gray-500 mr-1">Parts</span>
                  {BODY_PART_COUNTS.map((n) => (
                    <button
                      key={n}
                      onClick={() => chooseSplit("body-part", n)}
                      className={[
                        "w-10 py-2 rounded-xl border text-xs font-bold font-mono transition-colors",
                        partCount === n
                          ? "bg-brand-red/20 border-brand-red/50 text-brand-red"
                          : "bg-white/5 border-white/10 text-gray-400 active:scale-95",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pendingSplit && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                  <p className="text-xs text-amber-300">
                    This split has fewer workouts, so some you&apos;ve already filled in
                    will be removed.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPendingSplit(null)}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      Keep mine
                    </button>
                    <button
                      onClick={() => commitSplit(pendingSplit.split, pendingSplit.partCount)}
                      className="flex-1 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
                    >
                      Use split
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workout cards */}
        {workouts.length > 0 && (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Workout header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  {editingWorkoutId === workout.id ? (
                    <>
                      <input
                        value={editWorkoutName}
                        onChange={(e) => setEditWorkoutName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveWorkoutLabel(workout.id)}
                        autoFocus
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white font-bold text-sm uppercase tracking-widest focus:outline-none focus:border-brand-red/50"
                      />
                      <button
                        onClick={() => setEditingWorkoutId(null)}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors text-xs shrink-0"
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => saveWorkoutLabel(workout.id)}
                        className="w-7 h-7 rounded-full bg-brand-red/20 border border-brand-red/40 flex items-center justify-center text-brand-red hover:bg-brand-red/30 transition-colors shrink-0"
                      >
                        <CheckIcon />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-white font-bold text-sm uppercase tracking-widest flex-1">
                        {workout.label}
                      </span>
                      <button
                        onClick={() => startEditWorkoutLabel(workout.id, workout.label)}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors shrink-0"
                        title="Rename workout"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setPendingDelete({ type: "workout", workoutId: workout.id })}
                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors text-xs shrink-0"
                        title="Remove workout"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>

                {/* Workout delete confirmation */}
                <AnimatePresence>
                  {pendingDelete?.type === "workout" && pendingDelete.workoutId === workout.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mx-4 mb-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-red-300">Remove &ldquo;{workout.label}&rdquo; and all its exercises?</p>
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
                {workout.exercises.length > 0 && (
                  <div className="divide-y divide-white/5">
                    {workout.exercises.map((ex, idx) => {
                      const isEditing = formWorkoutId === workout.id && editIdx === idx;

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
                                onClick={() => openEditForm(workout.id, idx, ex)}
                                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                                title="Edit exercise"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => setPendingDelete({ type: "exercise", workoutId: workout.id, idx })}
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
                              pendingDelete.workoutId === workout.id &&
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
                  {isAddFormOpen(workout.id) ? (
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
                      onClick={() => openAddForm(workout.id)}
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

        {/* Add workout */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-200">
            {workouts.length === 0 ? "Add your first training workout" : "Add another workout"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newWorkoutName}
              onChange={(e) => setNewWorkoutName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWorkout()}
              placeholder="e.g. Push, Legs, Upper…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
            />
            <button
              onClick={addWorkout}
              disabled={!newWorkoutName.trim()}
              className={[
                "px-4 py-3 rounded-xl text-sm font-bold transition-colors shrink-0",
                newWorkoutName.trim()
                  ? "bg-brand-red text-white active:scale-95"
                  : "bg-white/10 text-gray-600 cursor-not-allowed",
              ].join(" ")}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-4 border-t border-white/10 bg-brand-navy/90 backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {confirmKind ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <p className="text-center text-sm text-gray-400">
                {confirmKind === "split-reset"
                  ? "Changing the split starts the plan over — your logged sessions and stats will be cleared. Continue?"
                  : "This will replace your current plan. Continue?"}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmKind(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={doSave}
                  className="flex-1 py-3.5 rounded-2xl bg-brand-red text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-brand-red/30"
                >
                  {confirmKind === "split-reset" ? "Start Over" : "Replace"}
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
