"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import {
  GraduationCap, ArrowLeft, ArrowRight, Plus, Upload, CheckCircle,
  Loader2, School, UserPlus, FileText, Link2, Search, ChevronRight,
} from "lucide-react";

function ContributeContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);

  // Schools
  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<DbSchool | null>(null);
  const [addingNewSchool, setAddingNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolLocation, setNewSchoolLocation] = useState("");
  const [newSchoolType, setNewSchoolType] = useState("public");
  const [savingSchool, setSavingSchool] = useState(false);

  // Teachers
  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<DbTeacher | null>(null);
  const [addingNewTeacher, setAddingNewTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("English");
  const [newTeacherSubjects, setNewTeacherSubjects] = useState("");
  const [newTeacherGradingStyle, setNewTeacherGradingStyle] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Essays
  const [importMode, setImportMode] = useState<"google" | "manual">("google");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [essayText, setEssayText] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayGrade, setEssayGrade] = useState("");
  const [essayNumericGrade, setEssayNumericGrade] = useState("");
  const [teacherEndComment, setTeacherEndComment] = useState("");
  const [inlineComments, setInlineComments] = useState<Array<{ excerpt: string; comment: string }>>([{ excerpt: "", comment: "" }]);
  const [savingEssay, setSavingEssay] = useState(false);
  const [essaySuccess, setEssaySuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load schools
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("schools").select("*").order("name");
      if (data) setSchools(data);
    }
    load();
  }, []);

  // Load teachers when school selected
  useEffect(() => {
    if (!selectedSchool) return;
    async function load() {
      const { data } = await supabase.from("teachers").select("*").eq("school_id", selectedSchool!.id).order("name");
      if (data) setTeachers(data);
    }
    load();
  }, [selectedSchool]);

  // Check Google connection
  useEffect(() => {
    async function checkGoogle() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        setGoogleConnected(true);
        setProviderToken(session.provider_token);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.identities?.some((i) => i.provider === "google")) {
          setGoogleConnected(true);
        }
      }
    }
    checkGoogle();
  }, []);

  // If redirected back from Google OAuth to essays step
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "essays" && selectedSchool && selectedTeacher) {
      setStep(3);
    }
  }, [searchParams]);

  const filteredSchools = schoolSearch.trim()
    ? schools.filter((s) => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
    : [];

  // ── Save new school ──
  async function saveSchool() {
    if (!newSchoolName.trim()) return;
    setSavingSchool(true);
    setError(null);
    const { data: existing } = await supabase.from("schools").select("id, name, location, type").ilike("name", newSchoolName.trim());
    if (existing && existing.length > 0) {
      setError("This school already exists! Select it from the search instead.");
      setSavingSchool(false);
      return;
    }
    const { data, error: err } = await supabase.from("schools").insert({
      name: newSchoolName.trim(),
      location: newSchoolLocation.trim() || null,
      type: newSchoolType,
    }).select().single();
    if (err) {
      setError(err.message);
    } else if (data) {
      setSchools((prev) => [...prev, data]);
      setSelectedSchool(data);
      setAddingNewSchool(false);
      setStep(2);
    }
    setSavingSchool(false);
  }

  // ── Save new teacher ──
  async function saveTeacher() {
    if (!newTeacherName.trim() || !selectedSchool) return;
    setSavingTeacher(true);
    setError(null);
    const { data: existing } = await supabase.from("teachers").select("id").eq("school_id", selectedSchool.id).ilike("name", newTeacherName.trim());
    if (existing && existing.length > 0) {
      setError("This teacher already exists at this school! Select them from the list.");
      setSavingTeacher(false);
      return;
    }
    const { data, error: err } = await supabase.from("teachers").insert({
      school_id: selectedSchool.id,
      name: newTeacherName.trim(),
      department: newTeacherDept || null,
      subjects: newTeacherSubjects ? newTeacherSubjects.split(",").map((s) => s.trim()) : [],
      grading_style: newTeacherGradingStyle.trim() || null,
    }).select().single();
    if (err) {
      setError(err.message);
    } else if (data) {
      setTeachers((prev) => [...prev, data]);
      setSelectedTeacher(data);
      setAddingNewTeacher(false);
      setStep(3);
    }
    setSavingTeacher(false);
  }

  // ── Google import ──
  async function connectGoogle() {
    await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly",
        redirectTo: `${window.location.origin}/contribute?tab=essays`,
      },
    });
  }

  async function importGoogleDoc() {
    if (!googleDocUrl.trim()) return;
    setImporting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token || providerToken;
      if (!token) {
        setError("Google token expired. Please reconnect your Google account.");
        setGoogleConnected(false);
        setImporting(false);
        return;
      }
      const res = await fetch("/api/import-google-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_url: googleDocUrl, provider_token: token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) setGoogleConnected(false);
        throw new Error(data.error || "Failed to import");
      }
      const result = await res.json();
      setEssayText(result.essay_text);
      setInlineComments(result.comments.length > 0 ? result.comments : [{ excerpt: "", comment: "" }]);
      setImported(true);
      if (result.doc_title && !essayPrompt) setEssayPrompt(result.doc_title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import document");
    }
    setImporting(false);
  }

  // ── Save essay ──
  async function saveTrainingEssay() {
    if (!essayText.trim() || !essayPrompt.trim() || !selectedTeacher || !selectedSchool) return;
    setSavingEssay(true);
    setError(null);
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: selectedSchool.id,
          teacher_id: selectedTeacher.id,
          essay_text: essayText,
          prompt: essayPrompt,
          letter_grade: essayGrade || null,
          numeric_grade: essayNumericGrade ? parseFloat(essayNumericGrade) : null,
          teacher_end_comment: teacherEndComment || null,
          inline_comments: inlineComments.filter((c) => c.excerpt.trim() && c.comment.trim()),
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to save"); }
      setEssaySuccess(true);
      setEssayText(""); setEssayPrompt(""); setEssayGrade(""); setEssayNumericGrade("");
      setTeacherEndComment(""); setInlineComments([{ excerpt: "", comment: "" }]);
      setImported(false); setGoogleDocUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setSavingEssay(false);
  }

  function addComment() { setInlineComments((prev) => [...prev, { excerpt: "", comment: "" }]); }
  function updateComment(i: number, field: "excerpt" | "comment", val: string) {
    setInlineComments((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  }
  function removeComment(i: number) { setInlineComments((prev) => prev.filter((_, idx) => idx !== i)); }

  const ic = "w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";
  const tc = "w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  const steps = [
    { num: 1, label: "School" },
    { num: 2, label: "Teacher" },
    { num: 3, label: "Upload Essay" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">Optimize Teacher</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress Steps */}
        <div className="flex items-center gap-3 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <button
                onClick={() => { if (s.num < step) { setStep(s.num); setError(null); } }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  step === s.num ? "bg-teal-600 text-white" :
                  step > s.num ? "bg-teal-900 text-teal-300 cursor-pointer hover:bg-teal-800" :
                  "bg-gray-800 text-gray-500"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.num ? "bg-teal-400 text-teal-950" : "bg-white/10"
                }`}>
                  {step > s.num ? "✓" : s.num}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600" />}
            </div>
          ))}
        </div>

        {error && <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-400">{error}</div>}

        {/* ══ STEP 1: SCHOOL ══ */}
        {step === 1 && !addingNewSchool && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Find Your School</h2>
            <p className="text-sm text-gray-400">Search for your school. If it&apos;s not in our system yet, you can add it.</p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={schoolSearch}
                onChange={(e) => { setSchoolSearch(e.target.value); setSelectedSchool(null); }}
                placeholder="Start typing your school name..."
                className="w-full h-11 pl-10 pr-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {schoolSearch.trim() && filteredSchools.length > 0 && (
              <div className="space-y-2">
                {filteredSchools.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSchool(s)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                      selectedSchool?.id === s.id
                        ? "bg-teal-950 border-teal-700"
                        : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{s.name}</div>
                      {s.location && <div className="text-xs text-gray-400 mt-0.5">{s.location}</div>}
                    </div>
                    {selectedSchool?.id === s.id && <CheckCircle className="w-5 h-5 text-teal-400" />}
                  </button>
                ))}
              </div>
            )}

            {schoolSearch.trim() && filteredSchools.length === 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center space-y-2">
                <p className="text-sm text-gray-400">No school found matching &quot;{schoolSearch}&quot;</p>
                <button
                  onClick={() => { setAddingNewSchool(true); setNewSchoolName(schoolSearch); setError(null); }}
                  className="text-sm text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add &quot;{schoolSearch}&quot; as a new school
                </button>
              </div>
            )}

            {selectedSchool && (
              <button
                onClick={() => { setStep(2); setError(null); }}
                className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                Continue with {selectedSchool.name} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ══ STEP 1b: ADD NEW SCHOOL ══ */}
        {step === 1 && addingNewSchool && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add a New School</h2>
              <button onClick={() => { setAddingNewSchool(false); setError(null); }} className="text-sm text-gray-400 hover:text-gray-300">Cancel</button>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">School Name *</label>
              <input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" className={ic} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Location</label>
                <input value={newSchoolLocation} onChange={(e) => setNewSchoolLocation(e.target.value)} placeholder="e.g. Springfield, CA" className={ic} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Type</label>
                <select value={newSchoolType} onChange={(e) => setNewSchoolType(e.target.value)} className={ic}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="charter">Charter</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>
            <button
              disabled={!newSchoolName.trim() || savingSchool}
              onClick={saveSchool}
              className="w-full h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {savingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add School &amp; Continue
            </button>
          </div>
        )}

        {/* ══ STEP 2: TEACHER ══ */}
        {step === 2 && !addingNewTeacher && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name}
            </div>
            <h2 className="text-lg font-semibold text-white">Select a Teacher</h2>

            {teachers.length > 0 ? (
              <>
                <p className="text-sm text-gray-400">Choose the teacher whose essay you want to upload, or add a new one.</p>
                <div className="space-y-2">
                  {teachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                        selectedTeacher?.id === t.id
                          ? "bg-teal-950 border-teal-700"
                          : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-gray-600"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{t.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{t.department}{t.subjects && t.subjects.length > 0 ? ` • ${t.subjects.join(", ")}` : ""}</div>
                      </div>
                      {selectedTeacher?.id === t.id && <CheckCircle className="w-5 h-5 text-teal-400" />}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">No teachers added yet at {selectedSchool?.name}. Add one below.</p>
            )}

            <button
              onClick={() => { setAddingNewTeacher(true); setError(null); }}
              className="text-sm text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add a new teacher
            </button>

            {selectedTeacher && (
              <button
                onClick={() => { setStep(3); setError(null); }}
                className="w-full h-11 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                Continue with {selectedTeacher.name} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ══ STEP 2b: ADD NEW TEACHER ══ */}
        {step === 2 && addingNewTeacher && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name}
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add a New Teacher</h2>
              {teachers.length > 0 && (
                <button onClick={() => { setAddingNewTeacher(false); setError(null); }} className="text-sm text-gray-400 hover:text-gray-300">Cancel</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher Name *</label>
                <input value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="e.g. Ms. Johnson" className={ic} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Department</label>
                <input value={newTeacherDept} onChange={(e) => setNewTeacherDept(e.target.value)} placeholder="e.g. English" className={ic} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Subjects (comma-separated)</label>
              <input value={newTeacherSubjects} onChange={(e) => setNewTeacherSubjects(e.target.value)} placeholder="e.g. AP English Lit, English 11" className={ic} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Grading Style</label>
              <textarea value={newTeacherGradingStyle} onChange={(e) => setNewTeacherGradingStyle(e.target.value)}
                placeholder="e.g. Strict about thesis statements, loves evidence-based arguments..." className={`${tc} min-h-[80px]`} />
            </div>
            <button
              disabled={!newTeacherName.trim() || savingTeacher}
              onClick={saveTeacher}
              className="w-full h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {savingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Teacher &amp; Continue
            </button>
          </div>
        )}

        {/* ══ STEP 3: UPLOAD ESSAY ══ */}
        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name} <ChevronRight className="w-3 h-3" /> {selectedTeacher?.name}
            </div>

            {essaySuccess ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-14 h-14 bg-emerald-950 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Essay Uploaded!</h2>
                <p className="text-sm text-gray-400">The AI will use this to learn {selectedTeacher?.name}&apos;s grading style.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setEssaySuccess(false); }} className="h-10 px-5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors">
                    Upload Another Essay
                  </button>
                  <Link href="/dashboard" className="h-10 px-5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium inline-flex items-center transition-colors">
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white">Upload a Graded Essay</h2>
                <p className="text-sm text-gray-400">Import from Google Docs to auto-extract the essay and teacher comments, or enter everything manually.</p>

                {/* Mode Toggle */}
                <div className="flex gap-2">
                  <button onClick={() => setImportMode("google")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importMode === "google" ? "bg-blue-600 text-white" : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"}`}>
                    <FileText className="w-4 h-4" />Google Docs
                  </button>
                  <button onClick={() => setImportMode("manual")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importMode === "manual" ? "bg-blue-600 text-white" : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"}`}>
                    <Upload className="w-4 h-4" />Manual Entry
                  </button>
                </div>

                {/* Google Import */}
                {importMode === "google" && (
                  <div className="space-y-4">
                    {!googleConnected ? (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center space-y-3">
                        <div className="w-12 h-12 bg-blue-950 rounded-xl flex items-center justify-center mx-auto">
                          <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-white">Connect Your Google Account</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">Link your Google account to import essays directly from Google Docs.</p>
                        <button onClick={connectGoogle}
                          className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Connect Google
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input value={googleDocUrl} onChange={(e) => setGoogleDocUrl(e.target.value)}
                              placeholder="Paste Google Docs URL..."
                              className="w-full h-10 pl-10 pr-3 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                          </div>
                          <button onClick={importGoogleDoc} disabled={!googleDocUrl.trim() || importing}
                            className="h-10 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
                            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Import
                          </button>
                        </div>
                        {imported && (
                          <div className="p-3 bg-blue-950 border border-blue-800 rounded-lg text-sm text-blue-400 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Imported! {inlineComments.filter((c) => c.comment.trim()).length} comment{inlineComments.filter((c) => c.comment.trim()).length !== 1 ? "s" : ""} found.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Essay Form */}
                {(importMode === "manual" || imported) && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1.5">Assignment Prompt *</label>
                      <textarea value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)} placeholder="What was the essay prompt?" className={`${tc} min-h-[60px]`} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1.5">
                        Essay Text {imported ? <span className="text-blue-400 font-normal">(imported)</span> : "*"}
                      </label>
                      <textarea value={essayText} onChange={(e) => setEssayText(e.target.value)} placeholder="Paste the full essay..." className={`${tc} min-h-[180px] font-mono leading-relaxed`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Grade (letter) *</label>
                        <input value={essayGrade} onChange={(e) => setEssayGrade(e.target.value)} placeholder="e.g. B+" className={ic} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 block mb-1.5">Numeric Grade</label>
                        <input type="number" value={essayNumericGrade} onChange={(e) => setEssayNumericGrade(e.target.value)} placeholder="e.g. 88" className={ic} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher&apos;s End Comment</label>
                      <textarea value={teacherEndComment} onChange={(e) => setTeacherEndComment(e.target.value)}
                        placeholder="The teacher's overall comment..." className={`${tc} min-h-[80px]`} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300 block mb-2">
                        Inline Comments {imported && <span className="text-blue-400 font-normal">(imported)</span>}
                      </label>
                      <div className="space-y-3">
                        {inlineComments.map((c, i) => (
                          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-400">Comment {i + 1}</span>
                              {inlineComments.length > 1 && <button onClick={() => removeComment(i)} className="text-xs text-red-500 hover:text-red-400">Remove</button>}
                            </div>
                            <input value={c.excerpt} onChange={(e) => updateComment(i, "excerpt", e.target.value)}
                              placeholder="The highlighted text..." className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                            <input value={c.comment} onChange={(e) => updateComment(i, "comment", e.target.value)}
                              placeholder="Teacher's comment..." className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                          </div>
                        ))}
                      </div>
                      <button onClick={addComment} className="mt-2 text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add comment
                      </button>
                    </div>
                    <button
                      disabled={!essayText.trim() || !essayPrompt.trim() || !essayGrade.trim() || savingEssay}
                      onClick={saveTrainingEssay}
                      className="w-full h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      {savingEssay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload Essay
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
      <ContributeContent />
    </Suspense>
  );
}
