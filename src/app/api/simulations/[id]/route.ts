import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = db.getScenario(id);
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
  }
  return NextResponse.json(scenario);
}
