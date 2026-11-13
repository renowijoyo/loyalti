import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticatePosRequest } from '@/lib/pos-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticatePosRequest(req);
    if (auth.error) return auth.error;
    const { merchant } = auth;

    const body = await req.json();
    const { voucherCode, action = 'check' } = body;

    if (!voucherCode || String(voucherCode).trim() === '') {
      return NextResponse.json(
        { success: false, error: 'voucherCode is required' },
        { status: 400 }
      );
    }

    const code = String(voucherCode).trim().toUpperCase();

    const redemption = await prisma.redemption.findFirst({
      where: {
        voucherCode: code,
        merchantId: merchant.id,
      },
      include: {
        reward: {
          select: { id: true, title: true, description: true, pointsCost: true },
        },
        customer: {
          select: { phone: true, name: true },
        },
      },
    });

    if (!redemption) {
      return NextResponse.json(
        { success: false, valid: false, error: 'Voucher not found for this merchant' },
        { status: 404 }
      );
    }

    const isExpired = new Date() > redemption.expiresAt;
    if (redemption.status === 'ACTIVE' && isExpired) {
      await prisma.redemption.update({
        where: { id: redemption.id },
        data: { status: 'EXPIRED' },
      });
      return NextResponse.json(
        {
          success: false,
          valid: false,
          status: 'EXPIRED',
          error: 'Voucher has expired',
          expiresAt: redemption.expiresAt,
        },
        { status: 410 }
      );
    }

    if (redemption.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          status: redemption.status,
          error:
            redemption.status === 'USED'
              ? 'Voucher has already been used'
              : 'Voucher is no longer active',
          usedAt: redemption.usedAt,
        },
        { status: 409 }
      );
    }

    if (action === 'redeem') {
      const updated = await prisma.redemption.update({
        where: { id: redemption.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        valid: true,
        redeemed: true,
        voucherCode: updated.voucherCode,
        status: updated.status,
        usedAt: updated.usedAt,
        reward: redemption.reward,
        customer: redemption.customer,
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      redeemed: false,
      voucherCode: redemption.voucherCode,
      status: redemption.status,
      expiresAt: redemption.expiresAt,
      reward: redemption.reward,
      customer: redemption.customer,
    });
  } catch (error: unknown) {
    console.error('POS v1 voucher verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify voucher' },
      { status: 500 }
    );
  }
}
