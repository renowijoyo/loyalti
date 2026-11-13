import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  CUSTOMER_SESSION_COOKIE,
  createCustomerSession,
  getCustomerAccountOverview,
  isValidEmail,
  normalizeEmail,
} from '@/lib/customer-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = typeof body?.email === 'string' ? body.email : '';
    const rawName = typeof body?.name === 'string' ? body.name.trim() : '';

    const email = normalizeEmail(rawEmail);
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid. Masukkan alamat email yang benar.' },
        { status: 400 }
      );
    }

    let existing = await prisma.customerAccount.findUnique({
      where: { email },
    });

    const isNewAccount = !existing;

    if (!existing) {
      existing = await prisma.customerAccount.create({
        data: {
          email,
          name: rawName || null,
        },
      });
    } else if (rawName && !existing.name) {
      existing = await prisma.customerAccount.update({
        where: { id: existing.id },
        data: { name: rawName },
      });
    }

    const { token, expiresAt } = await createCustomerSession(existing.id);
    const overview = await getCustomerAccountOverview(existing.id);

    const response = NextResponse.json({
      success: true,
      isNewAccount,
      overview,
    });

    response.cookies.set(CUSTOMER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: unknown) {
    console.error('Customer email auth error:', error);
    return NextResponse.json(
      { error: 'Gagal masuk atau membuat akun pelanggan.' },
      { status: 500 }
    );
  }
}
