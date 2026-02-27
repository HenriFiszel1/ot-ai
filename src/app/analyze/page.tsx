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
  Brain,
  Search,
  School,
} from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";

export default function AnalyzePage() {
  const router = useRouter();
  const supabase = createClient();

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

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      (s.location || "").toLowerCase().includes(schoolSearch.toLowerCase())
  );

  const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = essayText.trim().length > 50 && prompt.trim().length > 5;

  const ic = "w-full h-11 px-3.5 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200 border-[rgba(255,255,255,0.12)]";
  const tc = "w-full p-3.5 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200 border-[rgba(255,255,255,0.12)]";

  const steps = [
    { num: 0, label: "School" },
    { num: 1, label: "Teacher" },
    { num: 2, label: "Essay" },
  ];

  // ─── Submitting state ────────────────────────────────
  if (submitting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#141414' }}>
        <div className="max-w-md w-full text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <Brain className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.6)' }} />
          </div>
          <div>
            <TextShimmer duration={1.2} className="text-lg font-medium [--base-color:theme(colors.gray.400)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.gray.400)] dark:[--base-gradient-color:theme(colors.white)]">
              Analyzing your essay...
            </TextShimmer>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Building feedback using {selectedTeacher?.name}&apos;s grading
              model. This takes ~30 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/optimize-ai-logo.png" alt="Optimize AI" width={120} height={30} className="h-6 w-auto" />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="flex items-center gap-6 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-6">
              <button
                onClick={() => { if (s.num < step) { setStep(s.num); setSubmitError(null); } }}
                className="flex items-center gap-2 text-sm font-medium transition-colors"
                style={{
                  color: step === s.num ? '#F2F2FF' : step > s.num ? '#6398FF' : 'rgba(255,255,255,0.3)',
                  cursor: s.num < step ? 'pointer' : 'default',
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: step === s.num ? '#F2F2FF' : step > s.num ? '#6398FF' : 'rgba(255,255,255,0.08)',
                    color: step === s.num ? '#141414' : step > s.num ? '#141414' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.15)' }} />}
            </div>
          ))}
        </div>

        {submitError && <div className="mb-6 py-3 px-4 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{submitError}</div>}

        {/* STEP 0: SCHOOL */}
        {step === 0 && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-lg font-semibold" style={{ color: '#F2F2FF' }}>Select Your School</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Choose your school to get feedback calibrated to its standards.</p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                placeholder="Search schools..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className={`w-full h-12 pl-10 pr-3 ${ic}`}
                autoFocus
              />
            </div>

            {loadingSchools ? (
              <div className="py-8 flex items-center justify-center">
                <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.gray.500)] [--base-gradient-color:theme(colors.blue.400)] dark:[--base-color:theme(colors.gray.500)] dark:[--base-gradient-color:theme(colors.blue.400)]">
                  Loading schools...
                </TextShimmer>
              </div>
            ) : filteredSchools.length === 0 ? (
              <p className="py-8 text-sm text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No schools found. Contact us to add your school.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    onClick={() => {
                      setSelectedSchool(school);
                      setStep(1);
                    }}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#F2F2FF' }}>{school.name}</div>
                      {school.location && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{school.location}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.25)' }}>{school.type}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{school.teacher_count} teachers</span>
                      <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: TEACHER */}
        {step === 1 && selectedSchool && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <School className="w-3.5 h-3.5" /> {selectedSchool.name}
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#F2F2FF' }}>Select Your Teacher</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Each model is trained on their actual grading patterns.</p>

            {loadingTeachers ? (
              <div className="py-8 flex items-center justify-center">
                <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.gray.500)] [--base-gradient-color:theme(colors.blue.400)] dark:[--base-color:theme(colors.gray.500)] dark:[--base-gradient-color:theme(colors.blue.400)]">
                  Loading teachers...
                </TextShimmer>
              </div>
            ) : teachers.length === 0 ? (
              <p className="py-8 text-sm text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No teachers found for this school yet.
              </p>
            ) : (
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setStep(2);
                    }}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                    style={{
                      background: selectedTeacher?.id === teacher.id ? 'rgba(99,152,255,0.07)' : 'transparent',
                      border: selectedTeacher?.id === teacher.id ? '1px solid rgba(99,152,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#F2F2FF' }}>{teacher.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {teacher.department}{teacher.subjects && teacher.subjects.length > 0 ? ` · ${teacher.subjects.join(", ")}` : ""}
                      </div>
                      {teacher.grading_style && (
                        <div className="text-xs mt-1.5 italic" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          &ldquo;{teacher.grading_style}&rdquo;
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        <FileText className="w-3 h-3" />
                        {teacher.essays_graded.toLocaleString()} essays graded
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SUBMIT ESSAY */}
        {step === 2 && selectedSchool && selectedTeacher && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <School className="w-3.5 h-3.5" /> {selectedSchool.name} <ChevronRight className="w-3 h-3" /> {selectedTeacher.name}
            </div>
            <h2 className="text-lg font-semibold" style={{ color: '#F2F2FF' }}>Submit Your Essay</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Paste your essay and assignment prompt to get feedback from {selectedTeacher.name}&apos;s grading model.
            </p>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Essay Text *</label>
              <textarea
                placeholder="Paste your essay here..."
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                className={`${tc} min-h-[240px] resize-y`}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{wordCount} words</span>
                {wordCount > 0 && wordCount < 100 && (
                  <span className="text-xs" style={{ color: '#fbbf24' }}>
                    Essays under 100 words may produce less accurate results
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Assignment Prompt *</label>
              <textarea
                placeholder="What was the essay prompt or question?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={`${tc} min-h-[80px] resize-y`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Class Name</label>
                <input
                  placeholder="e.g. AP English Lit"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className={ic}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Rubric / Criteria</label>
                <input
                  placeholder="Describe or paste rubric..."
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  className={ic}
                />
              </div>
            </div>

            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              <Send className="w-4 h-4" /> Analyze Essay
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
