import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  return user.email === process.env.ADMIN_EMAIL;
}

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
