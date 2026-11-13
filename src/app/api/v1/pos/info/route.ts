import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePosRequest } from '@/lib/pos-auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticatePosRequest(req);
    if (auth.error) return auth.error;
    const { merchant } = auth;

    const now = new Date();
    const [pointSystems, rewards] = await Promise.all([
      prisma.pointSystem.findMany({
        where: {
          merchantId: merchant.id,
          isActive: true,
          endAt: { gte: now },
        },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          ruleType: true,
          pointsPerUnit: true,
          amountPerPoint: true,
          minSpendAmount: true,
          maxPointsPerTx: true,
          pointValidityDays: true,
          startAt: true,
          endAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.reward.findMany({
        where: {
          merchantId: merchant.id,
          isActive: true,
          endAt: { gte: now },
        },
        select: {
          id: true,
          pointSystemId: true,
          title: true,
          description: true,
          pointsCost: true,
          quota: true,
          redeemedCount: true,
          voucherValidityDays: true,
          startAt: true,
          endAt: true,
        },
        orderBy: { pointsCost: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        qrExpiryMinutes: merchant.qrExpiryMinutes,
      },
      pointSystems,
      rewards,
    });
  } catch (error: unknown) {
    console.error('POS v1 info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchant POS configuration' },
      { status: 500 }
    );
  }
}
