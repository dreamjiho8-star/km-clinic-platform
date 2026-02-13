import { NextRequest, NextResponse } from "next/server";
import { saveProfileAsync, loadProfileAsync, deleteProfileAsync } from "@/lib/storage";
import { ClinicProfile } from "@/types/clinic";

export const runtime = "nodejs";

export async function GET() {
  const profile = await loadProfileAsync();
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
    await saveProfileAsync(profile);
    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE() {
  await deleteProfileAsync();
  return NextResponse.json({ success: true });
}
