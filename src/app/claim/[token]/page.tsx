import { Metadata } from 'next';
import ClaimClient from './ClaimClient';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Klaim Stempel Loyalitas | Lokaloyal',
  description: 'Klaim stempel dan reward kamu dengan mudah tanpa perlu install aplikasi.',
};

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const claimToken = await prisma.claimToken.findUnique({
    where: { token },
    include: {
      merchant: true,
      pointSystem: true,
    },
  });

  if (!claimToken) {
    notFound();
  }

  // Fetch active rewards
  const rewards = await prisma.reward.findMany({
    where: {
      merchantId: claimToken.merchantId,
      isActive: true,
      endAt: { gte: new Date() },
    },
    orderBy: { pointsCost: 'asc' },
    take: 3,
  });

  const isExpired = new Date() > claimToken.expiresAt;

  return (
    <ClaimClient
      token={token}
      initialTokenData={{
        points: claimToken.points,
        status: claimToken.status === 'PENDING' && isExpired ? 'EXPIRED' : claimToken.status,
        claimedByPhone: claimToken.claimedByPhone,
        expiresAt: claimToken.expiresAt.toISOString(),
        merchant: {
          name: claimToken.merchant.name,
          slug: claimToken.merchant.slug,
          logoUrl: claimToken.merchant.logoUrl,
          primaryColor: claimToken.merchant.primaryColor,
          description: claimToken.merchant.description,
        },
        pointSystem: {
          name: claimToken.pointSystem.name,
          icon: claimToken.pointSystem.icon,
          pointValidityDays: claimToken.pointSystem.pointValidityDays,
        },
        rewards: rewards.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          pointsCost: r.pointsCost,
        })),
      }}
    />
  );
}
