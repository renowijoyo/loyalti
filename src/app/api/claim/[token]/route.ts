import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  normalizePhoneNumber,
  sendWhatsAppMessage,
  buildClaimNotificationMessage,
} from '@/lib/fonnte';

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
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            description: true,
          },
        },
        pointSystem: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            pointValidityDays: true,
          },
        },
      },
    });

    if (!claimToken) {
      return NextResponse.json(
        { error: 'Token stempel tidak ditemukan atau sudah tidak valid.' },
        { status: 404 }
      );
    }

    const isExpired = new Date() > claimToken.expiresAt;
    const currentStatus =
      claimToken.status === 'PENDING' && isExpired ? 'EXPIRED' : claimToken.status;

    // Fetch active rewards for preview
    const rewards = await prisma.reward.findMany({
      where: {
        merchantId: claimToken.merchantId,
        isActive: true,
        endAt: { gte: new Date() },
      },
      orderBy: { pointsCost: 'asc' },
      take: 3,
    });

    return NextResponse.json({
      success: true,
      token: claimToken.token,
      points: claimToken.points,
      billReference: claimToken.billReference,
      status: currentStatus,
      expiresAt: claimToken.expiresAt,
      merchant: claimToken.merchant,
      pointSystem: claimToken.pointSystem,
      rewards,
    });
  } catch (error: unknown) {
    console.error('Error fetching claim token:', error);
    return NextResponse.json({ error: 'Gagal memuat info stempel' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { phone, name } = body;

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp wajib diisi dengan benar (min. 8 digit).' },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    // Retrieve token
    const claimToken = await prisma.claimToken.findUnique({
      where: { token },
      include: {
        merchant: true,
        pointSystem: true,
      },
    });

    if (!claimToken) {
      return NextResponse.json(
        { error: 'Token stempel tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (claimToken.status === 'CLAIMED') {
      return NextResponse.json(
        {
          error: `Stempel ini sudah diklaim sebelumnya oleh ${claimToken.claimedByPhone}.`,
          alreadyClaimed: true,
        },
        { status: 409 }
      );
    }

    if (new Date() > claimToken.expiresAt || claimToken.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Maaf, masa berlaku QR stempel ini telah kedaluwarsa.' },
        { status: 410 }
      );
    }

    // Calculate point expiration based on PointSystem configuration
    let batchExpiresAt: Date | null = null;
    if (claimToken.pointSystem.pointValidityDays > 0) {
      batchExpiresAt = new Date(
        Date.now() + claimToken.pointSystem.pointValidityDays * 24 * 60 * 60 * 1000
      );
    }

    // Process claim in a database transaction
    const claimResult = await prisma.$transaction(async (tx) => {
      // 1. Find or create customer
      const customer = await tx.customer.upsert({
        where: { phone: normalizedPhone },
        update: {
          name: name ? name.trim() : undefined,
        },
        create: {
          phone: normalizedPhone,
          name: name ? name.trim() : null,
        },
      });

      // 2. Find or create customer wallet for this merchant
      let wallet = await tx.customerWallet.findUnique({
        where: {
          customerId_merchantId: {
            customerId: customer.id,
            merchantId: claimToken.merchantId,
          },
        },
      });

      if (!wallet) {
        wallet = await tx.customerWallet.create({
          data: {
            customerId: customer.id,
            merchantId: claimToken.merchantId,
            totalPoints: 0,
            lifetimePoints: 0,
          },
        });
      }

      // 3. Mark claim token as claimed
      await tx.claimToken.update({
        where: { id: claimToken.id },
        data: {
          status: 'CLAIMED',
          claimedByPhone: normalizedPhone,
          claimedAt: new Date(),
        },
      });

      // 4. Create Point Batch for FIFO expiration tracking
      await tx.pointBatch.create({
        data: {
          walletId: wallet.id,
          customerId: customer.id,
          merchantId: claimToken.merchantId,
          pointsEarned: claimToken.points,
          pointsRemaining: claimToken.points,
          expiresAt: batchExpiresAt,
          claimTokenId: claimToken.id,
          notes: `Klaim via QR [${claimToken.pointSystem.name}]${claimToken.billReference ? ` #${claimToken.billReference}` : ''}`,
        },
      });

      // 5. Update wallet balance
      const updatedWallet = await tx.customerWallet.update({
        where: { id: wallet.id },
        data: {
          totalPoints: { increment: claimToken.points },
          lifetimePoints: { increment: claimToken.points },
        },
      });

      return { customer, wallet: updatedWallet };
    });

    // Fetch active rewards for the merchant to inform customer
    const activeRewards = await prisma.reward.findMany({
      where: {
        merchantId: claimToken.merchantId,
        isActive: true,
        endAt: { gte: new Date() },
      },
      orderBy: { pointsCost: 'asc' },
    });

    // Build wallet URL for customer
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const walletUrl = `${baseUrl}/wallet/${claimToken.merchant.slug}?phone=${normalizedPhone}`;

    // Format expiration note
    let expiryNote = '';
    if (claimToken.pointSystem.pointValidityDays > 0 && batchExpiresAt) {
      const formattedDate = batchExpiresAt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      expiryNote = `Stempel ini berlaku hingga ${formattedDate} (${claimToken.pointSystem.pointValidityDays} hari).`;
    }

    // Build WhatsApp message
    const waMessage = buildClaimNotificationMessage({
      merchantName: claimToken.merchant.name,
      pointsEarned: claimToken.points,
      pointSystemName: claimToken.pointSystem.name,
      totalBalance: claimResult.wallet.totalPoints,
      availableRewards: activeRewards.map((r) => ({
        title: r.title,
        pointsCost: r.pointsCost,
      })),
      walletUrl,
      expirationNote: expiryNote,
    });

    // Send WhatsApp notification via Fonnte asynchronously
    sendWhatsAppMessage({
      phone: normalizedPhone,
      message: waMessage,
      merchantId: claimToken.merchantId,
      customerId: claimResult.customer.id,
      customToken: claimToken.merchant.fonnteToken,
    }).catch((err) => {
      console.error('Async WhatsApp send failed:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Stempel berhasil diklaim!',
      pointsEarned: claimToken.points,
      newTotalBalance: claimResult.wallet.totalPoints,
      walletUrl,
      phone: normalizedPhone,
      merchant: {
        name: claimToken.merchant.name,
        slug: claimToken.merchant.slug,
        logoUrl: claimToken.merchant.logoUrl,
        primaryColor: claimToken.merchant.primaryColor,
      },
      availableRewards: activeRewards,
    });
  } catch (error: unknown) {
    console.error('Error processing claim:', error);
    return NextResponse.json({ error: 'Gagal memproses klaim stempel' }, { status: 500 });
  }
}
