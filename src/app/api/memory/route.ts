import { db } from "@/server/db";

export async function GET() {
  const profile = db.getProfile();
  if (!profile) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }
  return Response.json({
    memories: db.getMemories(profile.id),
    settings: db.getPersonalization(),
  });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid settings." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid settings." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const updates: {
    memoryEnabled?: boolean;
    humorEnabled?: boolean;
    roastLevel?: 0 | 1;
  } = {};
  if (typeof input.memoryEnabled === "boolean") {
    updates.memoryEnabled = input.memoryEnabled;
  }
  if (typeof input.humorEnabled === "boolean") {
    updates.humorEnabled = input.humorEnabled;
  }
  if (input.roastLevel === 0 || input.roastLevel === 1) {
    updates.roastLevel = input.roastLevel;
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid settings supplied." }, { status: 400 });
  }
  return Response.json({ settings: db.patchPersonalization(updates) });
}

export async function DELETE(request: Request) {
  const profile = db.getProfile();
  if (!profile) {
    return Response.json({ error: "Profile not found." }, { status: 404 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return Response.json(
      { error: "Supply a query or set all to true." },
      { status: 400 },
    );
  }
  if (typeof parsed !== "object" || parsed === null) {
    return Response.json(
      { error: "Supply a query or set all to true." },
      { status: 400 },
    );
  }
  const body = parsed as { query?: unknown; all?: unknown };
  if (body.all !== true && typeof body.query !== "string") {
    return Response.json(
      { error: "Supply a query or set all to true." },
      { status: 400 },
    );
  }
  const removed =
    body.all === true
      ? db.clearMemories(profile.id)
      : db.forgetMemories(profile.id, body.query as string);
  return Response.json({ removed });
}
