import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantId,
      promotionId,
      name,
      description,
      icon = 'star',
      ruleType = 'FIXED',
      pointsPerUnit = 1,
      amountPerPoint = 10000,
      minSpendAmount = 0,
      maxPointsPerTx = 10,
      pointValidityDays = 90,
      startAt,
      endAt,
    } = body;

    if (!merchantId || !name || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'merchantId, name, startAt, dan endAt wajib diisi' },
        { status: 400 }
      );
    }

    const pointSystem = await prisma.pointSystem.create({
      data: {
        merchantId,
        promotionId: promotionId || null,
        name,
        description,
        icon,
        ruleType,
        pointsPerUnit: Number(pointsPerUnit),
        amountPerPoint: Number(amountPerPoint),
        minSpendAmount: Number(minSpendAmount),
        maxPointsPerTx: Number(maxPointsPerTx),
        pointValidityDays: Number(pointValidityDays),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, pointSystem });
  } catch (error: unknown) {
    console.error('Error creating point system:', error);
    return NextResponse.json(
      { error: 'Gagal membuat sistem poin' },
      { status: 500 }
    );
  }
}
