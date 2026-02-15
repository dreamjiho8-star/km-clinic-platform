import { ClinicProfile } from "@/types/clinic";

// 서버리스 환경에서는 인스턴스 간 공유되지 않으므로
// 단기 캐시 용도로만 사용 (같은 요청 내 중복 조회 방지)
let memoryCache: ClinicProfile | null = null;

export function setMemoryProfile(profile: ClinicProfile | null) {
  memoryCache = profile;
}

export function getMemoryProfile(): ClinicProfile | null {
  return memoryCache;
}

// 로컬 개발 전용 fs 함수 (Vercel에서는 읽기 전용이므로 자동 스킵)
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
  } catch (e) {
    console.warn("[storage] saveProfileLocal 실패:", e);
  }
}

export async function loadProfileLocal(): Promise<ClinicProfile | null> {
  if (typeof window !== "undefined") return null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const fp = path.join(process.cwd(), "data", "clinic-profile.json");
    if (!fs.existsSync(fp)) return null;
    return JSON.parse(fs.readFileSync(fp, "utf-8"));
  } catch (e) {
    console.warn("[storage] loadProfileLocal 실패:", e);
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
  } catch (e) {
    console.warn("[storage] deleteProfileLocal 실패:", e);
  }
}
