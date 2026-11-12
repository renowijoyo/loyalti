import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, fonnteToken, testPhone } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId wajib diisi' }, { status: 400 });
    }

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        fonnteToken: fonnteToken?.trim() || null,
      },
    });

    let testResult = null;
    if (testPhone) {
      testResult = await sendWhatsAppMessage({
        phone: testPhone,
        message: `Halo! Ini adalah pesan uji coba integrasi WhatsApp Fonnte untuk *${updated.name}* melalui platform *Loyalti* 🚀`,
        merchantId: updated.id,
        customToken: updated.fonnteToken,
      });
    }

    return NextResponse.json({
      success: true,
      merchant: updated,
      testResult,
    });
  } catch (error: unknown) {
    console.error('Error updating merchant settings:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan' }, { status: 500 });
  }
}
