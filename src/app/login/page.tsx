"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes:
          "https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.readonly",
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold text-white tracking-tight">
          Optimize Teacher
        </span>
      </Link>

      <h1 className="text-2xl font-bold text-white tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-gray-400">
        Sign in to analyze your essays.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-950 border border-red-800 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="mt-6 w-full h-10 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 rounded-lg text-sm font-medium flex items-center justify-center gap-3 transition-colors border border-gray-200"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-xs text-gray-500">or sign in with email</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      <form onSubmit={handleLogin} className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="you@school.edu" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full h-10 px-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full h-10 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign in</span> <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-400 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-teal-400 font-medium hover:underline">Sign up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      <Suspense fallback={<div className="w-full max-w-sm animate-pulse"><div className="h-8 bg-gray-800 rounded w-48 mb-8" /><div className="h-6 bg-gray-800 rounded w-32 mb-4" /><div className="space-y-4"><div className="h-10 bg-gray-800 rounded" /><div className="h-10 bg-gray-800 rounded" /><div className="h-10 bg-gray-800 rounded" /></div></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
