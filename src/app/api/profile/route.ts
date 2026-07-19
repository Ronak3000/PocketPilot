import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const profile = db.getProfile();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Run POST /api/reset to seed demo data." }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    const updated = db.patchProfile(updates);
    if (!updated) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    db.setProfile(body);
    return NextResponse.json(body);
  } catch {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
