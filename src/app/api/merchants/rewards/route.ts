import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantId,
      pointSystemId,
      title,
      description,
      imageUrl,
      pointsCost,
      quota,
      voucherValidityDays = 30,
      startAt,
      endAt,
    } = body;

    if (!merchantId || !title || !pointsCost || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'Data reward belum lengkap' },
        { status: 400 }
      );
    }

    const reward = await prisma.reward.create({
      data: {
        merchantId,
        pointSystemId: pointSystemId || null,
        title,
        description,
        imageUrl,
        pointsCost: Number(pointsCost),
        quota: quota ? Number(quota) : null,
        voucherValidityDays: Number(voucherValidityDays),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, reward });
  } catch (error: unknown) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Gagal membuat reward' }, { status: 500 });
  }
}
