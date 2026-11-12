import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import WalletClient from './WalletClient';
import { notFound } from 'next/navigation';
import { normalizePhoneNumber } from '@/lib/fonnte';

export const metadata: Metadata = {
  title: 'Kartu Stempel & Voucher | Lokaloyal',
  description: 'Cek saldo stempel loyalitas dan tukarkan voucher hadiah.',
};

export default async function WalletPage({
  params,
  searchParams,
}: {
  params: Promise<{ merchantSlug: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { merchantSlug } = await params;
  const { phone: rawPhone } = await searchParams;

  const merchant = await prisma.merchant.findUnique({
    where: { slug: merchantSlug },
    include: {
      promotions: {
        where: {
          isActive: true,
          endAt: { gte: new Date() },
        },
      },
      pointSystems: {
        where: { isActive: true },
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
    notFound();
  }

  let customer = null;
  let wallet = null;
  let batches: any[] = [];
  let redemptions: any[] = [];

  if (rawPhone) {
    const phone = normalizePhoneNumber(rawPhone);
    customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (customer) {
      wallet = await prisma.customerWallet.findUnique({
        where: {
          customerId_merchantId: {
            customerId: customer.id,
            merchantId: merchant.id,
          },
        },
      });

      batches = await prisma.pointBatch.findMany({
        where: {
          customerId: customer.id,
          merchantId: merchant.id,
          status: 'ACTIVE',
          pointsRemaining: { gt: 0 },
        },
        orderBy: { expiresAt: 'asc' },
      });

      redemptions = await prisma.redemption.findMany({
        where: {
          customerId: customer.id,
          merchantId: merchant.id,
        },
        include: {
          reward: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  return (
    <WalletClient
      merchant={{
        id: merchant.id,
        name: merchant.name,
        slug: merchant.slug,
        logoUrl: merchant.logoUrl,
        primaryColor: merchant.primaryColor,
        description: merchant.description,
        promotions: merchant.promotions.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          endAt: p.endAt.toISOString(),
        })),
        rewards: merchant.rewards.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          pointsCost: r.pointsCost,
          voucherValidityDays: r.voucherValidityDays,
          quota: r.quota,
          redeemedCount: r.redeemedCount,
        })),
      }}
      initialPhone={rawPhone || ''}
      initialCustomer={customer ? { phone: customer.phone, name: customer.name } : null}
      initialWallet={
        wallet
          ? { totalPoints: wallet.totalPoints, lifetimePoints: wallet.lifetimePoints }
          : { totalPoints: 0, lifetimePoints: 0 }
      }
      initialBatches={batches.map((b) => ({
        id: b.id,
        pointsRemaining: b.pointsRemaining,
        expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
      }))}
      initialRedemptions={redemptions.map((rd) => ({
        id: rd.id,
        voucherCode: rd.voucherCode,
        status: rd.status,
        expiresAt: rd.expiresAt.toISOString(),
        createdAt: rd.createdAt.toISOString(),
        rewardTitle: rd.reward.title,
        pointsSpent: rd.pointsSpent,
      }))}
    />
  );
}
