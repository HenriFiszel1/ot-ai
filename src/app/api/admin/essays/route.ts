import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, createAdminClient } from "@/lib/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, id } = await request.json();
    const admin = createAdminClient();

    if (action === "delete") {
      // Cascade: grade_predictions, inline_comments, end_comments are ON DELETE CASCADE
      const { error } = await admin
        .from("essays")
        .delete()
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Admin essays API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
