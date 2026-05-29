"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generatePlanPrompt } from "@/lib/prompt";
import { savePlan } from "@/lib/storage";

const GOALS = ["Hypertrophy", "Strength", "Fat Loss", "General Fitness"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const DURATIONS = ["30", "45", "60", "75", "90"];
const EQUIPMENT = [
  "Full Gym",
  "Dumbbells Only",
  "Barbell + Rack",
  "Machines Only",
  "Home / No Equipment",
];

const defaultForm = {
  goal: "",
  daysPerWeek: 3,
  sessionDuration: "60",
  level: "",
  age: "",
  equipment: [],
  injuries: "",
  planDuration: 8,
};

export default function NewPlanForm({ onClose, onPlanLoaded }) {
  const [form, setForm] = useState(defaultForm);
  const [prompt, setPrompt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState(null);

  function extractJsonFromText(text) {
    // Try to extract from ```json ... ``` block first
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }
    // Fallback: try to find a raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found");
  }

  function handleImportPaste() {
    setPasteError(null);
    try {
      const plan = extractJsonFromText(pasteValue);
      if (!plan.meta || !plan.days) {
        setPasteError("The plan is missing required fields. Make sure you copied the full AI response.");
        return;
      }
      savePlan(plan);
      onPlanLoaded(plan);
      onClose();
    } catch {
      setPasteError("Couldn't find a valid plan in your text. Try copying the AI response again.");
    }
  }

  function toggleEquipment(item) {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter((e) => e !== item)
        : [...f.equipment, item],
    }));
  }

  function handleGenerate() {
    if (!form.goal || !form.level || !form.age || form.equipment.length === 0) {
      alert("Please fill in Goal, Level, Age, and at least one equipment option.");
      return;
    }
    setPrompt(generatePlanPrompt(form));
  }

  function handleCopy() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isValid =
    form.goal && form.level && form.age && form.equipment.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed inset-0 z-50 bg-brand-navy flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">New Plan</h2>
            <p className="text-xs text-gray-500">Fill in your profile to generate AI instructions</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-24">
          {!prompt ? (
            <>
              {/* Goal */}
              <Field label="What's your primary goal?">
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <ToggleButton
                      key={g}
                      active={form.goal === g}
                      onClick={() => setForm((f) => ({ ...f, goal: g }))}
                    >
                      {g}
                    </ToggleButton>
                  ))}
                </div>
              </Field>

              {/* Days per week */}
              <Field label="Training days per week">
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <ToggleButton
                      key={n}
                      active={form.daysPerWeek === n}
                      onClick={() => setForm((f) => ({ ...f, daysPerWeek: n }))}
                      small
                    >
                      {n}
                    </ToggleButton>
                  ))}
                </div>
              </Field>

              {/* Session duration */}
              <Field label="Session duration (minutes)">
                <div className="flex gap-2 flex-wrap">
                  {DURATIONS.map((d) => (
                    <ToggleButton
                      key={d}
                      active={form.sessionDuration === d}
                      onClick={() => setForm((f) => ({ ...f, sessionDuration: d }))}
                      small
                    >
                      {d}
                    </ToggleButton>
                  ))}
                </div>
              </Field>

              {/* Level */}
              <Field label="Experience level">
                <div className="flex gap-2">
                  {LEVELS.map((l) => (
                    <ToggleButton
                      key={l}
                      active={form.level === l}
                      onClick={() => setForm((f) => ({ ...f, level: l }))}
                    >
                      {l}
                    </ToggleButton>
                  ))}
                </div>
              </Field>

              {/* Age */}
              <Field label="Your age">
                <input
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={99}
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                  placeholder="e.g. 28"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50"
                />
              </Field>

              {/* Equipment */}
              <Field label="Available equipment">
                <div className="space-y-2">
                  {EQUIPMENT.map((eq) => (
                    <ToggleButton
                      key={eq}
                      active={form.equipment.includes(eq)}
                      onClick={() => toggleEquipment(eq)}
                      full
                    >
                      {eq}
                    </ToggleButton>
                  ))}
                </div>
              </Field>

              {/* Injuries (optional) */}
              <Field label="Injuries or limitations" optional>
                <textarea
                  value={form.injuries}
                  onChange={(e) => setForm((f) => ({ ...f, injuries: e.target.value }))}
                  placeholder="e.g. Lower back pain, knee issues..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-red/50 resize-none"
                />
              </Field>

              {/* Plan duration */}
              <Field label="Plan duration (weeks)">
                <div className="grid grid-cols-4 gap-2">
                  {[4, 6, 8, 10, 12, 14, 16, 18].map((n) => (
                    <ToggleButton
                      key={n}
                      active={form.planDuration === n}
                      onClick={() => setForm((f) => ({ ...f, planDuration: n }))}
                      small
                    >
                      {n}w
                    </ToggleButton>
                  ))}
                </div>
              </Field>
            </>
            ) : pasteMode ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-white font-bold text-base mb-1">Paste the AI response</p>
                <p className="text-gray-500 text-xs">
                  Paste the full response from your AI here — SETS will automatically find and import the plan. You don't need to extract anything manually.
                </p>
              </div>
              <textarea
                value={pasteValue}
                onChange={(e) => { setPasteValue(e.target.value); setPasteError(null); }}
                placeholder="Paste the AI response here..."
                rows={10}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-sm focus:outline-none focus:border-brand-red/50 resize-none placeholder-gray-700"
                autoFocus
              />
              {pasteError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-brand-red text-xs bg-brand-red/10 border border-brand-red/20 rounded-xl px-4 py-3"
                >
                  {pasteError}
                </motion.p>
              )}
              <button
                onClick={handleImportPaste}
                disabled={!pasteValue.trim()}
                className={[
                  "w-full font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm",
                  pasteValue.trim()
                    ? "bg-brand-red hover:bg-brand-maroon text-white shadow-lg shadow-brand-red/20"
                    : "bg-white/10 text-gray-600 cursor-not-allowed",
                ].join(" ")}
              >
                Import Plan
              </button>
              <button
                onClick={() => { setPasteMode(false); setPasteError(null); setPasteValue(""); }}
                className="w-full bg-white/5 border border-white/10 text-gray-400 font-semibold py-3 rounded-2xl text-sm"
              >
                ← Back to Prompt
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-white font-bold text-base mb-1">Your AI prompt is ready</p>
                <p className="text-gray-500 text-xs leading-relaxed">
                  Copy this and paste it into ChatGPT, Claude, Gemini, or any AI. When it responds, come back here and tap <span className="text-white font-medium">Paste AI Response</span> — SETS will import the plan automatically.
                </p>
              </div>
              <div className="relative">
                <textarea
                  readOnly
                  value={prompt}
                  rows={10}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-300 text-xs font-mono focus:outline-none resize-none"
                />
              </div>
              <button
                onClick={handleCopy}
                className={[
                  "w-full font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm",
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-brand-red hover:bg-brand-maroon text-white shadow-lg shadow-brand-red/20",
                ].join(" ")}
              >
                {copied ? "Copied ✓" : "Copy Prompt"}
              </button>
              <button
                onClick={() => { setPasteMode(true); setPasteValue(""); setPasteError(null); }}
                className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm"
              >
                Paste AI Response
              </button>
              <button
                onClick={() => setPrompt(null)}
                className="w-full bg-white/5 border border-white/10 text-gray-400 font-semibold py-3 rounded-2xl text-sm"
              >
                ← Edit Answers
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer button (only on form view) */}
        {!prompt && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-brand-navy/90 backdrop-blur-xl border-t border-white/10">
            <button
              onClick={handleGenerate}
              disabled={!isValid}
              className={[
                "w-full font-bold py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-sm",
                isValid
                  ? "bg-brand-red hover:bg-brand-maroon text-white shadow-lg shadow-brand-red/20"
                  : "bg-white/10 text-gray-600 cursor-not-allowed",
              ].join(" ")}
            >
              Generate Instructions
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, optional, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-gray-200">{label}</label>
        {optional && (
          <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">optional</span>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, children, small, full }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={[
        "rounded-xl border font-semibold text-sm transition-all",
        full ? "w-full px-4 py-3 text-left" : small ? "flex-1 py-3 text-center" : "flex-1 px-3 py-2.5 text-center",
        active
          ? "bg-brand-red/25 border-brand-red text-brand-red font-bold"
          : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20",
      ].join(" ")}
    >
      {children}
    </motion.button>
  );
}
