import { NextResponse } from 'next/server';
import { SYSTEM_ADMIN_COOKIE } from '@/lib/system-admin-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SYSTEM_ADMIN_COOKIE);
  return response;
}
