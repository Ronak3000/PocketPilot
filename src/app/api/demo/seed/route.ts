import { NextResponse } from 'next/server';
import { seedAaravDemo } from '../../../../server/demo';

export async function POST() {
  const seededData = seedAaravDemo();
  return NextResponse.json({ success: true, data: seededData });
}
