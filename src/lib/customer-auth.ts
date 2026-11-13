import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const CUSTOMER_SESSION_COOKIE = 'loyalti_customer_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createCustomerSession(accountId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.customerSession.create({
    data: {
      accountId,
      token,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getCustomerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: {
      account: {
        include: {
          phoneLinks: {
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return session;
}

export interface SerializedPhoneLink {
  id: string;
  phone: string;
  label: string | null;
  createdAt: string;
}

export interface SerializedWallet {
  id: string;
  customerPhone: string;
  totalPoints: number;
  lifetimePoints: number;
  merchant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
  };
  activeBatches: Array<{
    id: string;
    pointsRemaining: number;
    expiresAt: string | null;
    createdAt: string;
  }>;
}

export interface SerializedTransaction {
  id: string;
  type: 'EARN' | 'REDEEM';
  points: number;
  phone: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
  };
  title: string;
  subtitle: string | null;
  transactionAmount: number | null;
  billReference: string | null;
  voucherCode: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface CustomerAccountOverview {
  account: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  phoneLinks: SerializedPhoneLink[];
  summary: {
    totalActivePoints: number;
    totalLifetimePoints: number;
    merchantsCount: number;
    boundNumbersCount: number;
    transactionsCount: number;
  };
  wallets: SerializedWallet[];
  transactions: SerializedTransaction[];
}

export async function getCustomerAccountOverview(
  accountId: string
): Promise<CustomerAccountOverview | null> {
  const account = await prisma.customerAccount.findUnique({
    where: { id: accountId },
    include: {
      phoneLinks: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!account) return null;

  const phoneLinks: SerializedPhoneLink[] = account.phoneLinks.map((link) => ({
    id: link.id,
    phone: link.phone,
    label: link.label,
    createdAt: link.createdAt.toISOString(),
  }));

  const linkedPhones = phoneLinks.map((l) => l.phone);

  if (linkedPhones.length === 0) {
    return {
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        createdAt: account.createdAt.toISOString(),
      },
      phoneLinks: [],
      summary: {
        totalActivePoints: 0,
        totalLifetimePoints: 0,
        merchantsCount: 0,
        boundNumbersCount: 0,
        transactionsCount: 0,
      },
      wallets: [],
      transactions: [],
    };
  }

  const customers = await prisma.customer.findMany({
    where: { phone: { in: linkedPhones } },
    select: { id: true, phone: true },
  });

  const customerIds = customers.map((c) => c.id);
  const phoneByCustomerId = new Map(customers.map((c) => [c.id, c.phone]));

  const [walletRows, claimRows, redemptionRows] = await Promise.all([
    customerIds.length > 0
      ? prisma.customerWallet.findMany({
          where: { customerId: { in: customerIds } },
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                primaryColor: true,
              },
            },
            pointBatches: {
              where: {
                status: 'ACTIVE',
                pointsRemaining: { gt: 0 },
              },
              orderBy: { expiresAt: 'asc' },
            },
          },
          orderBy: { totalPoints: 'desc' },
        })
      : Promise.resolve([]),
    prisma.claimToken.findMany({
      where: {
        status: 'CLAIMED',
        claimedByPhone: { in: linkedPhones },
      },
      include: {
        merchant: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        pointSystem: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { claimedAt: 'desc' },
    }),
    customerIds.length > 0
      ? prisma.redemption.findMany({
          where: { customerId: { in: customerIds } },
          include: {
            merchant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                primaryColor: true,
              },
            },
            reward: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
  ]);

  const wallets: SerializedWallet[] = walletRows.map((w) => ({
    id: w.id,
    customerPhone: phoneByCustomerId.get(w.customerId) ?? '',
    totalPoints: w.totalPoints,
    lifetimePoints: w.lifetimePoints,
    merchant: w.merchant,
    activeBatches: w.pointBatches.map((b) => ({
      id: b.id,
      pointsRemaining: b.pointsRemaining,
      expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
      createdAt: b.createdAt.toISOString(),
    })),
  }));

  const earnTransactions: SerializedTransaction[] = claimRows.map((c) => ({
    id: `earn_${c.id}`,
    type: 'EARN',
    points: c.points,
    phone: c.claimedByPhone ?? '',
    merchant: c.merchant,
    title: c.pointSystem.name,
    subtitle: c.billReference ? `Bill: ${c.billReference}` : 'Klaim Stempel / Poin',
    transactionAmount: c.transactionAmount > 0 ? c.transactionAmount : null,
    billReference: c.billReference,
    voucherCode: null,
    status: 'CLAIMED',
    expiresAt: null,
    createdAt: (c.claimedAt ?? c.createdAt).toISOString(),
  }));

  const redeemTransactions: SerializedTransaction[] = redemptionRows.map((r) => ({
    id: `redeem_${r.id}`,
    type: 'REDEEM',
    points: r.pointsSpent,
    phone: phoneByCustomerId.get(r.customerId) ?? '',
    merchant: r.merchant,
    title: r.reward.title,
    subtitle: `Voucher: ${r.voucherCode}`,
    transactionAmount: null,
    billReference: null,
    voucherCode: r.voucherCode,
    status: r.status,
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  const transactions = [...earnTransactions, ...redeemTransactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const uniqueMerchants = new Set(wallets.map((w) => w.merchant.id));

  return {
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      createdAt: account.createdAt.toISOString(),
    },
    phoneLinks,
    summary: {
      totalActivePoints: wallets.reduce((sum, w) => sum + w.totalPoints, 0),
      totalLifetimePoints: wallets.reduce((sum, w) => sum + w.lifetimePoints, 0),
      merchantsCount: uniqueMerchants.size,
      boundNumbersCount: phoneLinks.length,
      transactionsCount: transactions.length,
    },
    wallets,
    transactions,
  };
}
