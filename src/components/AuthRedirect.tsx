"use client";

import { useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function AuthRedirect() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Redirect already-authenticated users immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/dashboard";
    });

    // If the URL hash contains an access_token (implicit OAuth flow),
    // call getSession() so Supabase processes the hash fragment.
    if (window.location.hash.includes("access_token")) {
      supabase.auth.getSession();
    }

    // Handle OAuth callback — fires SIGNED_IN after token exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") window.location.href = "/dashboard";
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
