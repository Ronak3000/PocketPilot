import { NextResponse } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  const constitution = db.getConstitution();
  if (!constitution) {
    return NextResponse.json({ error: "Constitution not found" }, { status: 404 });
  }
  return NextResponse.json(constitution);
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json();
    const existing = db.getConstitution();
    if (!existing) {
      return NextResponse.json({ error: "Constitution not found" }, { status: 404 });
    }
    const updated = {
      ...existing,
      rules: updates.rules ?? existing.rules,
      updatedAt: new Date().toISOString(),
    };
    db.setConstitution(updated);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update constitution" }, { status: 500 });
  }
}
