"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import {
  ArrowLeft, ArrowRight, Plus, Upload, CheckCircle,
  Loader2, School, UserPlus, FileText, Search, ChevronRight, X,
} from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";

function ContributeContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);

  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<DbSchool | null>(null);
  const [addingNewSchool, setAddingNewSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolLocation, setNewSchoolLocation] = useState("");
  const [newSchoolType, setNewSchoolType] = useState("public");
  const [savingSchool, setSavingSchool] = useState(false);

  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<DbTeacher | null>(null);
  const [addingNewTeacher, setAddingNewTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("English");
  const [newTeacherSubjects, setNewTeacherSubjects] = useState("");
  const [newTeacherGradingStyle, setNewTeacherGradingStyle] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);

  const [importMode, setImportMode] = useState<"google" | "manual">("google");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [essayText, setEssayText] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayGrade, setEssayGrade] = useState("");
  const [essayNumericGrade, setEssayNumericGrade] = useState("");
  const [teacherEndComment, setTeacherEndComment] = useState("");
  const [rubric, setRubric] = useState("");
  const [inlineComments, setInlineComments] = useState<Array<{ excerpt: string; comment: string }>>([{ excerpt: "", comment: "" }]);
  const [savingEssay, setSavingEssay] = useState(false);
  const [essaySuccess, setEssaySuccess] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("schools").select("*").order("name");
      if (data) setSchools(data);
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedSchool) return;
    async function load() {
      const { data } = await supabase.from("teachers").select("*").eq("school_id", selectedSchool!.id).order("name");
      if (data) setTeachers(data);
    }
    load();
  }, [selectedSchool]);

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

    // Listen for auth state changes to capture fresh provider_token after OAuth redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        setProviderToken(session.provider_token);
        setGoogleConnected(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "essays" && selectedSchool && selectedTeacher) {
      setStep(3);
    }
  }, [searchParams]);

  const filteredSchools = schoolSearch.trim()
    ? schools.filter((s) => s.name.toLowerCase().includes(schoolSearch.toLowerCase()))
    : [];

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
    if (err) { setError(err.message); }
    else if (data) {
      setSchools((prev) => [...prev, data]);
      setSelectedSchool(data);
      setAddingNewSchool(false);
      setStep(2);
    }
    setSavingSchool(false);
  }

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
    if (err) { setError(err.message); }
    else if (data) {
      setTeachers((prev) => [...prev, data]);
      setSelectedTeacher(data);
      setAddingNewTeacher(false);
      setStep(3);
    }
    setSavingTeacher(false);
  }

  async function connectGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly",
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent("/contribute?tab=essays")}`,
      },
    });
    if (error) setError(error.message);
  }

  async function importGoogleDoc(docId: string) {
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
        body: JSON.stringify({ doc_id: docId, provider_token: token }),
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

  async function openPicker() {
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.provider_token || providerToken;
    if (!token) {
      setError("Google token expired. Please reconnect your Google account.");
      setGoogleConnected(false);
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).gapi) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://apis.google.com/js/api.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Google Picker"));
        document.head.appendChild(script);
      });
      await new Promise<void>((resolve) => {
        (window as any).gapi.load("picker", { callback: resolve });
      });
      const google = (window as any).google;
      const view = new google.picker.DocsView(google.picker.ViewId.DOCUMENTS)
        .setMimeTypes("application/vnd.google-apps.document");
      const builder = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            const doc = data.docs[0];
            importGoogleDoc(doc.id);
          }
        });
      if (process.env.NEXT_PUBLIC_GOOGLE_APP_ID) {
        builder.setAppId(process.env.NEXT_PUBLIC_GOOGLE_APP_ID);
      }
      builder.build().setVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open file picker");
    }
  }

  async function saveTrainingEssay() {
    if (!essayText.trim() || !selectedTeacher || !selectedSchool) return;
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
          rubric: rubric || null,
          inline_comments: inlineComments.filter((c) => c.excerpt.trim() && c.comment.trim()),
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to save"); }
      setEssaySuccess(true);
      setEssayText(""); setEssayPrompt(""); setEssayGrade(""); setEssayNumericGrade("");
      setTeacherEndComment(""); setRubric(""); setInlineComments([{ excerpt: "", comment: "" }]);
      setImported(false);
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

  const ic = "w-full h-11 px-3.5 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200" + " border-[rgba(255,255,255,0.12)]";
  const tc = "w-full p-3.5 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200 border-[rgba(255,255,255,0.12)]";

  const steps = [
    { num: 1, label: "School" },
    { num: 2, label: "Teacher" },
    { num: 3, label: "Upload Essay" },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#141414' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/optimize-ai-logo.png" alt="Optimize AI" width={120} height={30} className="h-6 w-auto" />
          </Link>
          <Link href="/dashboard" className="text-sm flex items-center gap-1.5 transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.45)' }}>
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
                onClick={() => { if (s.num < step) { setStep(s.num); setError(null); } }}
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
                  {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.15)' }} />}
            </div>
          ))}
        </div>

        {error && <div className="mb-6 py-3 px-4 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}

        {/* STEP 1: SCHOOL */}
        {step === 1 && !addingNewSchool && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-lg font-semibold font-display" style={{ color: '#F2F2FF' }}>Find Your School</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Search for your school. If it&apos;s not in our system yet, you can add it.</p>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input
                value={schoolSearch}
                onChange={(e) => { setSchoolSearch(e.target.value); setSelectedSchool(null); }}
                placeholder="Start typing your school name..."
                className={`w-full h-12 pl-10 pr-3 ${ic}`}
                autoFocus
              />
            </div>

            {schoolSearch.trim() && filteredSchools.length > 0 && (
              <div className="space-y-2">
                {filteredSchools.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => { setSelectedSchool(s); setSchoolSearch(""); }}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                    style={{
                      background: selectedSchool?.id === s.id ? 'rgba(99,152,255,0.07)' : 'transparent',
                      border: selectedSchool?.id === s.id ? '1px solid rgba(99,152,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#F2F2FF' }}>{s.name}</div>
                      {s.location && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.location}</div>}
                    </div>
                    {selectedSchool?.id === s.id && <CheckCircle className="w-5 h-5" style={{ color: '#6398FF' }} />}
                  </button>
                ))}
              </div>
            )}

            {schoolSearch.trim() && filteredSchools.length === 0 && (
              <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No school found matching &quot;{schoolSearch}&quot;</p>
              </div>
            )}

            <button
              onClick={() => { setAddingNewSchool(true); setNewSchoolName(schoolSearch); setError(null); }}
              className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: 'rgba(99,152,255,0.08)', border: '1px solid rgba(99,152,255,0.2)', color: '#6398FF' }}
            >
              <Plus className="w-4 h-4" /> Add New School
            </button>

            {selectedSchool && (
              <button
                onClick={() => { setStep(2); setError(null); }}
                className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background: '#F2F2FF', color: '#141414' }}
              >
                Continue with {selectedSchool.name} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 1b: ADD NEW SCHOOL */}
        {step === 1 && addingNewSchool && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-display" style={{ color: '#F2F2FF' }}>Add a New School</h2>
              <button onClick={() => { setAddingNewSchool(false); setError(null); }} className="text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.45)' }}>Cancel</button>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>School Name *</label>
              <input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" className={ic} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Location</label>
                <input value={newSchoolLocation} onChange={(e) => setNewSchoolLocation(e.target.value)} placeholder="e.g. Springfield, CA" className={ic} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Type</label>
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
              className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              {savingSchool ? <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Saving school...</TextShimmer> : <><Plus className="w-4 h-4" /> Add School &amp; Continue</>}
            </button>
          </div>
        )}

        {/* STEP 2: TEACHER */}
        {step === 2 && !addingNewTeacher && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name}
            </div>
            <h2 className="text-lg font-semibold font-display" style={{ color: '#F2F2FF' }}>Select a Teacher</h2>

            {teachers.length > 0 ? (
              <>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Choose the teacher whose essay you want to upload, or add a new one.</p>
                <div className="space-y-2">
                  {teachers.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between"
                      style={{
                        background: selectedTeacher?.id === t.id ? 'rgba(99,152,255,0.07)' : 'transparent',
                        border: selectedTeacher?.id === t.id ? '1px solid rgba(99,152,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#F2F2FF' }}>{t.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.department}{t.subjects && t.subjects.length > 0 ? ` · ${t.subjects.join(", ")}` : ""}</div>
                      </div>
                      {selectedTeacher?.id === t.id && <CheckCircle className="w-5 h-5" style={{ color: '#6398FF' }} />}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No teachers added yet at {selectedSchool?.name}. Add one below.</p>
            )}

            <button
              onClick={() => { setAddingNewTeacher(true); setError(null); }}
              className="w-full h-11 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
              style={{ background: 'rgba(99,152,255,0.08)', border: '1px solid rgba(99,152,255,0.2)', color: '#6398FF' }}
            >
              <Plus className="w-4 h-4" /> Add New Teacher
            </button>

            {selectedTeacher && (
              <button
                onClick={() => { setStep(3); setError(null); }}
                className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background: '#F2F2FF', color: '#141414' }}
              >
                Continue with {selectedTeacher.name} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* STEP 2b: ADD NEW TEACHER */}
        {step === 2 && addingNewTeacher && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name}
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold font-display" style={{ color: '#F2F2FF' }}>Add a New Teacher</h2>
              {teachers.length > 0 && (
                <button onClick={() => { setAddingNewTeacher(false); setError(null); }} className="text-sm transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.45)' }}>Cancel</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Teacher Name *</label>
                <input value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="e.g. Ms. Johnson" className={ic} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Department</label>
                <input value={newTeacherDept} onChange={(e) => setNewTeacherDept(e.target.value)} placeholder="e.g. English" className={ic} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Subjects (comma-separated)</label>
              <input value={newTeacherSubjects} onChange={(e) => setNewTeacherSubjects(e.target.value)} placeholder="e.g. AP English Lit, English 11" className={ic} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Grading Style</label>
              <textarea value={newTeacherGradingStyle} onChange={(e) => setNewTeacherGradingStyle(e.target.value)}
                placeholder="e.g. Strict about thesis statements, loves evidence-based arguments..." className={`${tc} min-h-[80px]`} />
            </div>
            <button
              disabled={!newTeacherName.trim() || savingTeacher}
              onClick={saveTeacher}
              className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#F2F2FF', color: '#141414' }}
            >
              {savingTeacher ? <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Saving teacher...</TextShimmer> : <><UserPlus className="w-4 h-4" /> Add Teacher &amp; Continue</>}
            </button>
          </div>
        )}

        {/* STEP 3: UPLOAD ESSAY */}
        {step === 3 && (
          <div className="rounded-2xl p-7 space-y-5 animate-[fadeIn_0.3s_ease-out]" style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2 text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <School className="w-3.5 h-3.5" /> {selectedSchool?.name} <ChevronRight className="w-3 h-3" /> {selectedTeacher?.name}
            </div>

            {essaySuccess ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#34d399' }} />
                </div>
                <h2 className="text-xl font-semibold font-display" style={{ color: '#F2F2FF' }}>Essay Uploaded!</h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>The AI will use this to learn {selectedTeacher?.name}&apos;s grading style.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setEssaySuccess(false); }}
                    className="h-11 px-6 rounded-xl text-sm font-semibold transition-colors duration-200"
                    style={{ background: '#F2F2FF', color: '#141414' }}
                  >
                    Upload Another Essay
                  </button>
                  <Link
                    href="/dashboard"
                    className="h-11 px-6 rounded-xl text-sm font-medium inline-flex items-center transition-colors duration-200"
                    style={{ background: 'transparent', color: '#F2F2FF', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold font-display" style={{ color: '#F2F2FF' }}>Upload a Graded Essay</h2>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Upload a past essay with teacher feedback and the grade you received — this trains the AI to predict how {selectedTeacher?.name} grades.</p>

                {/* Import mode toggle */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => { setImportMode("google"); setError(null); }}
                    className="flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ background: importMode === "google" ? '#F2F2FF' : 'transparent', color: importMode === "google" ? '#141414' : 'rgba(255,255,255,0.5)' }}
                  >
                    Import from Google Drive
                  </button>
                  <button
                    onClick={() => { setImportMode("manual"); setError(null); }}
                    className="flex-1 h-9 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ background: importMode === "manual" ? '#F2F2FF' : 'transparent', color: importMode === "manual" ? '#141414' : 'rgba(255,255,255,0.5)' }}
                  >
                    Enter Manually
                  </button>
                </div>

                {/* ── GOOGLE DRIVE MODE ── */}
                {importMode === "google" && (
                  <>
                    {!googleConnected ? (
                      <div className="rounded-xl p-6 text-center space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: 'rgba(99,152,255,0.1)' }}>
                          <FileText className="w-6 h-6" style={{ color: '#6398FF' }} />
                        </div>
                        <h3 className="text-sm font-semibold" style={{ color: '#F2F2FF' }}>Connect Your Google Account</h3>
                        <p className="text-xs max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>Link your Google account to import essays and teacher comments directly from Google Docs.</p>
                        <button onClick={connectGoogle}
                          className="h-11 px-6 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200"
                          style={{ background: '#F2F2FF', color: '#141414' }}>
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
                      <div className="space-y-4">
                        <button onClick={openPicker} disabled={importing || imported}
                          className="w-full h-12 disabled:opacity-40 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-200"
                          style={{ background: 'transparent', color: '#F2F2FF', border: '1px solid rgba(255,255,255,0.15)' }}>
                          {importing ? <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Importing from Drive...</TextShimmer> : <><FileText className="w-4 h-4" /> Choose from Google Drive</>}
                        </button>

                        {imported && (
                          <>
                            <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'rgba(99,152,255,0.1)', border: '1px solid rgba(99,152,255,0.2)', color: '#6398FF' }}>
                              <CheckCircle className="w-4 h-4" />
                              Imported! Essay and {inlineComments.filter((c) => c.comment.trim()).length} teacher comment{inlineComments.filter((c) => c.comment.trim()).length !== 1 ? "s" : ""} extracted. Review the details below.
                            </div>

                            {/* Assignment prompt */}
                            <div>
                              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Assignment Prompt</label>
                              <input value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)} placeholder="What was the essay assignment?" className={ic} />
                            </div>

                            {/* Grades */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Letter Grade</label>
                                <input value={essayGrade} onChange={(e) => setEssayGrade(e.target.value)} placeholder="e.g. B+" className={ic} />
                              </div>
                              <div>
                                <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Numeric Grade *</label>
                                <input type="number" value={essayNumericGrade} onChange={(e) => setEssayNumericGrade(e.target.value)} placeholder="e.g. 88" className={ic} />
                              </div>
                            </div>

                            {/* Teacher end comment */}
                            <div>
                              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Teacher&apos;s End Comment</label>
                              <textarea value={teacherEndComment} onChange={(e) => setTeacherEndComment(e.target.value)}
                                placeholder="Paste the overall comment your teacher left at the end of the essay..."
                                className={`${tc} min-h-[80px]`} />
                            </div>

                            {/* Inline comments preview */}
                            {inlineComments.some((c) => c.comment.trim()) && (
                              <div>
                                <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  Inline Comments ({inlineComments.filter((c) => c.comment.trim()).length} extracted)
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {inlineComments.filter((c) => c.comment.trim()).map((c, i) => (
                                    <div key={i} className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                      {c.excerpt && <p className="italic" style={{ color: 'rgba(255,255,255,0.45)' }}>&ldquo;{c.excerpt.slice(0, 80)}{c.excerpt.length > 80 ? "…" : ""}&rdquo;</p>}
                                      <p style={{ color: '#F2F2FF' }}>{c.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Rubric */}
                            <div>
                              <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Rubric</label>
                              <textarea value={rubric} onChange={(e) => setRubric(e.target.value)}
                                placeholder="Paste the rubric or grading criteria for this assignment..."
                                className={`${tc} min-h-[80px]`} />
                              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Optional. Helps the AI understand grading criteria.</p>
                            </div>

                            {/* Submit */}
                            <button
                              disabled={!essayNumericGrade.trim() || savingEssay}
                              onClick={saveTrainingEssay}
                              className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ background: '#F2F2FF', color: '#141414' }}
                            >
                              {savingEssay ? <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Uploading essay...</TextShimmer> : <><Upload className="w-4 h-4" /> Upload Essay</>}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ── MANUAL ENTRY MODE ── */}
                {importMode === "manual" && (
                  <div className="space-y-4">
                    {/* Essay text */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Essay Text *</label>
                      <textarea value={essayText} onChange={(e) => setEssayText(e.target.value)}
                        placeholder="Paste the full essay text here..."
                        className={`${tc} min-h-[160px]`} />
                    </div>

                    {/* Assignment prompt */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Assignment Prompt</label>
                      <input value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)} placeholder="What was the essay assignment?" className={ic} />
                    </div>

                    {/* Grades */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Letter Grade</label>
                        <input value={essayGrade} onChange={(e) => setEssayGrade(e.target.value)} placeholder="e.g. B+" className={ic} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Numeric Grade *</label>
                        <input type="number" value={essayNumericGrade} onChange={(e) => setEssayNumericGrade(e.target.value)} placeholder="e.g. 88" className={ic} />
                      </div>
                    </div>

                    {/* Teacher end comment */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Teacher&apos;s End Comment</label>
                      <textarea value={teacherEndComment} onChange={(e) => setTeacherEndComment(e.target.value)}
                        placeholder="Paste the overall comment your teacher left at the end of the essay..."
                        className={`${tc} min-h-[80px]`} />
                    </div>

                    {/* Inline comments */}
                    <div>
                      <label className="text-sm font-medium block mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Inline Comments</label>
                      <div className="space-y-2">
                        {inlineComments.map((c, i) => (
                          <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Comment {i + 1}</span>
                              {inlineComments.length > 1 && (
                                <button onClick={() => removeComment(i)} className="transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <input value={c.excerpt} onChange={(e) => updateComment(i, "excerpt", e.target.value)}
                              placeholder="Essay excerpt the comment refers to..." className={ic} />
                            <input value={c.comment} onChange={(e) => updateComment(i, "comment", e.target.value)}
                              placeholder="Teacher's comment on that excerpt..." className={ic} />
                          </div>
                        ))}
                      </div>
                      <button onClick={addComment} className="mt-2 text-sm font-medium inline-flex items-center gap-1 transition-colors duration-200" style={{ color: '#6398FF' }}>
                        <Plus className="w-4 h-4" /> Add another comment
                      </button>
                    </div>

                    {/* Rubric */}
                    <div>
                      <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Rubric</label>
                      <textarea value={rubric} onChange={(e) => setRubric(e.target.value)}
                        placeholder="Paste the rubric or grading criteria for this assignment..."
                        className={`${tc} min-h-[80px]`} />
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Optional. Helps the AI understand grading criteria.</p>
                    </div>

                    {/* Submit */}
                    <button
                      disabled={!essayText.trim() || !essayNumericGrade.trim() || savingEssay}
                      onClick={saveTrainingEssay}
                      className="w-full h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#F2F2FF', color: '#141414' }}
                    >
                      {savingEssay ? <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Uploading essay...</TextShimmer> : <><Upload className="w-4 h-4" /> Upload Essay</>}
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
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#141414' }} />}>
      <ContributeContent />
    </Suspense>
  );
}
