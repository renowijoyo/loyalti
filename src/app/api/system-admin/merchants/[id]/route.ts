import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generatePosApiKey } from '@/lib/pos-auth';
import {
  getSystemAdminOverview,
  isSystemAdminAuthenticated,
} from '@/lib/system-admin-auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isSystemAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { qrExpiryMinutes, apiKeyAction } = body as {
      qrExpiryMinutes?: number;
      apiKeyAction?: 'regenerate' | 'revoke';
    };

    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Merchant tidak ditemukan.' }, { status: 404 });
    }

    const updateData: { qrExpiryMinutes?: number; apiKey?: string | null } = {};

    if (qrExpiryMinutes !== undefined) {
      const minutes = Number(qrExpiryMinutes);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
        return NextResponse.json(
          { error: 'Masa berlaku QR harus antara 1 hingga 1440 menit.' },
          { status: 400 }
        );
      }
      updateData.qrExpiryMinutes = Math.round(minutes);
    }

    let generatedApiKey: string | null = null;
    if (apiKeyAction === 'regenerate') {
      generatedApiKey = generatePosApiKey();
      updateData.apiKey = generatedApiKey;
    } else if (apiKeyAction === 'revoke') {
      updateData.apiKey = null;
    }

    await prisma.merchant.update({
      where: { id },
      data: updateData,
    });

    const overview = await getSystemAdminOverview();

    return NextResponse.json({
      success: true,
      generatedApiKey,
      overview,
    });
  } catch (error: unknown) {
    console.error('System admin merchant update error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui merchant.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await isSystemAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.merchant.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Merchant tidak ditemukan.' }, { status: 404 });
    }

    await prisma.merchant.delete({ where: { id } });

    const overview = await getSystemAdminOverview();
    return NextResponse.json({ success: true, overview });
  } catch (error: unknown) {
    console.error('System admin merchant delete error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus merchant.' },
      { status: 500 }
    );
  }
}
