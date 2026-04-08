import { createAdminClient } from "@/lib/admin";
import SchoolsClient from "./SchoolsClient";

export default async function AdminSchoolsPage() {
  const supabase = createAdminClient();

  let schools: Record<string, unknown>[] = [];
  let fetchError = false;
  try {
    const { data } = await supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });
    schools = (data as Record<string, unknown>[]) ?? [];
  } catch (e) {
    console.error("Failed to load schools:", e);
    fetchError = true;
  }

  return <SchoolsClient data={schools} fetchError={fetchError} />;
}
