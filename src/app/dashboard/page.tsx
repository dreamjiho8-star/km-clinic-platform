import { redirect } from "next/navigation";
import { loadProfileAsync } from "@/lib/storage";
import DashboardShell from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await loadProfileAsync();
  if (!profile) {
    redirect("/setup");
  }
  return <DashboardShell profile={profile} />;
}
