import { ClinicProfile } from "@/types/clinic";

// Vercel KV (배포 환경) 또는 로컬 JSON (개발 환경)
const isVercel = process.env.VERCEL === "1" || process.env.KV_REST_API_URL;

// ─── Vercel KV 방식 ───
async function kvSet(key: string, value: any): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
}

async function kvGet(key: string): Promise<any> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function kvDel(key: string): Promise<void> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return;
  await fetch(`${url}/del/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── 로컬 fs 방식 ───
function getFs() {
  // 동적 import로 Vercel edge에서 에러 방지
  const fs = require("fs");
  const path = require("path");
  const DATA_DIR = path.join(process.cwd(), "data");
  const PROFILE_PATH = path.join(DATA_DIR, "clinic-profile.json");
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  return { fs, PROFILE_PATH };
}

// ─── 통합 인터페이스 ───
export async function saveProfileAsync(profile: ClinicProfile): Promise<void> {
  if (isVercel) {
    await kvSet("clinic-profile", profile);
  } else {
    const { fs, PROFILE_PATH } = getFs();
    fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2), "utf-8");
  }
}

export async function loadProfileAsync(): Promise<ClinicProfile | null> {
  if (isVercel) {
    return await kvGet("clinic-profile");
  } else {
    const { fs, PROFILE_PATH } = getFs();
    if (!fs.existsSync(PROFILE_PATH)) return null;
    try {
      const raw = fs.readFileSync(PROFILE_PATH, "utf-8");
      return JSON.parse(raw) as ClinicProfile;
    } catch {
      return null;
    }
  }
}

export async function deleteProfileAsync(): Promise<void> {
  if (isVercel) {
    await kvDel("clinic-profile");
  } else {
    const { fs, PROFILE_PATH } = getFs();
    if (fs.existsSync(PROFILE_PATH)) {
      fs.unlinkSync(PROFILE_PATH);
    }
  }
}

// 동기 함수 (SSR 페이지용 — 로컬 전용)
export function loadProfile(): ClinicProfile | null {
  if (isVercel) return null; // Vercel에서는 async 사용
  const { fs, PROFILE_PATH } = getFs();
  if (!fs.existsSync(PROFILE_PATH)) return null;
  try {
    const raw = fs.readFileSync(PROFILE_PATH, "utf-8");
    return JSON.parse(raw) as ClinicProfile;
  } catch {
    return null;
  }
}
