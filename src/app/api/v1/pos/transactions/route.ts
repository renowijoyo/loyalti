import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import {
  authenticatePosRequest,
  calculatePointsForSystem,
  getBaseUrl,
} from '@/lib/pos-auth';
import {
  normalizePhoneNumber,
  sendWhatsAppMessage,
  buildClaimNotificationMessage,
} from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticatePosRequest(req);
    if (auth.error) return auth.error;
    const { merchant } = auth;

    const body = await req.json();
    const {
      pointSystemId,
      transactionAmount = 0,
      points: explicitPoints,
      billReference,
      customerPhone,
      customerName,
      expiryMinutes,
      sendWhatsApp = true,
    } = body;

    // Resolve target PointSystem (explicit or merchant's first active system)
    const now = new Date();
    const pointSystem = pointSystemId
      ? await prisma.pointSystem.findFirst({
          where: { id: pointSystemId, merchantId: merchant.id, isActive: true },
        })
      : await prisma.pointSystem.findFirst({
          where: { merchantId: merchant.id, isActive: true, endAt: { gte: now } },
          orderBy: { createdAt: 'asc' },
        });

    if (!pointSystem) {
      return NextResponse.json(
        { success: false, error: 'No active point system found for this merchant' },
        { status: 400 }
      );
    }

    const pointsEarned = calculatePointsForSystem(
      pointSystem,
      Number(transactionAmount) || 0,
      explicitPoints
    );

    if (pointsEarned <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction does not qualify for points (minimum spend not met or points <= 0)',
          pointsEarned: 0,
        },
        { status: 400 }
      );
    }

    const effectiveBillRef =
      billReference && String(billReference).trim() !== ''
        ? String(billReference).trim()
        : `POS-${Math.floor(100000 + Math.random() * 900000)}`;

    const token = crypto.randomBytes(8).toString('hex');
    const effectiveExpiryMinutes =
      Number(expiryMinutes) > 0 ? Number(expiryMinutes) : merchant.qrExpiryMinutes || 15;
    const expiresAt = new Date(Date.now() + effectiveExpiryMinutes * 60 * 1000);
    const baseUrl = getBaseUrl(req);

    // Flow A: Direct Award when customerPhone is provided by the POS
    if (customerPhone && String(customerPhone).trim().length >= 8) {
      const normalizedPhone = normalizePhoneNumber(String(customerPhone));
      const batchExpiresAt =
        pointSystem.pointValidityDays > 0
          ? new Date(Date.now() + pointSystem.pointValidityDays * 24 * 60 * 60 * 1000)
          : null;

      const result = await prisma.$transaction(async (tx) => {
        const customer = await tx.customer.upsert({
          where: { phone: normalizedPhone },
          update: { name: customerName ? String(customerName).trim() : undefined },
          create: {
            phone: normalizedPhone,
            name: customerName ? String(customerName).trim() : null,
          },
        });

        let wallet = await tx.customerWallet.findUnique({
          where: {
            customerId_merchantId: {
              customerId: customer.id,
              merchantId: merchant.id,
            },
          },
        });

        if (!wallet) {
          wallet = await tx.customerWallet.create({
            data: {
              customerId: customer.id,
              merchantId: merchant.id,
              totalPoints: 0,
              lifetimePoints: 0,
            },
          });
        }

        const claimToken = await tx.claimToken.create({
          data: {
            token,
            merchantId: merchant.id,
            pointSystemId: pointSystem.id,
            points: pointsEarned,
            transactionAmount: Number(transactionAmount) || 0,
            billReference: effectiveBillRef,
            status: 'CLAIMED',
            expiresAt,
            claimedAt: new Date(),
            claimedByPhone: normalizedPhone,
          },
        });

        await tx.pointBatch.create({
          data: {
            walletId: wallet.id,
            customerId: customer.id,
            merchantId: merchant.id,
            pointsEarned,
            pointsRemaining: pointsEarned,
            expiresAt: batchExpiresAt,
            claimTokenId: claimToken.id,
            notes: `POS API [${pointSystem.name}] #${effectiveBillRef}`,
          },
        });

        const updatedWallet = await tx.customerWallet.update({
          where: { id: wallet.id },
          data: {
            totalPoints: { increment: pointsEarned },
            lifetimePoints: { increment: pointsEarned },
          },
        });

        return { customer, wallet: updatedWallet, claimToken };
      });

      const walletUrl = `${baseUrl}/wallet/${merchant.slug}?phone=${normalizedPhone}`;

      if (sendWhatsApp) {
        const activeRewards = await prisma.reward.findMany({
          where: { merchantId: merchant.id, isActive: true, endAt: { gte: now } },
          orderBy: { pointsCost: 'asc' },
        });

        const expiryNote =
          pointSystem.pointValidityDays > 0 && batchExpiresAt
            ? `Stempel ini berlaku hingga ${batchExpiresAt.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })} (${pointSystem.pointValidityDays} hari).`
            : '';

        const waMessage = buildClaimNotificationMessage({
          merchantName: merchant.name,
          pointsEarned,
          pointSystemName: pointSystem.name,
          totalBalance: result.wallet.totalPoints,
          availableRewards: activeRewards.map((r) => ({
            title: r.title,
            pointsCost: r.pointsCost,
          })),
          walletUrl,
          expirationNote: expiryNote,
        });

        sendWhatsAppMessage({
          phone: normalizedPhone,
          message: waMessage,
          merchantId: merchant.id,
          customerId: result.customer.id,
          customToken: merchant.fonnteToken,
        }).catch((err) => {
          console.error('POS v1 async WhatsApp send failed:', err);
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'DIRECT_AWARD',
        status: 'CLAIMED',
        token,
        billReference: effectiveBillRef,
        pointsEarned,
        customerPhone: normalizedPhone,
        newTotalBalance: result.wallet.totalPoints,
        walletUrl,
      });
    }

    // Flow B: QR Claim Token when customerPhone is not provided
    const claimToken = await prisma.claimToken.create({
      data: {
        token,
        merchantId: merchant.id,
        pointSystemId: pointSystem.id,
        points: pointsEarned,
        transactionAmount: Number(transactionAmount) || 0,
        billReference: effectiveBillRef,
        expiresAt,
        status: 'PENDING',
      },
    });

    const claimUrl = `${baseUrl}/claim/${token}`;
    const qrDataUrl = await QRCode.toDataURL(claimUrl, {
      width: 320,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });

    return NextResponse.json({
      success: true,
      mode: 'QR_CLAIM',
      status: claimToken.status,
      token,
      claimUrl,
      qrDataUrl,
      billReference: effectiveBillRef,
      points: pointsEarned,
      expiresAt: claimToken.expiresAt,
    });
  } catch (error: unknown) {
    console.error('POS v1 transaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process POS transaction' },
      { status: 500 }
    );
  }
}
