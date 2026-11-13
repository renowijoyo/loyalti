import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePosRequest } from '@/lib/pos-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const auth = await authenticatePosRequest(req);
    if (auth.error) return auth.error;
    const { merchant } = auth;

    const { token } = await params;

    const claimToken = await prisma.claimToken.findFirst({
      where: {
        token,
        merchantId: merchant.id,
      },
      include: {
        pointSystem: {
          select: { id: true, name: true, icon: true },
        },
      },
    });

    if (!claimToken) {
      return NextResponse.json(
        { success: false, error: 'Transaction token not found' },
        { status: 404 }
      );
    }

    let status = claimToken.status;
    if (status === 'PENDING' && new Date() > claimToken.expiresAt) {
      status = 'EXPIRED';
      await prisma.claimToken.update({
        where: { id: claimToken.id },
        data: { status: 'EXPIRED' },
      });
    }

    return NextResponse.json({
      success: true,
      token: claimToken.token,
      status,
      points: claimToken.points,
      transactionAmount: claimToken.transactionAmount,
      billReference: claimToken.billReference,
      claimedByPhone: claimToken.claimedByPhone,
      claimedAt: claimToken.claimedAt,
      expiresAt: claimToken.expiresAt,
      pointSystem: claimToken.pointSystem,
    });
  } catch (error: unknown) {
    console.error('POS v1 token status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transaction status' },
      { status: 500 }
    );
  }
}
