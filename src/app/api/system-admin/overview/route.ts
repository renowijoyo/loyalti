import { NextResponse } from 'next/server';
import {
  getSystemAdminOverview,
  isSystemAdminAuthenticated,
} from '@/lib/system-admin-auth';

export async function GET() {
  try {
    const authenticated = await isSystemAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const overview = await getSystemAdminOverview();
    return NextResponse.json({ success: true, overview });
  } catch (error: unknown) {
    console.error('System admin overview error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data System Admin.' },
      { status: 500 }
    );
  }
}
