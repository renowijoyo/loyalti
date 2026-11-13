import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getCustomerAccountOverview,
  getCustomerSession,
} from '@/lib/customer-auth';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.customerPhoneLink.findFirst({
      where: {
        id,
        accountId: session.account.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp tidak ditemukan di akun Anda.' },
        { status: 404 }
      );
    }

    await prisma.customerPhoneLink.delete({
      where: { id: existing.id },
    });

    const overview = await getCustomerAccountOverview(session.account.id);

    return NextResponse.json({
      success: true,
      overview,
    });
  } catch (error: unknown) {
    console.error('Error unbinding WhatsApp number:', error);
    return NextResponse.json(
      { error: 'Gagal memutuskan tautan nomor WhatsApp.' },
      { status: 500 }
    );
  }
}
