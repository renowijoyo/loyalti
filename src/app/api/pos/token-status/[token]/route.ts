import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const claimToken = await prisma.claimToken.findUnique({
      where: { token },
      include: {
        merchant: {
          select: { name: true, slug: true },
        },
        pointSystem: {
          select: { name: true, icon: true },
        },
      },
    });

    if (!claimToken) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Check expiration
    const isExpired = new Date() > claimToken.expiresAt;
    let status = claimToken.status;
    if (status === 'PENDING' && isExpired) {
      status = 'EXPIRED';
      await prisma.claimToken.update({
        where: { id: claimToken.id },
        data: { status: 'EXPIRED' },
      });
    }

    return NextResponse.json({
      status,
      points: claimToken.points,
      claimedByPhone: claimToken.claimedByPhone,
      claimedAt: claimToken.claimedAt,
      expiresAt: claimToken.expiresAt,
    });
  } catch (error: unknown) {
    console.error('Error fetching token status:', error);
    return NextResponse.json({ error: 'Failed to fetch token status' }, { status: 500 });
  }
}
