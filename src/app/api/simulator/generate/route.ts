import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      merchantName = 'Kedai Kopi Demo',
      points = 1,
      billReference,
      icon = '☕',
    } = body;

    // Find first active merchant or create demo merchant if database is empty
    let merchant = await prisma.merchant.findFirst({
      include: {
        pointSystems: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!merchant) {
      const now = new Date();
      const fiveYearsLater = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

      merchant = await prisma.merchant.create({
        data: {
          name: merchantName || 'Kedai Kopi Demo',
          slug: 'demo-kopi-' + Math.floor(100 + Math.random() * 900),
          logoUrl: icon || '☕',
          description: 'Merchant demo untuk uji coba platform Loyalti.',
          pointSystems: {
            create: {
              name: 'Stempel Kunjungan',
              icon: 'coffee',
              ruleType: 'FIXED',
              pointsPerUnit: 1,
              pointValidityDays: 90,
              startAt: now,
              endAt: fiveYearsLater,
              isActive: true,
            },
          },
        },
        include: {
          pointSystems: true,
        },
      });
    }

    const pointSystem = merchant.pointSystems[0];
    if (!pointSystem) {
      return NextResponse.json(
        { error: 'No active point system found for demo merchant' },
        { status: 500 }
      );
    }

    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes for simulator demo
    const effectiveBillRef =
      billReference?.trim() || `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;

    const claimToken = await prisma.claimToken.create({
      data: {
        token,
        merchantId: merchant.id,
        pointSystemId: pointSystem.id,
        points: Math.max(1, Number(points) || 1),
        billReference: effectiveBillRef,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        merchant: {
          select: { name: true, slug: true, logoUrl: true, primaryColor: true },
        },
        pointSystem: {
          select: { name: true, icon: true },
        },
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const claimUrl = `${baseUrl}/claim/${token}`;

    const qrDataUrl = await QRCode.toDataURL(claimUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      token,
      claimUrl,
      qrDataUrl,
      points: claimToken.points,
      billReference: claimToken.billReference,
      expiresAt: claimToken.expiresAt,
      merchant: {
        name: merchantName || claimToken.merchant.name,
        slug: claimToken.merchant.slug,
        logoUrl: icon || claimToken.merchant.logoUrl || '☕',
      },
      pointSystem: claimToken.pointSystem,
    });
  } catch (error: unknown) {
    console.error('Simulator generate token error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat QR simulator' },
      { status: 500 }
    );
  }
}
