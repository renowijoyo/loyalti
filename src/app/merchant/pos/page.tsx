import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import PosClient from './PosClient';

export const metadata: Metadata = {
  title: 'Cashier Mode - Generate QR Stempel | Loyalti',
  description: 'Mode Cashier untuk menghasilkan QR code stempel loyalitas pelanggan via ponsel atau terminal kasir.',
};

export default async function PosPage() {
  const merchants = await prisma.merchant.findMany({
    include: {
      pointSystems: {
        where: { isActive: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <PosClient
      initialMerchants={merchants.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        logoUrl: m.logoUrl,
        pointSystems: m.pointSystems.map((ps) => ({
          id: ps.id,
          name: ps.name,
          ruleType: ps.ruleType,
          pointsPerUnit: ps.pointsPerUnit,
          amountPerPoint: ps.amountPerPoint,
          icon: ps.icon,
        })),
      }))}
    />
  );
}
