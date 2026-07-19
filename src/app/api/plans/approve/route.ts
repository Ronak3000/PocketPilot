import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { ActionPlanSchema } from '../../../../contracts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ActionPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid plan input' }, { status: 400 });
    }
    
    db.savePlan(result.data.planId, result.data);
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve plan' }, { status: 500 });
  }
}
