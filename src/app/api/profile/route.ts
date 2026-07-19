import { NextResponse } from 'next/server';
import { db } from '../../../server/db';
import { FinancialProfileSchema } from '../../../contracts';

export async function GET() {
  const profile = db.getProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = FinancialProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid profile data', details: result.error }, { status: 400 });
    }
    db.setProfile(result.data);
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
