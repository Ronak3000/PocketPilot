import { NextResponse } from 'next/server';
import { db } from '../../../server/db';
import { MoneyConstitutionSchema } from '../../../contracts';

export async function GET() {
  const constitution = db.getConstitution();
  if (!constitution) {
    return NextResponse.json({ error: 'Constitution not found' }, { status: 404 });
  }
  return NextResponse.json(constitution);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = MoneyConstitutionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid constitution data', details: result.error }, { status: 400 });
    }
    db.setConstitution(result.data);
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update constitution' }, { status: 500 });
  }
}
