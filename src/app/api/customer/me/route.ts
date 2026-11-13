import { NextResponse } from 'next/server';
import {
  getCustomerAccountOverview,
  getCustomerSession,
} from '@/lib/customer-auth';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
    }

    const overview = await getCustomerAccountOverview(session.account.id);
    if (!overview) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, overview });
  } catch (error: unknown) {
    console.error('Error fetching customer overview:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data akun pelanggan.' },
      { status: 500 }
    );
  }
}
