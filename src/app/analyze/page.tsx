"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  FileText,
  Send,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Loader2,
  Brain,
  Search,
} from "lucide-react";

// ─── Step Indicator ────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const steps = ["Select School", "Select Teacher", "Submit Essay"];
  return (
    <div className="flex items-center gap-1 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              i < current
                ? "bg-teal-950 text-teal-400"
                : i === current
                  ? "bg-teal-700 text-white"
                  : "bg-gray-800 text-gray-400"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i < current
                  ? "bg-teal-200 text-teal-800"
                  : i === current
                    ? "bg-gray-900/20 text-white"
                    : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < current ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight
              className={`w-4 h-4 mx-1 ${i < current ? "text-teal-400" : "text-gray-300"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const supabase = createClient();

  // Flow state
  const [step, setStep] = useState(0); // 0=school, 1=teacher, 2=essay
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Data
  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  // Selections
  const [selectedSchool, setSelectedSchool] = useState<DbSchool | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<DbTeacher | null>(
    null
  );

  // Essay form
  const [essayText, setEssayText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [rubric, setRubric] = useState("");
  const [className, setClassName] = useState("");

  // ─── Load schools on mount ───────────────────────────
  useEffect(() => {
    async function loadSchools() {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");
      if (data) setSchools(data);
      if (error) console.error("Error loading schools:", error);
      setLoadingSchools(false);
    }
    loadSchools();
  }, []);

  // ─── Load teachers when school is selected ───────────
  useEffect(() => {
    if (!selectedSchool) return;
    async function loadTeachers() {
      setLoadingTeachers(true);
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("school_id", selectedSchool!.id)
        .eq("is_active", true)
        .order("name");
      if (data) setTeachers(data);
      if (error) console.error("Error loading teachers:", error);
      setLoadingTeachers(false);
    }
    loadTeachers();
  }, [selectedSchool]);

  // ─── Submit essay ────────────────────────────────────
  async function handleSubmit() {
    if (!selectedSchool || !selectedTeacher) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay_text: essayText,
          prompt,
          rubric: rubric || undefined,
          class_name: className || undefined,
          school_id: selectedSchool.id,
          teacher_id: selectedTeacher.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      router.push(`/results/${data.essay_id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setSubmitting(false);
    }
  }

  // ─── Helpers ─────────────────────────────────────────
  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const wordCount = essayText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const canSubmit = essayText.trim().length > 50 && prompt.trim().length > 5;

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .filter((_, i, a) => i === 0 || i === a.length - 1)
      .join("");

  // ─── Submitting state ────────────────────────────────
  if (submitting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-teal-100 rounded-2xl flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Analyzing your essay
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Building feedback using {selectedTeacher?.name}&apos;s grading
              model. This takes ~30 seconds.
            </p>
          </div>
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Optimize Teacher
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <StepIndicator current={step} />

        {/* ─── Step 0: Select School ──────────────────── */}
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Select your school
            </h1>
            <p className="mt-1 text-gray-400">
              Choose your school to get feedback calibrated to its standards.
            </p>

            <div className="relative mt-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {loadingSchools ? (
              <div className="mt-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : filteredSchools.length === 0 ? (
              <p className="mt-8 text-sm text-gray-400 text-center">
                No schools found. Contact us to add your school.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => {
                      setSelectedSchool(school);
                      setStep(1);
                    }}
                    className="w-full text-left bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-teal-300 hover:bg-teal-950/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                          {school.name}
                        </div>
                        {school.location && (
                          <div className="text-sm text-gray-400 mt-0.5">
                            {school.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 capitalize bg-gray-800 px-2 py-0.5 rounded-full">
                          {school.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {school.teacher_count} teachers
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 transition-colors" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 1: Select Teacher ─────────────────── */}
        {step === 1 && selectedSchool && (
          <div>
            <button
              onClick={() => {
                setStep(0);
                setSelectedTeacher(null);
              }}
              className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to schools
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Select your teacher
            </h1>
            <p className="mt-1 text-gray-400">
              at{" "}
              <span className="font-medium text-gray-300">
                {selectedSchool.name}
              </span>{" "}
              — each model is trained on their actual grading patterns.
            </p>

            {loadingTeachers ? (
              <div className="mt-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
              </div>
            ) : teachers.length === 0 ? (
              <p className="mt-8 text-sm text-gray-400 text-center">
                No teachers found for this school yet.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setStep(2);
                    }}
                    className="w-full text-left bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-teal-300 hover:bg-teal-950/30 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {initials(teacher.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                            {teacher.name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 transition-colors" />
                        </div>
                        <div className="text-sm text-gray-400 mt-0.5">
                          {teacher.department} —{" "}
                          {teacher.subjects?.join(", ")}
                        </div>
                        {teacher.grading_style && (
                          <div className="text-xs text-gray-400 mt-2 italic">
                            &ldquo;{teacher.grading_style}&rdquo;
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />{" "}
                            {teacher.essays_graded.toLocaleString()} essays
                            graded
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Step 2: Submit Essay ───────────────────── */}
        {step === 2 && selectedSchool && selectedTeacher && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to teachers
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Submit your essay
            </h1>
            <p className="mt-1 text-gray-400">
              Getting feedback from{" "}
              <span className="font-medium text-gray-300">
                {selectedTeacher.name}
              </span>
              &apos;s model at {selectedSchool.name}
            </p>

            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {submitError}
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Essay Text *
                  </label>
                  <textarea
                    placeholder="Paste your essay here..."
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    className="w-full min-h-[400px] p-3 border border-gray-700 rounded-lg text-sm leading-relaxed resize-y font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">
                      {wordCount} words
                    </span>
                    {wordCount > 0 && wordCount < 100 && (
                      <span className="text-xs text-amber-600">
                        Essays under 100 words may produce less accurate results
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                    Assignment Prompt *
                  </label>
                  <textarea
                    placeholder="What was the essay prompt or question?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full min-h-[80px] p-3 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">
                    Optional Details
                  </h3>
                  <p className="text-xs text-gray-400">
                    Adding these improves accuracy
                  </p>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">
                      Class Name
                    </label>
                    <input
                      placeholder="e.g. AP English Lit"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full h-9 px-3 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1 block">
                      Rubric / Grading Criteria
                    </label>
                    <textarea
                      placeholder="Paste rubric or describe criteria..."
                      value={rubric}
                      onChange={(e) => setRubric(e.target.value)}
                      className="w-full min-h-[100px] p-2 border border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-teal-950 border border-teal-800 rounded-lg p-4 space-y-1.5">
                  <div className="text-xs font-semibold text-teal-800">
                    Teacher Profile
                  </div>
                  <div className="text-xs text-teal-400">
                    {selectedTeacher.name}
                  </div>
                  {selectedTeacher.grading_style && (
                    <div className="text-xs text-teal-600 italic">
                      &ldquo;{selectedTeacher.grading_style}&rdquo;
                    </div>
                  )}
                  <div className="text-xs text-teal-600">
                    {selectedTeacher.essays_graded.toLocaleString()} essays in
                    model
                  </div>
                </div>

                <button
                  disabled={!canSubmit}
                  onClick={handleSubmit}
                  className="w-full h-11 bg-teal-700 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" /> Analyze Essay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
