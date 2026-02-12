"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DbSchool, DbTeacher } from "@/lib/types";
import { GraduationCap, ArrowLeft, ArrowRight, Plus, Upload, CheckCircle, Loader2, Search, School, UserPlus, ChevronRight } from "lucide-react";

function StepIndicator({ current }: { current: number }) {
  const steps = ["Select School", "Select Teacher", "Upload Essays"];
  return (<div className="flex items-center gap-1 mb-8">{steps.map((label, i) => (<div key={label} className="flex items-center"><div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${i < current ? "bg-teal-950 text-teal-400" : i === current ? "bg-teal-600 text-white" : "bg-gray-800 text-gray-500"}`}><span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < current ? "bg-teal-800 text-teal-300" : i === current ? "bg-white/20 text-white" : "bg-gray-700 text-gray-500"}`}>{i < current ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}</span><span className="hidden sm:inline">{label}</span></div>{i < steps.length - 1 && <ChevronRight className={`w-4 h-4 mx-1 ${i < current ? "text-teal-400" : "text-gray-600"}`} />}</div>))}</div>);
}

function ContributeContent() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [schools, setSchools] = useState<DbSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<DbSchool | null>(null);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newSchoolLocation, setNewSchoolLocation] = useState("");
  const [newSchoolType, setNewSchoolType] = useState("public");
  const [savingSchool, setSavingSchool] = useState(false);
  const [teachers, setTeachers] = useState<DbTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<DbTeacher | null>(null);
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("English");
  const [newTeacherSubjects, setNewTeacherSubjects] = useState("");
  const [newTeacherStyle, setNewTeacherStyle] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [essayText, setEssayText] = useState("");
  const [essayPrompt, setEssayPrompt] = useState("");
  const [essayGrade, setEssayGrade] = useState("");
  const [essayNumericGrade, setEssayNumericGrade] = useState("");
  const [teacherEndComment, setTeacherEndComment] = useState("");
  const [inlineComments, setInlineComments] = useState<Array<{ excerpt: string; comment: string }>>([{ excerpt: "", comment: "" }]);
  const [savingEssay, setSavingEssay] = useState(false);
  const [essaySuccess, setEssaySuccess] = useState(false);

  useEffect(() => { async function load() { const { data } = await supabase.from("schools").select("*").order("name"); if (data) setSchools(data); setLoadingSchools(false); } load(); }, []);

  useEffect(() => { if (!selectedSchool) return; async function load() { setLoadingTeachers(true); const { data } = await supabase.from("teachers").select("*").eq("school_id", selectedSchool!.id).order("name"); if (data) setTeachers(data); setLoadingTeachers(false); } load(); }, [selectedSchool]);

  const filteredSchools = schools.filter((s) => s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || (s.location || "").toLowerCase().includes(schoolSearch.toLowerCase()));

  async function createSchool() { if (!newSchoolName.trim()) return; setSavingSchool(true); setError(null); const { data, error: err } = await supabase.from("schools").insert({ name: newSchoolName.trim(), location: newSchoolLocation.trim() || null, type: newSchoolType }).select().single(); if (err) { setError(err.message); } else if (data) { setSchools((prev) => [...prev, data]); setSelectedSchool(data); setShowCreateSchool(false); setStep(1); } setSavingSchool(false); }

  async function createTeacher() { if (!newTeacherName.trim() || !selectedSchool) return; setSavingTeacher(true); setError(null); const { data, error: err } = await supabase.from("teachers").insert({ school_id: selectedSchool.id, name: newTeacherName.trim(), department: newTeacherDept || null, subjects: newTeacherSubjects ? newTeacherSubjects.split(",").map((s) => s.trim()) : [], grading_style: newTeacherStyle.trim() || null }).select().single(); if (err) { setError(err.message); } else if (data) { setTeachers((prev) => [...prev, data]); setSelectedTeacher(data); setShowCreateTeacher(false); setStep(2); } setSavingTeacher(false); }

  async function uploadEssay() { if (!essayText.trim() || !essayPrompt.trim() || !selectedTeacher || !selectedSchool) return; setSavingEssay(true); setError(null); try { const res = await fetch("/api/training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ school_id: selectedSchool.id, teacher_id: selectedTeacher.id, essay_text: essayText, prompt: essayPrompt, letter_grade: essayGrade || null, numeric_grade: essayNumericGrade ? parseFloat(essayNumericGrade) : null, teacher_end_comment: teacherEndComment || null, inline_comments: inlineComments.filter((c) => c.excerpt.trim() && c.comment.trim()) }) }); if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "Failed to save"); } setEssaySuccess(true); setEssayText(""); setEssayPrompt(""); setEssayGrade(""); setEssayNumericGrade(""); setTeacherEndComment(""); setInlineComments([{ excerpt: "", comment: "" }]); } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); } setSavingEssay(false); }

  function addInlineComment() { setInlineComments((prev) => [...prev, { excerpt: "", comment: "" }]); }
  function updateInlineComment(i: number, field: "excerpt" | "comment", value: string) { setInlineComments((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))); }
  function removeInlineComment(i: number) { setInlineComments((prev) => prev.filter((_, idx) => idx !== i)); }
  const initials = (name: string) => name.split(" ").map((w) => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join("");

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
            <span className="text-lg font-semibold text-white tracking-tight">Optimize Teacher</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Dashboard</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <StepIndicator current={step} />
        {error && <div className="mb-6 p-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-400">{error}</div>}

        {step === 0 && (
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Find your school</h1>
            <p className="mt-1 text-gray-400">Search for your school below. If it doesn&apos;t exist yet, create it.</p>
            {!showCreateSchool ? (
              <>
                <div className="relative mt-6"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type="text" placeholder="Search schools..." value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} className="w-full h-11 pl-10 pr-4 border border-gray-700 bg-gray-900 text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                {loadingSchools ? (<div className="mt-8 flex justify-center"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>) : (<>
                  {filteredSchools.length === 0 ? (<p className="mt-8 text-sm text-gray-500 text-center">No schools found matching &ldquo;{schoolSearch}&rdquo;</p>) : (<div className="mt-4 space-y-2">{filteredSchools.map((school) => (<button key={school.id} onClick={() => { setSelectedSchool(school); setStep(1); }} className="w-full text-left bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-teal-700 hover:bg-teal-900/30 transition-all group"><div className="flex items-center justify-between"><div><div className="font-semibold text-white group-hover:text-teal-400 transition-colors">{school.name}</div>{school.location && <div className="text-sm text-gray-400 mt-0.5">{school.location}</div>}</div><div className="flex items-center gap-3"><span className="text-xs text-gray-400 capitalize bg-gray-800 px-2 py-0.5 rounded-full">{school.type}</span><ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-teal-500 transition-colors" /></div></div></button>))}</div>)}
                  <button onClick={() => setShowCreateSchool(true)} className="mt-6 w-full bg-gray-900 border border-dashed border-gray-700 rounded-lg p-4 text-sm text-gray-400 hover:text-teal-400 hover:border-teal-700 transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Can&apos;t find your school? Create it</button>
                </>)}
              </>
            ) : (
              <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Create a New School</h2>
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">School Name *</label><input value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)} placeholder="e.g. Lincoln High School" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Location</label><input value={newSchoolLocation} onChange={(e) => setNewSchoolLocation(e.target.value)} placeholder="e.g. Springfield, CA" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Type</label><select value={newSchoolType} onChange={(e) => setNewSchoolType(e.target.value)} className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"><option value="public">Public</option><option value="private">Private</option><option value="charter">Charter</option><option value="international">International</option></select></div></div>
                <div className="flex items-center gap-3"><button disabled={!newSchoolName.trim() || savingSchool} onClick={createSchool} className="h-10 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">{savingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create School</button><button onClick={() => setShowCreateSchool(false)} className="text-sm text-gray-400 hover:text-gray-300">Cancel</button></div>
              </div>
            )}
          </div>
        )}

        {step === 1 && selectedSchool && (
          <div>
            <button onClick={() => { setStep(0); setSelectedTeacher(null); }} className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to schools</button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Select your teacher</h1>
            <p className="mt-1 text-gray-400">at <span className="font-medium text-gray-300">{selectedSchool.name}</span> &mdash; pick an existing teacher or add a new one.</p>
            {!showCreateTeacher ? (<>
              {loadingTeachers ? (<div className="mt-8 flex justify-center"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>) : (<>
                {teachers.length === 0 ? (<p className="mt-8 text-sm text-gray-500 text-center">No teachers at this school yet. Be the first to add one!</p>) : (<div className="mt-6 space-y-3">{teachers.map((teacher) => (<button key={teacher.id} onClick={() => { setSelectedTeacher(teacher); setStep(2); }} className="w-full text-left bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-teal-700 hover:bg-teal-900/30 transition-all group"><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-full bg-teal-900 text-teal-400 flex items-center justify-center text-sm font-bold flex-shrink-0">{initials(teacher.name)}</div><div className="flex-1 min-w-0"><div className="flex items-center justify-between"><span className="font-semibold text-white group-hover:text-teal-400 transition-colors">{teacher.name}</span><ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-teal-500 transition-colors" /></div><div className="text-sm text-gray-400 mt-0.5">{teacher.department} &mdash; {teacher.subjects?.join(", ")}</div>{teacher.grading_style && <div className="text-xs text-gray-500 mt-2 italic">&ldquo;{teacher.grading_style}&rdquo;</div>}</div></div></button>))}</div>)}
                <button onClick={() => setShowCreateTeacher(true)} className="mt-6 w-full bg-gray-900 border border-dashed border-gray-700 rounded-lg p-4 text-sm text-gray-400 hover:text-teal-400 hover:border-teal-700 transition-all flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> Add a new teacher</button>
              </>)}
            </>) : (
              <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Add a Teacher at {selectedSchool.name}</h2>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher Name *</label><input value={newTeacherName} onChange={(e) => setNewTeacherName(e.target.value)} placeholder="e.g. Ms. Johnson" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Department</label><input value={newTeacherDept} onChange={(e) => setNewTeacherDept(e.target.value)} placeholder="e.g. English" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div></div>
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Subjects (comma-separated)</label><input value={newTeacherSubjects} onChange={(e) => setNewTeacherSubjects(e.target.value)} placeholder="e.g. AP English Lit, English 11" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Grading style description</label><textarea value={newTeacherStyle} onChange={(e) => setNewTeacherStyle(e.target.value)} placeholder="e.g. Strict about thesis statements, loves evidence, always comments on grammar..." className="w-full min-h-[80px] p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div className="flex items-center gap-3"><button disabled={!newTeacherName.trim() || savingTeacher} onClick={createTeacher} className="h-10 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">{savingTeacher ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add Teacher</button><button onClick={() => setShowCreateTeacher(false)} className="text-sm text-gray-400 hover:text-gray-300">Cancel</button></div>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedSchool && selectedTeacher && (
          <div>
            <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 mb-4"><ArrowLeft className="w-3.5 h-3.5" /> Back to teachers</button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Upload a graded essay</h1>
            <p className="mt-1 text-gray-400">for <span className="font-medium text-gray-300">{selectedTeacher.name}</span> at {selectedSchool.name} &mdash; this trains the AI to grade like them.</p>
            {essaySuccess && (<div className="mt-4 p-4 bg-emerald-950 border border-emerald-800 rounded-lg text-sm text-emerald-400 flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Essay uploaded! The AI will use this to learn {selectedTeacher.name}&apos;s style.</div><button onClick={() => setEssaySuccess(false)} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">Upload another</button></div>)}
            {!essaySuccess && (
              <div className="mt-6 space-y-4">
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Assignment Prompt *</label><textarea value={essayPrompt} onChange={(e) => setEssayPrompt(e.target.value)} placeholder="What was the essay prompt or question?" className="w-full min-h-[60px] p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Essay Text *</label><textarea value={essayText} onChange={(e) => setEssayText(e.target.value)} placeholder="Paste the full essay..." className="w-full min-h-[200px] p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono leading-relaxed text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Grade Received (letter) *</label><input value={essayGrade} onChange={(e) => setEssayGrade(e.target.value)} placeholder="e.g. B+" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div><div><label className="text-sm font-medium text-gray-300 block mb-1.5">Numeric Grade (optional)</label><input type="number" value={essayNumericGrade} onChange={(e) => setEssayNumericGrade(e.target.value)} placeholder="e.g. 88" className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div></div>
                <div><label className="text-sm font-medium text-gray-300 block mb-1.5">Teacher&apos;s End Comment</label><textarea value={teacherEndComment} onChange={(e) => setTeacherEndComment(e.target.value)} placeholder="Paste the teacher's overall comment on the essay..." className="w-full min-h-[80px] p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>
                <div>
                  <label className="text-sm font-medium text-gray-300 block mb-2">Inline Comments</label>
                  <p className="text-xs text-gray-500 mb-3">Add specific comments the teacher wrote on parts of the essay.</p>
                  <div className="space-y-3">{inlineComments.map((c, i) => (<div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-3 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-400">Comment {i + 1}</span>{inlineComments.length > 1 && <button onClick={() => removeInlineComment(i)} className="text-xs text-red-500 hover:text-red-400">Remove</button>}</div><input value={c.excerpt} onChange={(e) => updateInlineComment(i, "excerpt", e.target.value)} placeholder="Paste the part of the essay they commented on..." className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /><input value={c.comment} onChange={(e) => updateInlineComment(i, "comment", e.target.value)} placeholder="What did the teacher write?" className="w-full h-9 px-3 bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" /></div>))}</div>
                  <button onClick={addInlineComment} className="mt-2 text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add another comment</button>
                </div>
                <button disabled={!essayText.trim() || !essayPrompt.trim() || !essayGrade.trim() || savingEssay} onClick={uploadEssay} className="h-11 px-6 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">{savingEssay ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Essay</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (<Suspense fallback={<div className="min-h-screen bg-gray-950" />}><ContributeContent /></Suspense>);
}
