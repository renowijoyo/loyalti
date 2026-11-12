import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import QRCode from 'qrcode';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      merchantId,
      pointSystemId,
      points = 1,
      transactionAmount = 0,
      billReference,
      expiryMinutes = 15,
    } = body;

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchantId is required' },
        { status: 400 }
      );
    }

    // Verify merchant and fetch configured QR expiration minutes
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { qrExpiryMinutes: true },
    });

    let selectedPointSystemId = pointSystemId;
    if (!selectedPointSystemId) {
      const defaultPs = await prisma.pointSystem.findFirst({
        where: { merchantId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!defaultPs) {
        return NextResponse.json(
          { error: 'No active point system found for this merchant' },
          { status: 400 }
        );
      }
      selectedPointSystemId = defaultPs.id;
    }

    const effectiveExpiryMinutes =
      Number(expiryMinutes) || merchant?.qrExpiryMinutes || 15;

    // Generate secure random token
    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + effectiveExpiryMinutes * 60 * 1000);
    const effectiveBillRef =
      billReference && billReference.trim() !== ''
        ? billReference.trim()
        : `TRX-${Math.floor(100000 + Math.random() * 900000)}`;

    const claimToken = await prisma.claimToken.create({
      data: {
        token,
        merchantId,
        pointSystemId: selectedPointSystemId,
        points: Number(points),
        transactionAmount: Number(transactionAmount),
        billReference: effectiveBillRef,
        expiresAt,
        status: 'PENDING',
      },
      include: {
        merchant: {
          select: { name: true, slug: true, primaryColor: true, logoUrl: true },
        },
        pointSystem: {
          select: { name: true, icon: true, pointValidityDays: true },
        },
      },
    });

    // Generate QR Code URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const claimUrl = `${baseUrl}/claim/${token}`;

    const qrDataUrl = await QRCode.toDataURL(claimUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      token,
      claimUrl,
      qrDataUrl,
      billReference: effectiveBillRef,
      points: Number(points),
      claimToken,
    });
  } catch (error: unknown) {
    console.error('Error generating claim token:', error);
    return NextResponse.json(
      { error: 'Failed to generate claim token' },
      { status: 500 }
    );
  }
}
