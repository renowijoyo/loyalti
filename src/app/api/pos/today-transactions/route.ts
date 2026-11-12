import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId parameter is required' }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const claimTokens = await prisma.claimToken.findMany({
      where: {
        merchantId,
        createdAt: { gte: startOfDay },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        pointSystem: {
          select: { name: true, icon: true },
        },
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Map and generate QR data URL for tokens
    const transactions = await Promise.all(
      claimTokens.map(async (item) => {
        const isExpired = new Date() > item.expiresAt;
        const currentStatus =
          item.status === 'PENDING' && isExpired ? 'EXPIRED' : item.status;
        const claimUrl = `${baseUrl}/claim/${item.token}`;

        let qrDataUrl = '';
        try {
          qrDataUrl = await QRCode.toDataURL(claimUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
        } catch (e) {
          console.error('Failed to generate QR data URL for transaction:', e);
        }

        return {
          id: item.id,
          token: item.token,
          points: item.points,
          billReference: item.billReference,
          status: currentStatus,
          claimedByPhone: item.claimedByPhone,
          claimedAt: item.claimedAt,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
          isExpired,
          claimUrl,
          qrDataUrl,
          pointSystemName: item.pointSystem.name,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error: unknown) {
    console.error('Error fetching today transactions:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar transaksi hari ini' },
      { status: 500 }
    );
  }
}
