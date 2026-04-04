"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Send,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Brain,
  Search,
  User,
  X,
} from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";

export default function AnalyzePage() {
  const router = useRouter();
  const supabase = createClient();

  // ─── All existing state preserved unchanged ───────────
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState("");

  const [selectedSchool, setSelectedSchool] = useState<DbSchool | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<DbTeacher | null>(null);

  const [essayText, setEssayText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [rubric, setRubric] = useState("");
  const [className, setClassName] = useState("");

  // ─── New UI state for collapsible fields ──────────────
  const [promptExpanded, setPromptExpanded] = useState(true);
  const [metaExpanded, setMetaExpanded] = useState(false);

  useEffect(() => {
    async function loadSchools() {
      const { data, error } = await supabase.from("schools").select("*").order("name");
      if (data) setSchools(data);
      if (error) console.error("Error loading schools:", error);
      setLoadingSchools(false);
    }
    loadSchools();
  }, []);

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
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const filteredSchools = schoolSearch.trim()
    ? schools.filter(
        (s) =>
          s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
          (s.location || "").toLowerCase().includes(schoolSearch.toLowerCase())
      )
    : [];

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = essayText.trim().length > 50 && prompt.trim().length > 5;

  // ─── Submitting overlay ───────────────────────────────
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#141414" }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div
            className="w-12 h-12 mx-auto rounded-full flex items-center justify-center animate-pulse"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Brain className="w-6 h-6" style={{ color: "rgba(255,255,255,0.6)" }} />
          </div>
          <div>
            <TextShimmer
              duration={1.2}
              className="text-lg font-medium [--base-color:theme(colors.gray.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.gray.400)] dark:[--base-gradient-color:theme(colors.white)]"
            >
              Analyzing your essay...
            </TextShimmer>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Building feedback using {selectedTeacher?.name}&apos;s grading model. This takes ~30
              seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Shared logo header ───────────────────────────────
  const logoHeader = (backHref: string, backLabel: string, onBack?: () => void) => (
    <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/optimize-ai-logo.png"
            alt="Optimize AI"
            width={120}
            height={30}
            className="h-6 w-auto"
          />
        </Link>
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </button>
        ) : (
          <Link
            href={backHref}
            className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </Link>
        )}
      </div>
    </header>
  );

  // ─── Setup progress breadcrumb ────────────────────────
  const SetupBreadcrumb = () => (
    <div className="flex items-center gap-2 mb-8 flex-wrap">
      <button
        onClick={step > 0 ? () => { setStep(0); } : undefined}
        className="flex items-center gap-2"
        style={{ cursor: step > 0 ? "pointer" : "default" }}
      >
        <span
          className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center"
          style={{
            background: step > 0 ? "#6398FF" : step === 0 ? "#F2F2FF" : "rgba(255,255,255,0.08)",
            color: step > 0 ? "#fff" : step === 0 ? "#141414" : "rgba(255,255,255,0.3)",
          }}
        >
          {step > 0 ? <CheckCircle className="w-3 h-3" /> : "1"}
        </span>
        <span
          className="text-sm"
          style={{
            color: step > 0 ? "#6398FF" : step === 0 ? "#F2F2FF" : "rgba(255,255,255,0.3)",
            fontWeight: step === 0 ? 600 : 400,
          }}
        >
          {step > 0 && selectedSchool ? selectedSchool.name : "School"}
        </span>
      </button>

      <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.15)" }} />

      <button
        onClick={step > 1 ? () => { setStep(1); } : undefined}
        className="flex items-center gap-2"
        style={{ cursor: step > 1 ? "pointer" : "default" }}
      >
        <span
          className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center"
          style={{
            background: step > 1 ? "#6398FF" : step === 1 ? "#F2F2FF" : "rgba(255,255,255,0.08)",
            color: step > 1 ? "#fff" : step === 1 ? "#141414" : "rgba(255,255,255,0.3)",
          }}
        >
          {step > 1 ? <CheckCircle className="w-3 h-3" /> : "2"}
        </span>
        <span
          className="text-sm"
          style={{
            color: step > 1 ? "#6398FF" : step === 1 ? "#F2F2FF" : "rgba(255,255,255,0.3)",
            fontWeight: step === 1 ? 600 : 400,
          }}
        >
          {step > 1 && selectedTeacher ? selectedTeacher.name : "Teacher"}
        </span>
      </button>

      <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.15)" }} />

      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center"
          style={{
            background: step === 2 ? "#F2F2FF" : "rgba(255,255,255,0.08)",
            color: step === 2 ? "#141414" : "rgba(255,255,255,0.3)",
          }}
        >
          3
        </span>
        <span
          className="text-sm"
          style={{ color: step === 2 ? "#F2F2FF" : "rgba(255,255,255,0.3)", fontWeight: step === 2 ? 600 : 400 }}
        >
          Analyze
        </span>
      </div>
    </div>
  );

  // ─── STEP 0: School Selection ─────────────────────────
  if (step === 0) {
    return (
      <div className="min-h-screen" style={{ background: "#141414" }}>
        {logoHeader("/dashboard", "Dashboard")}
        <div className="max-w-lg mx-auto px-6 py-12">
          <SetupBreadcrumb />

          <h1 className="text-2xl font-semibold mb-1" style={{ color: "#F2F2FF" }}>
            Choose your school
          </h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            We&apos;ll calibrate feedback to your school&apos;s grading standards.
          </p>

          <div className="relative mb-4">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
            <input
              type="text"
              placeholder="Search schools..."
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-3 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200 border-[rgba(255,255,255,0.12)]"
              autoFocus
            />
          </div>

          {loadingSchools ? (
            <div className="py-8 flex items-center justify-center">
              <TextShimmer
                duration={1}
                className="text-sm [--base-color:theme(colors.gray.500)] [--base-gradient-color:theme(colors.blue.400)] dark:[--base-color:theme(colors.gray.500)] dark:[--base-gradient-color:theme(colors.blue.400)]"
              >
                Loading schools...
              </TextShimmer>
            </div>
          ) : !schoolSearch.trim() ? (
            <p className="py-6 text-sm text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              Start typing to search for your school
            </p>
          ) : filteredSchools.length === 0 ? (
            <p className="py-6 text-sm text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              No schools found. Contact us to add your school.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {filteredSchools.map((school) => {
                const isSelected = selectedSchool?.id === school.id;
                return (
                  <button
                    key={school.id}
                    onClick={() => setSelectedSchool(school)}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                    style={{
                      background: isSelected ? "rgba(99,152,255,0.07)" : "rgba(255,255,255,0.02)",
                      border: isSelected
                        ? "1px solid rgba(99,152,255,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: "#F2F2FF" }}>
                        {school.name}
                      </div>
                      {school.location && (
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {school.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs capitalize" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {school.type}
                      </span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {school.teacher_count} teachers
                      </span>
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4" style={{ color: "#6398FF" }} />
                      ) : (
                        <ChevronRight className="w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedSchool && (
            <button
              onClick={() => { setStep(1); setSubmitError(null); }}
              className="w-full h-11 mt-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: "#F2F2FF", color: "#141414" }}
            >
              Continue with {selectedSchool.name} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP 1: Teacher Selection ────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen" style={{ background: "#141414" }}>
        {logoHeader("", "Back", () => { setStep(0); setSubmitError(null); })}
        <div className="max-w-lg mx-auto px-6 py-12">
          <SetupBreadcrumb />

          <h1 className="text-2xl font-semibold mb-1" style={{ color: "#F2F2FF" }}>
            Choose your teacher
          </h1>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            Each model is trained on their actual grading patterns.
          </p>

          {loadingTeachers ? (
            <div className="py-8 flex items-center justify-center">
              <TextShimmer
                duration={1}
                className="text-sm [--base-color:theme(colors.gray.500)] [--base-gradient-color:theme(colors.blue.400)] dark:[--base-color:theme(colors.gray.500)] dark:[--base-gradient-color:theme(colors.blue.400)]"
              >
                Loading teachers...
              </TextShimmer>
            </div>
          ) : teachers.length === 0 ? (
            <p className="py-6 text-sm text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              No teachers found for this school yet.
            </p>
          ) : (
            <div className="space-y-2 mb-4">
              {teachers.map((teacher) => {
                const isSelected = selectedTeacher?.id === teacher.id;
                return (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeacher(teacher)}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200"
                    style={{
                      background: isSelected ? "rgba(99,152,255,0.07)" : "rgba(255,255,255,0.02)",
                      border: isSelected
                        ? "1px solid rgba(99,152,255,0.3)"
                        : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-3">
                        <div className="text-sm font-medium" style={{ color: "#F2F2FF" }}>
                          {teacher.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {teacher.department}
                          {teacher.subjects && teacher.subjects.length > 0
                            ? ` · ${teacher.subjects.join(", ")}`
                            : ""}
                        </div>
                        {teacher.grading_style && (
                          <div
                            className="text-xs mt-1.5 italic"
                            style={{ color: "rgba(255,255,255,0.3)" }}
                          >
                            &ldquo;{teacher.grading_style}&rdquo;
                          </div>
                        )}
                        <div
                          className="mt-1.5 flex items-center gap-1 text-xs"
                          style={{ color: "rgba(255,255,255,0.25)" }}
                        >
                          <FileText className="w-3 h-3" />
                          {teacher.essays_graded.toLocaleString()} essays graded
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#6398FF" }} />
                      ) : (
                        <ChevronRight
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: "rgba(255,255,255,0.2)" }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTeacher && (
            <button
              onClick={() => { setStep(2); setSubmitError(null); }}
              className="w-full h-11 mt-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: "#F2F2FF", color: "#141414" }}
            >
              Continue with {selectedTeacher.name} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── STEP 2: GPTZero-style Split Layout ──────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#141414" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/optimize-ai-logo.png"
              alt="Optimize AI"
              width={120}
              height={30}
              className="h-6 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3">
            {/* Selected teacher pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6398FF" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                {selectedTeacher?.name}&nbsp;·&nbsp;{selectedSchool?.name}
              </span>
              <button
                onClick={() => {
                  setStep(0);
                  setSelectedSchool(null);
                  setSelectedTeacher(null);
                }}
                className="ml-0.5 transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <Link
              href="/dashboard"
              className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      {submitError && (
        <div
          className="px-6 py-2.5 text-sm text-center"
          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}
        >
          {submitError}
        </div>
      )}

      {/* Split layout */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>
        {/* ── Left Panel: Essay Editor ───────────────────── */}
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Collapsible metadata strip */}
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {/* Assignment Prompt row */}
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="w-full px-5 py-3 flex items-center justify-between text-sm transition-colors"
                style={{
                  color: prompt ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.015)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="flex items-center gap-2.5">
                  <span className="font-medium text-xs uppercase tracking-wide">
                    Assignment Prompt
                  </span>
                  {prompt && !promptExpanded && (
                    <span
                      className="text-xs truncate max-w-[360px]"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      {prompt.slice(0, 80)}
                      {prompt.length > 80 ? "…" : ""}
                    </span>
                  )}
                  {!prompt && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: "rgba(251,191,36,0.1)",
                        color: "rgba(251,191,36,0.7)",
                        fontSize: "10px",
                      }}
                    >
                      required
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${promptExpanded ? "rotate-180" : ""}`}
                  style={{ color: "rgba(255,255,255,0.25)" }}
                />
              </button>
              {promptExpanded && (
                <div className="px-5 pb-4">
                  <textarea
                    placeholder="What was the assignment prompt or question?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-3 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.22)] focus:outline-none transition-colors duration-200 resize-none"
                    style={{
                      borderColor: "rgba(255,255,255,0.09)",
                      minHeight: "68px",
                      outlineColor: "rgba(255,255,255,0.2)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                </div>
              )}
            </div>

            {/* Class / Rubric row */}
            <div>
              <button
                onClick={() => setMetaExpanded(!metaExpanded)}
                className="w-full px-5 py-2.5 flex items-center justify-between transition-colors"
                style={{
                  color:
                    className || rubric ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)",
                  background: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.015)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="text-xs font-medium uppercase tracking-wide">
                  Class name &amp; rubric
                  {(className || rubric) && (
                    <span
                      className="ml-2 normal-case font-normal"
                      style={{ color: "rgba(255,255,255,0.28)" }}
                    >
                      {[className, rubric].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${metaExpanded ? "rotate-180" : ""}`}
                  style={{ color: "rgba(255,255,255,0.2)" }}
                />
              </button>
              {metaExpanded && (
                <div className="px-5 pb-3 grid grid-cols-2 gap-3">
                  <input
                    placeholder="Class name (e.g. AP English Lit)"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="h-9 px-3 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.22)] focus:outline-none transition-colors duration-200"
                    style={{ borderColor: "rgba(255,255,255,0.09)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                  <input
                    placeholder="Rubric / grading criteria"
                    value={rubric}
                    onChange={(e) => setRubric(e.target.value)}
                    className="h-9 px-3 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.22)] focus:outline-none transition-colors duration-200"
                    style={{ borderColor: "rgba(255,255,255,0.09)" }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.22)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main essay textarea */}
          <div className="flex-1 relative overflow-hidden">
            <textarea
              placeholder="Paste your essay here..."
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              className="w-full h-full p-6 bg-transparent text-sm leading-7 text-[#E8E8F0] placeholder:text-[rgba(255,255,255,0.18)] focus:outline-none resize-none"
            />
          </div>

          {/* Bottom bar */}
          <div
            className="px-6 py-3 flex items-center justify-between flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.28)" }}>
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              {wordCount > 0 && wordCount < 100 && (
                <span className="text-xs" style={{ color: "#fbbf24" }}>
                  Essays under 100 words may be less accurate
                </span>
              )}
            </div>
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="h-9 px-5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ background: "#F2F2FF", color: "#141414" }}
            >
              <Send className="w-3.5 h-3.5" /> Analyze
            </button>
          </div>
        </div>

        {/* ── Right Panel: Context & Status ─────────────── */}
        <div
          className="w-[320px] flex-shrink-0 flex flex-col overflow-y-auto"
          style={{ background: "rgba(255,255,255,0.012)" }}
        >
          <div className="p-6 space-y-6">
            {/* Teacher card */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Grading Model
              </p>
              <div
                className="p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,152,255,0.1)" }}
                  >
                    <User className="w-4 h-4" style={{ color: "#6398FF" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#F2F2FF" }}>
                      {selectedTeacher?.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                      {selectedTeacher?.department}
                      {selectedTeacher?.subjects?.length
                        ? ` · ${selectedTeacher.subjects.join(", ")}`
                        : ""}
                    </div>
                    {selectedTeacher?.grading_style && (
                      <div
                        className="text-xs mt-2 italic leading-relaxed"
                        style={{ color: "rgba(255,255,255,0.28)" }}
                      >
                        &ldquo;{selectedTeacher.grading_style}&rdquo;
                      </div>
                    )}
                    <div
                      className="mt-2 flex items-center gap-1.5 text-xs"
                      style={{ color: "rgba(255,255,255,0.22)" }}
                    >
                      <FileText className="w-3 h-3" />
                      {selectedTeacher?.essays_graded.toLocaleString()} essays graded
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready checklist */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Ready to analyze
              </p>
              <div
                className="p-4 rounded-xl space-y-2.5"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                    style={{
                      background:
                        essayText.trim().length > 50 ? "#4ade80" : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    style={{
                      color:
                        essayText.trim().length > 50
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(255,255,255,0.28)",
                    }}
                  >
                    Essay text pasted
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors"
                    style={{
                      background:
                        prompt.trim().length > 5 ? "#4ade80" : "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    style={{
                      color:
                        prompt.trim().length > 5
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(255,255,255,0.28)",
                    }}
                  >
                    Assignment prompt added
                  </span>
                </div>
              </div>
            </div>

            {/* What you'll get */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                What you&apos;ll get
              </p>
              <div className="space-y-2.5">
                {[
                  { color: "#4ade80", label: "Predicted grade & confidence" },
                  { color: "#6398FF", label: "Inline comments throughout your essay" },
                  { color: "#fbbf24", label: "Teacher-style end comment" },
                  { color: "rgba(255,255,255,0.4)", label: "Specific next steps to improve" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: item.color }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.45)" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change teacher */}
            <button
              onClick={() => { setStep(1); setSelectedTeacher(null); setSubmitError(null); }}
              className="w-full text-xs py-2 rounded-lg transition-all"
              style={{
                color: "rgba(255,255,255,0.28)",
                border: "1px solid rgba(255,255,255,0.06)",
                background: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Change teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
