import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const merchants = await prisma.merchant.findMany({
      include: {
        promotions: {
          orderBy: { createdAt: 'desc' },
        },
        pointSystems: {
          orderBy: { createdAt: 'desc' },
        },
        rewards: {
          orderBy: { pointsCost: 'asc' },
        },
        _count: {
          select: {
            wallets: true,
            claimTokens: true,
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, merchants });
  } catch (error: unknown) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json({ error: 'Gagal mengambil data merchant' }, { status: 500 });
  }
}
