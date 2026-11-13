import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

    if (token) {
      await prisma.customerSession.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(CUSTOMER_SESSION_COOKIE);
    return response;
  } catch (error: unknown) {
    console.error('Customer logout error:', error);
    return NextResponse.json({ error: 'Gagal keluar dari akun.' }, { status: 500 });
  }
}
