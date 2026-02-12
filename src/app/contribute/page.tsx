"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import {
  GraduationCap, ArrowLeft, ArrowRight, Plus, Upload,
  CheckCircle, Loader2, School, UserPlus, FileText, Link2, RefreshCw,
} from "lucide-react";

type Tab = "school" | "teacher" | "essays";

function ContributeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialTab = (searchParams.get("tab") as Tab) || "school";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const [schoolName, setSchoolName] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  const [schoolType, setSchoolType] = useState("public");
  const [savingSchool, setSavingSchool] = useState(false);
  const [schoolSuccess, setSchoolSuccess] = useState(false);

  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherDept, setTeacherDept] = useState("English");
  const [teacherSubjects, setTeacherSubjects] = useState("");
  const [teacherGradingStyle, setTeacherGradingStyle] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherSuccess, setTeacherSuccess] = useState(false);

  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [essaySchoolId, setEssaySchoolId] = useState("");
  const [essayTeacherId, setEssayTeacherId] = useState("");
  const [essayText, setEssayText] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayGrade, setEssayGrade] = useState("");
  const [essayNumericGrade, setEssayNumericGrade] = useState("");
  const [teacherEndComment, setTeacherEndComment] = useState("");
  const [teacherInlineComments, setTeacherInlineComments] = useState
    Array<{ excerpt: string; comment: string }>
  >([{ excerpt: "", comment: "" }]);
  const [savingEssay, setSavingEssay] = useState(false);
  const [essaySuccess, setEssaySuccess] = useState(false);

  const [importMode, setImportMode] = useState<"google" | "manual">("google");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [providerToken, setProviderToken] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("schools").select("*").order("name");
      if (data) setSchools(data);
    }
    load();
  }, [schoolSuccess]);

  useEffect(() => {
    if (!essaySchoolId) return;
    async function load() {
      const { data } = await supabase.from("teachers").select("*").eq("school_id", essaySchoolId).order("name");
      if (data) setTeachers(data);
    }
    load();
  }, [essaySchoolId]);

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
      setTeacherInlineComments(
        result.comments.length > 0 ? result.comments : [{ excerpt: "", comment: "" }]
      );
      setImported(true);
      if (result.doc_title && !essayPrompt) setEssayPrompt(result.doc_title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import document");
    }
    setImporting(false);
  }

  async function saveSchool() {
    if (!schoolName.trim()) return;
    setSavingSchool(true);
    setError(null);
    const { error: err } = await supabase.from("schools").insert({
      name: schoolName.trim(), location: schoolLocation.trim() || null, type: schoolType,
    });
    if (err) { setError(err.message); }
    else { setSchoolSuccess(true); setSchoolName(""); setSchoolLocation(""); setTimeout(() => setSchoolSuccess(false), 3000); }
    setSavingSchool(false);
  }

  async function saveTeacher() {
    if (!teacherName.trim() || !selectedSchoolId) return;
    setSavingTeacher(true);
    setError(null);
    const { error: err } = await supabase.from("teachers").insert({
      school_id: selectedSchoolId, name: teacherName.trim(), department: teacherDept || null,
      subjects: teacherSubjects ? teacherSubjects.split(",").map((s) => s.trim()) : [],
      grading_style: teacherGradingStyle.trim() || null,
    });
    if (err) { setError(err.message); }
    else { setTeacherSuccess(true); setTeacherName(""); setTeacherGradingStyle(""); setTeacherSubjects(""); setTimeout(() => setTeacherSuccess(false), 3000); }
    setSavingTeacher(false);
  }

  async function saveTrainingEssay() {
    if (!essayText.trim() || !essayPrompt.trim() || !essayTeacherId || !essaySchoolId) return;
    setSavingEssay(true);
    setError(null);
    try {
      const res = await fetch("/api/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: essaySchoolId, teacher_id: essayTeacherId, essay_text: essayText,
          prompt: essayPrompt, letter_grade: essayGrade || null,
          numeric_grade: essayNumericGrade ? parseFloat(essayNumericGrade) : null,
          teacher_end_comment: teacherEndComment || null,
          inline_comments: teacherInlineComments.filter((c) => c.excerpt.trim() && c.comment.trim()),
        }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to save"); }
      setEssaySuccess(true); setEssayText(""); setEssayPrompt(""); setEssayGrade(""); setEssayNumericGrade("");
      setTeacherEndComment(""); setTeacherInlineComments([{ excerpt: "", comment: "" }]);
      setImported(false); setGoogleDocUrl(""); setTimeout(() => setEssaySuccess(false), 3000);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    setSavingEssay(false);
  }

  function addInlineComment() { setTeacherInlineComments((prev) => [...prev, { excerpt: "", comment: "" }]); }
  function updateInlineComment(index: number, field: "excerpt" | "comment", value: string) {
    setTeacherInlineComments((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }
  function removeInlineComment(index: number) { setTeacherInlineComments((prev) => prev.filter((_, i) => i !== index)); }

  const tabs = [
    { id: "school" as Tab, label: "Add School", icon: School },
    { id: "teacher" as Tab, label: "Add Teacher", icon: UserPlus },
    { id: "essays" as Tab, label: "Upload Essays", icon: Upload },
  ];

  const ic = "w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";
  const tc = "w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white tracking-tight">Contribute</h1>
        <p className="mt-1 text-gray-400">Add your school, teachers, and upload past graded essays to train the AI.</p>

        <div className="mt-6 flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-teal-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 p-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-400">{error}</div>}

        {activeTab === "school" && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Add a New School</h2>
            <p className="text-sm text-gray-400">Add your school so you and other students can select it.</p>
            {schoolSuccess && <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-sm text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> School added successfully!</div>}
            <div><label className="text-sm font-medium text-gray-300 block mb-1.5">School Name *</label>
              <input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" className={ic} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Location</label>
                <input value={schoolLocation} onChange={(e) => setSchoolLocation(e.target.value)} placeholder="e.g. Springfield, CA" className={ic} /></div>
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Type</label>
                <select value={schoolType} onChange={(e) => setSchoolType(e.target.value)} className={ic}>
                  <option value="public">Public</option><option value="private">Private</option><option value="charter">Charter</option><option value="international">International</option>
                </select></div>
            </div>
            <button disabled={!schoolName.trim() || savingSchool} onClick={saveSchool}
              className="h-10 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              {savingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add School
            </button>
          </div>
        )}

        {activeTab === "teacher" && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Add a Teacher</h2>
            <p className="text-sm text-gray-400">Add a teacher at your school. Other students will be able to use this teacher&apos;s model too.</p>
            {teacherSuccess && <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-sm text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Teacher added! Now upload their graded essays to train the model.</div>}
            <div><label className="text-sm font-medium text-gray-300 block mb-1.5">School *</label>
              <select value={selectedSchoolId} onChange={(e) => setSelectedSchoolId(e.target.value)} className={ic}>
                <option value="">Select a school...</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher Name *</label>
                <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder="e.g. Ms. Johnson" className={ic} /></div>
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Department</label>
                <input value={teacherDept} onChange={(e) => setTeacherDept(e.target.value)} placeholder="e.g. English" className={ic} /></div>
            </div>
            <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Subjects (comma-separated)</label>
              <input value={teacherSubjects} onChange={(e) => setTeacherSubjects(e.target.value)} placeholder="e.g. AP English Lit, English 11, Creative Writing" className={ic} /></div>
            <div><label className="text-sm font-medium text-gray-300 block mb-1.5">How would you describe their grading style?</label>
              <textarea value={teacherGradingStyle} onChange={(e) => setTeacherGradingStyle(e.target.value)}
                placeholder="e.g. Very strict about thesis statements, loves evidence-based arguments..." className={`${tc} min-h-[100px]`} /></div>
            <button disabled={!teacherName.trim() || !selectedSchoolId || savingTeacher} onClick={saveTeacher}
              className="h-10 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              {savingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Teacher
            </button>
          </div>
        )}

        {activeTab === "essays" && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Upload a Past Graded Essay</h2>
              <p className="text-sm text-gray-400 mt-1">Import from Google Docs to auto-extract the essay and teacher comments, or enter everything manually.</p>
            </div>
            {essaySuccess && <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-lg text-sm text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Essay uploaded! The AI will use this to learn the teacher&apos;s style.</div>}

            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">School *</label>
                <select value={essaySchoolId} onChange={(e) => { setEssaySchoolId(e.target.value); setEssayTeacherId(""); }} className={ic}>
                  <option value="">Select school...</option>{schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher *</label>
                <select value={essayTeacherId} onChange={(e) => setEssayTeacherId(e.target.value)} className={ic} disabled={!essaySchoolId}>
                  <option value="">Select teacher...</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.department}</option>)}
                </select></div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setImportMode("google")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importMode === "google" ? "bg-blue-600 text-white" : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"}`}>
                <FileText className="w-4 h-4" />Import from Google Docs
              </button>
              <button onClick={() => setImportMode("manual")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importMode === "manual" ? "bg-blue-600 text-white" : "bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"}`}>
                <Upload className="w-4 h-4" />Manual Entry
              </button>
            </div>

            {importMode === "google" && (
              <div className="space-y-4">
                {!googleConnected ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-950 rounded-xl flex items-center justify-center mx-auto"><FileText className="w-6 h-6 text-blue-400" /></div>
                    <h3 className="text-sm font-semibold text-white">Connect Your Google Account</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">Link your Google account to import essays directly from Google Docs. We&apos;ll extract the text and all teacher comments automatically.</p>
                    <button onClick={connectGoogle}
                      className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Connect Google Account
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input value={googleDocUrl} onChange={(e) => setGoogleDocUrl(e.target.value)}
                          placeholder="Paste Google Docs URL (e.g. https://docs.google.com/document/d/...)"
                          className="w-full h-10 pl-10 pr-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <button onClick={importGoogleDoc} disabled={!googleDocUrl.trim() || importing}
                        className="h-10 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Import
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">The doc must be shared with your Google account. We&apos;ll import the essay text and all comments.</p>
                    {imported && (
                      <div className="p-3 bg-blue-950 border border-blue-800 rounded-lg text-sm text-blue-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Imported! {teacherInlineComments.filter((c) => c.comment.trim()).length} comment{teacherInlineComments.filter((c) => c.comment.trim()).length !== 1 ? "s" : ""} found. Review below and enter the grade.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(importMode === "manual" || imported) && (
              <div className="space-y-4">
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Assignment Prompt *</label>
                  <textarea value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)} placeholder="What was the essay prompt or question?" className={`${tc} min-h-[60px]`} /></div>

                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">
                  Essay Text {imported ? <span className="text-blue-400 font-normal">(imported from Google Docs)</span> : "*"}</label>
                  <textarea value={essayText} onChange={(e) => setEssayText(e.target.value)} placeholder="Paste the full essay..." className={`${tc} min-h-[200px] font-mono leading-relaxed`} /></div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Grade Received (letter) *</label>
                    <input value={essayGrade} onChange={(e) => setEssayGrade(e.target.value)} placeholder="e.g. B+" className={ic} /></div>
                  <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Numeric Grade (if known)</label>
                    <input type="number" value={essayNumericGrade} onChange={(e) => setEssayNumericGrade(e.target.value)} placeholder="e.g. 88" className={ic} /></div>
                </div>

                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher&apos;s End Comment</label>
                  <textarea value={teacherEndComment} onChange={(e) => setTeacherEndComment(e.target.value)}
                    placeholder="Paste the teacher's overall comment on the essay..." className={`${tc} min-h-[100px]`} /></div>

                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">
                    Teacher&apos;s Inline Comments {imported && <span className="text-blue-400 font-normal">(imported from Google Docs)</span>}
                  </label>
                  {!imported && <p className="text-xs text-gray-500 mb-3">Add specific comments the teacher wrote on parts of the essay.</p>}
                  <div className="space-y-3">
                    {teacherInlineComments.map((c, i) => (
                      <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-400">Comment {i + 1}</span>
                          {teacherInlineComments.length > 1 && <button onClick={() => removeInlineComment(i)} className="text-xs text-red-500 hover:text-red-400">Remove</button>}
                        </div>
                        <input value={c.excerpt} onChange={(e) => updateInlineComment(i, "excerpt", e.target.value)}
                          placeholder="The part of the essay they commented on..."
                          className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                        <input value={c.comment} onChange={(e) => updateInlineComment(i, "comment", e.target.value)}
                          placeholder="What did the teacher write?"
                          className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      </div>
                    ))}
                  </div>
                  <button onClick={addInlineComment} className="mt-2 text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add another comment
                  </button>
                </div>

                <button disabled={!essayText.trim() || !essayPrompt.trim() || !essayTeacherId || !essayGrade.trim() || savingEssay}
                  onClick={saveTrainingEssay}
                  className="h-10 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  {savingEssay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Essay
                </button>
              </div>
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
