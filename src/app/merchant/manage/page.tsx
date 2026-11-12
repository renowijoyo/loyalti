import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import ManageClient from './ManageClient';

export const metadata: Metadata = {
  title: 'Pengaturan Program Loyalitas | Loyalti',
  description: 'Kelola promosi, sistem poin, katalog hadiah, dan integrasi WhatsApp Fonnte.',
};

export default async function ManagePage() {
  const merchants = await prisma.merchant.findMany({
    include: {
      promotions: {
        orderBy: { createdAt: 'desc' },
      },
      pointSystems: {
        orderBy: { createdAt: 'desc' },
      },
      rewards: {
        orderBy: { pointsCost: 'asc' },
      },
      _count: {
        select: {
          wallets: true,
          claimTokens: true,
          redemptions: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <ManageClient
      initialMerchants={merchants.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        logoUrl: m.logoUrl,
        primaryColor: m.primaryColor,
        fonnteToken: m.fonnteToken,
        description: m.description,
        promotions: m.promotions.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          startAt: p.startAt.toISOString(),
          endAt: p.endAt.toISOString(),
          isActive: p.isActive,
        })),
        pointSystems: m.pointSystems.map((ps) => ({
          id: ps.id,
          name: ps.name,
          description: ps.description,
          icon: ps.icon,
          ruleType: ps.ruleType,
          pointsPerUnit: ps.pointsPerUnit,
          amountPerPoint: ps.amountPerPoint,
          minSpendAmount: ps.minSpendAmount,
          maxPointsPerTx: ps.maxPointsPerTx,
          pointValidityDays: ps.pointValidityDays,
          startAt: ps.startAt.toISOString(),
          endAt: ps.endAt.toISOString(),
          isActive: ps.isActive,
        })),
        rewards: m.rewards.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          pointsCost: r.pointsCost,
          quota: r.quota,
          redeemedCount: r.redeemedCount,
          voucherValidityDays: r.voucherValidityDays,
          startAt: r.startAt.toISOString(),
          endAt: r.endAt.toISOString(),
          isActive: r.isActive,
          pointSystemId: r.pointSystemId,
        })),
        stats: {
          customersCount: m._count.wallets,
          claimsCount: m._count.claimTokens,
          redemptionsCount: m._count.redemptions,
        },
      }))}
    />
  );
}
