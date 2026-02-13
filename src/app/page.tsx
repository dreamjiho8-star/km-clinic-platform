import { redirect } from "next/navigation";
import { loadProfileAsync } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await loadProfileAsync();
  if (profile) {
    redirect("/dashboard");
  } else {
    redirect("/setup");
  }
}
