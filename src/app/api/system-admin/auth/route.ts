import { NextRequest, NextResponse } from 'next/server';
import {
  SYSTEM_ADMIN_COOKIE,
  createSystemAdminToken,
  getSystemAdminOverview,
  verifySystemAdminPassword,
} from '@/lib/system-admin-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!password || !verifySystemAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Password System Admin salah.' },
        { status: 401 }
      );
    }

    const { token, expiresAt } = createSystemAdminToken();
    const overview = await getSystemAdminOverview();

    const response = NextResponse.json({
      success: true,
      overview,
    });

    response.cookies.set(SYSTEM_ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: unknown) {
    console.error('System admin auth error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses login System Admin.' },
      { status: 500 }
    );
  }
}
