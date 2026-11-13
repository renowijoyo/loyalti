import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getCustomerAccountOverview,
  getCustomerSession,
} from '@/lib/customer-auth';
import {
  buildPhoneBindNotificationMessage,
  formatPhoneForDisplay,
  normalizePhoneNumber,
  sendWhatsAppMessage,
} from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
    }

    const body = await req.json();
    const rawPhone = typeof body?.phone === 'string' ? body.phone : '';
    const rawLabel = typeof body?.label === 'string' ? body.label.trim() : '';

    const digitsOnly = rawPhone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 8) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak valid (minimal 8 digit).' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(rawPhone);

    const existingLink = await prisma.customerPhoneLink.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingLink) {
      if (existingLink.accountId === session.account.id) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp ini sudah terhubung ke akun Anda.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Nomor WhatsApp ini sudah terhubung ke akun email lain.' },
        { status: 409 }
      );
    }

    const phoneLink = await prisma.customerPhoneLink.create({
      data: {
        accountId: session.account.id,
        phone: normalizedPhone,
        label: rawLabel || null,
      },
    });

    // Send non-blocking confirmation message via Fonnte (simulated if no token)
    let notificationSent = false;
    try {
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      const displayPhone = formatPhoneForDisplay(normalizedPhone);
      const waResult = await sendWhatsAppMessage({
        phone: normalizedPhone,
        customerId: existingCustomer?.id,
        message: buildPhoneBindNotificationMessage({
          displayPhone,
          email: session.account.email,
          label: phoneLink.label,
          accountUrl: `${baseUrl}/account`,
        }),
      });
      notificationSent = waResult.success;
    } catch (waErr) {
      console.error('Non-fatal WA binding notification error:', waErr);
    }

    const overview = await getCustomerAccountOverview(session.account.id);

    return NextResponse.json({
      success: true,
      notificationSent,
      phoneLink: {
        id: phoneLink.id,
        phone: phoneLink.phone,
        label: phoneLink.label,
        createdAt: phoneLink.createdAt.toISOString(),
      },
      overview,
    });
  } catch (error: unknown) {
    console.error('Error binding WhatsApp number:', error);
    return NextResponse.json(
      { error: 'Gagal menghubungkan nomor WhatsApp.' },
      { status: 500 }
    );
  }
}
