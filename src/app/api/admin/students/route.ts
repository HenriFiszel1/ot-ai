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
      // essays.student_id is ON DELETE SET NULL, so essays persist
      const { error } = await admin
        .from("students")
        .delete()
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Admin students API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
