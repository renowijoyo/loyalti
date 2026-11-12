import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/fonnte';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ merchantSlug: string }> }
) {
  try {
    const { merchantSlug } = await params;
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');

    const merchant = await prisma.merchant.findUnique({
      where: { slug: merchantSlug },
      include: {
        promotions: {
          where: {
            isActive: true,
            endAt: { gte: new Date() },
          },
          orderBy: { endAt: 'asc' },
        },
        pointSystems: {
          where: {
            isActive: true,
            endAt: { gte: new Date() },
          },
        },
        rewards: {
          where: {
            isActive: true,
            endAt: { gte: new Date() },
          },
          orderBy: { pointsCost: 'asc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant tidak ditemukan' }, { status: 404 });
    }

    if (!rawPhone) {
      return NextResponse.json({
        merchant,
        wallet: null,
        customer: null,
        batches: [],
        redemptions: [],
      });
    }

    const phone = normalizePhoneNumber(rawPhone);

    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer) {
      return NextResponse.json({
        merchant,
        wallet: { totalPoints: 0, lifetimePoints: 0 },
        customer: { phone },
        batches: [],
        redemptions: [],
      });
    }

    const wallet = await prisma.customerWallet.findUnique({
      where: {
        customerId_merchantId: {
          customerId: customer.id,
          merchantId: merchant.id,
        },
      },
    });

    // Fetch active point batches with expiration (earliest expiring first)
    const batches = await prisma.pointBatch.findMany({
      where: {
        customerId: customer.id,
        merchantId: merchant.id,
        status: 'ACTIVE',
        pointsRemaining: { gt: 0 },
      },
      orderBy: { expiresAt: 'asc' },
    });

    // Fetch vouchers / redemptions
    const redemptions = await prisma.redemption.findMany({
      where: {
        customerId: customer.id,
        merchantId: merchant.id,
      },
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      merchant,
      wallet: wallet || { totalPoints: 0, lifetimePoints: 0 },
      customer,
      batches,
      redemptions,
    });
  } catch (error: unknown) {
    console.error('Error fetching customer wallet:', error);
    return NextResponse.json({ error: 'Gagal memuat kartu loyalitas' }, { status: 500 });
  }
}
