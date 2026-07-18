import { NextResponse } from 'next/server';
import { resetDemo } from '../../../../server/demo';

export async function POST() {
  resetDemo();
  return NextResponse.json({ success: true });
}
