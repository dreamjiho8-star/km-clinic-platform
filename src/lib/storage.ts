import { ClinicProfile } from "@/types/clinic";

// 프로덕션에서는 클라이언트(localStorage)에서 프로필을 관리
// API 호출 시 프로필을 body에 포함하여 전달
// 로컬 개발 시에는 fs 백업도 지원

let memoryCache: ClinicProfile | null = null;

export function setMemoryProfile(profile: ClinicProfile) {
  memoryCache = profile;
}

export function getMemoryProfile(): ClinicProfile | null {
  return memoryCache;
}

// 로컬 개발 전용 fs 함수
export async function saveProfileLocal(profile: ClinicProfile): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "clinic-profile.json"),
      JSON.stringify(profile, null, 2),
      "utf-8"
    );
  } catch {}
}

export async function loadProfileLocal(): Promise<ClinicProfile | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const fp = path.join(process.cwd(), "data", "clinic-profile.json");
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch {
    return null;
  }
}

export async function deleteProfileLocal(): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const fp = path.join(process.cwd(), "data", "clinic-profile.json");
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {}
}
