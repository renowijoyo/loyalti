import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { normalizePhoneNumber, sendWhatsAppMessage } from '@/lib/fonnte';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone: rawPhone, rewardId, merchantSlug } = body;

    if (!rawPhone || !rewardId) {
      return NextResponse.json(
        { error: 'Nomor telepon dan ID reward wajib diisi' },
        { status: 400 }
      );
    }

    const phone = normalizePhoneNumber(rawPhone);

    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      include: { merchant: true },
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward tidak ditemukan' }, { status: 404 });
    }

    if (!reward.isActive || new Date() > reward.endAt) {
      return NextResponse.json(
        { error: 'Hadiah ini sudah tidak aktif atau periode penukaran telah usai' },
        { status: 400 }
      );
    }

    if (reward.quota !== null && reward.redeemedCount >= reward.quota) {
      return NextResponse.json(
        { error: 'Maaf, kuota hadiah ini sudah habis' },
        { status: 400 }
      );
    }

    const wallet = await prisma.customerWallet.findUnique({
      where: {
        customerId_merchantId: {
          customerId: customer.id,
          merchantId: reward.merchantId,
        },
      },
    });

    if (!wallet || wallet.totalPoints < reward.pointsCost) {
      return NextResponse.json(
        {
          error: `Stempel kamu tidak cukup (${wallet?.totalPoints || 0}/${reward.pointsCost} stempel dibutuhkan).`,
        },
        { status: 400 }
      );
    }

    // Generate random voucher code (e.g., LOK-9F2A-3K8P)
    const codeSegment = crypto.randomBytes(4).toString('hex').toUpperCase();
    const voucherCode = `LOK-${codeSegment.slice(0, 4)}-${codeSegment.slice(4)}`;

    // Voucher expiry: now + reward.voucherValidityDays
    const voucherExpiresAt = new Date(
      Date.now() + reward.voucherValidityDays * 24 * 60 * 60 * 1000
    );

    // Run deduction with FIFO batch logic in transaction
    const result = await prisma.$transaction(async (tx) => {
      let remainingCostToDeduct = reward.pointsCost;

      // Fetch active batches sorted by earliest expiry
      const batches = await tx.pointBatch.findMany({
        where: {
          walletId: wallet.id,
          status: 'ACTIVE',
          pointsRemaining: { gt: 0 },
        },
        orderBy: { expiresAt: 'asc' },
      });

      for (const batch of batches) {
        if (remainingCostToDeduct <= 0) break;

        const deductFromBatch = Math.min(batch.pointsRemaining, remainingCostToDeduct);
        const newRemaining = batch.pointsRemaining - deductFromBatch;

        await tx.pointBatch.update({
          where: { id: batch.id },
          data: {
            pointsRemaining: newRemaining,
            status: newRemaining === 0 ? 'DEPLETED' : 'ACTIVE',
          },
        });

        remainingCostToDeduct -= deductFromBatch;
      }

      // Decrement wallet totalPoints
      const updatedWallet = await tx.customerWallet.update({
        where: { id: wallet.id },
        data: {
          totalPoints: { decrement: reward.pointsCost },
        },
      });

      // Increment reward redeemed count
      await tx.reward.update({
        where: { id: reward.id },
        data: {
          redeemedCount: { increment: 1 },
        },
      });

      // Create redemption record
      const redemption = await tx.redemption.create({
        data: {
          walletId: wallet.id,
          customerId: customer.id,
          merchantId: reward.merchantId,
          rewardId: reward.id,
          voucherCode,
          pointsSpent: reward.pointsCost,
          status: 'ACTIVE',
          expiresAt: voucherExpiresAt,
        },
        include: {
          reward: true,
        },
      });

      return { redemption, updatedWallet };
    });

    // Notify customer on WhatsApp about their voucher
    const expiryDateStr = voucherExpiresAt.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const waMsg =
      `🎁 *Voucher Berhasil Ditukarkan di ${reward.merchant.name}!* \n\n` +
      `Hadiah: *${reward.title}*\n` +
      `Kode Voucher: *${voucherCode}*\n` +
      `Masa Berlaku Voucher: s/d *${expiryDateStr}*\n` +
      `Sisa Stempel Kamu: *${result.updatedWallet.totalPoints} stempel*\n\n` +
      `Tunjukkan kode voucher ini kepada kasir saat pembayaran.\n` +
      `Selamat menikmati! ✨`;

    sendWhatsAppMessage({
      phone,
      message: waMsg,
      merchantId: reward.merchantId,
      customerId: customer.id,
      customToken: reward.merchant.fonnteToken,
    }).catch((err) => console.error('WA notification error:', err));

    return NextResponse.json({
      success: true,
      message: 'Voucher berhasil ditukarkan!',
      redemption: result.redemption,
      remainingPoints: result.updatedWallet.totalPoints,
    });
  } catch (error: unknown) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ error: 'Gagal menukarkan voucher' }, { status: 500 });
  }
}
