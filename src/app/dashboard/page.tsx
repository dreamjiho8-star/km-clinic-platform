"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicProfile } from "@/types/clinic";
import DashboardShell from "@/components/DashboardShell";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage에서 먼저 확인
    const stored = localStorage.getItem("clinic-profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
        setLoading(false);
        return;
      } catch {}
    }

    // fallback: API에서 확인
    fetch("/api/clinic")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile(d.profile);
          localStorage.setItem("clinic-profile", JSON.stringify(d.profile));
        } else {
          router.push("/setup");
        }
      })
      .catch(() => router.push("/setup"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return <DashboardShell profile={profile} />;
}
