"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { AnimateIn } from "@/components/ui/motion";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#141414' }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-brand-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Check your email</h1>
          <p className="mt-2 text-sm text-gray-400">
            We sent a confirmation link to <strong className="text-gray-300">{email}</strong>. Click it to
            activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-brand-400 font-medium hover:text-brand-300 transition-colors duration-200"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const inputClass = "w-full h-11 px-3.5 bg-transparent border rounded-lg text-sm text-[#F2F2FF] placeholder:text-[rgba(255,255,255,0.5)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors duration-200 border-[rgba(255,255,255,0.12)]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: '#141414' }}>
      <AnimateIn>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-3 mb-10">
          <Image
            src="/optimize-ai-logo.png"
            alt="Optimize AI"
            width={140}
            height={36}
            className="h-9 w-auto"
          />
        </Link>

        <h1 className="text-2xl font-bold text-white tracking-[-0.02em] font-display">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Start getting teacher-specific essay feedback.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
              placeholder="Alex Johnson"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@school.edu"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="Min. 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 disabled:opacity-50 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: '#F2F2FF', color: '#141414' }}
          >
            {loading ? (
              <TextShimmer duration={1} className="text-sm [--base-color:theme(colors.white/0.5)] [--base-gradient-color:theme(colors.white)] dark:[--base-color:theme(colors.white/0.5)] dark:[--base-gradient-color:theme(colors.white)]">Creating account...</TextShimmer>
            ) : (
              <>
                Create account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-center" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium transition-opacity hover:opacity-80"
            style={{ color: '#F2F2FF' }}
          >
            Sign in
          </Link>
        </p>
      </div>
      </AnimateIn>
    </div>
  );
}
