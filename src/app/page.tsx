"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("clinic-profile");
    if (stored) {
      router.push("/dashboard");
    } else {
      router.push("/setup");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}
