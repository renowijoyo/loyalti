import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePosRequest } from '@/lib/pos-auth';
import { normalizePhoneNumber } from '@/lib/fonnte';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const auth = await authenticatePosRequest(req);
    if (auth.error) return auth.error;
    const { merchant } = auth;

    const { phone: rawPhone } = await params;
    const phone = normalizePhoneNumber(decodeURIComponent(rawPhone));

    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      return NextResponse.json({
        success: true,
        found: false,
        phone,
        totalPoints: 0,
        lifetimePoints: 0,
        activeVouchers: [],
      });
    }

    const wallet = await prisma.customerWallet.findUnique({
      where: {
        customerId_merchantId: {
          customerId: customer.id,
          merchantId: merchant.id,
        },
      },
      include: {
        redemptions: {
          where: {
            status: 'ACTIVE',
            expiresAt: { gte: new Date() },
          },
          include: {
            reward: {
              select: { id: true, title: true, description: true, pointsCost: true },
            },
          },
          orderBy: { expiresAt: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      found: true,
      customer: {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
      },
      totalPoints: wallet?.totalPoints ?? 0,
      lifetimePoints: wallet?.lifetimePoints ?? 0,
      activeVouchers: (wallet?.redemptions ?? []).map((r) => ({
        voucherCode: r.voucherCode,
        status: r.status,
        pointsSpent: r.pointsSpent,
        expiresAt: r.expiresAt,
        reward: r.reward,
      })),
    });
  } catch (error: unknown) {
    console.error('POS v1 customer lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to look up customer' },
      { status: 500 }
    );
  }
}
