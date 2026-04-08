"use client";

import { useState } from "react";
import { Flag, CheckCircle, X } from "lucide-react";

export function ReportActualGrade({ predictionId }: { predictionId: string }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const numeric = parseFloat(grade);
    if (isNaN(numeric) || numeric < 0 || numeric > 100) {
      setError("Enter a grade between 0 and 100.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prediction_id: predictionId, actual_grade: numeric }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit");
      }
      setDone(true);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400 py-2">
        <CheckCircle className="w-3.5 h-3.5" />
        Actual grade recorded — thanks for improving accuracy!
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full h-10 border border-white/[0.08] hover:bg-white/[0.04] text-gray-400 hover:text-gray-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-200"
        >
          <Flag className="w-3.5 h-3.5" /> Report Actual Grade
        </button>
      ) : (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-300">What grade did you actually receive?</p>
            <button onClick={() => { setOpen(false); setError(null); }} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="e.g. 84"
              autoFocus
              className="flex-1 h-9 px-3 bg-transparent border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              onClick={submit}
              disabled={submitting || !grade.trim()}
              className="h-9 px-4 bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <p className="text-[11px] text-gray-500">
            Helps calibrate future predictions for this teacher.
          </p>
        </div>
      )}
    </div>
  );
}
