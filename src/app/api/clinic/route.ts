export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  setMemoryProfile,
  getMemoryProfile,
  saveProfileLocal,
  loadProfileLocal,
  deleteProfileLocal,
} from "@/lib/storage";
import { ClinicProfile } from "@/types/clinic";

export async function GET() {
  let profile = getMemoryProfile();
  if (!profile) {
    profile = await loadProfileLocal();
  }
  return NextResponse.json({ profile: profile || null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: ClinicProfile = {
      ...body,
      id: body.id || crypto.randomUUID(),
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMemoryProfile(profile);
    await saveProfileLocal(profile);
    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE() {
  setMemoryProfile(null as any);
  await deleteProfileLocal();
  return NextResponse.json({ success: true });
}
