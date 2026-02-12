import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Ensure the student row exists
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (!existingStudent) {
          await supabase.from("students").insert({
            auth_user_id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.email,
          });
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
