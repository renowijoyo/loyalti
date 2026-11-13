import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';

export const SYSTEM_ADMIN_COOKIE = 'loyalti_system_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getAdminSecret(): string {
  return process.env.SYSTEM_ADMIN_SECRET || process.env.SYSTEM_ADMIN_PASSWORD || 'loyalti-dev-system-admin-secret';
}

export function getConfiguredAdminPassword(): string {
  return process.env.SYSTEM_ADMIN_PASSWORD || 'admin123';
}

export function verifySystemAdminPassword(input: string): boolean {
  const expected = getConfiguredAdminPassword();
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSystemAdminToken(): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const payload = `${expiresAt.getTime()}.${crypto.randomBytes(16).toString('hex')}`;
  const sig = crypto
    .createHmac('sha256', getAdminSecret())
    .update(payload)
    .digest('hex');
  return {
    token: `${payload}.${sig}`,
    expiresAt,
  };
}

export function verifySystemAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expiresStr, nonce, sig] = parts;
  const expiresAtMs = Number(expiresStr);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return false;
  }

  const payload = `${expiresStr}.${nonce}`;
  const expectedSig = crypto
    .createHmac('sha256', getAdminSecret())
    .update(payload)
    .digest('hex');

  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function isSystemAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SYSTEM_ADMIN_COOKIE)?.value;
  return verifySystemAdminToken(token);
}

export interface SystemAdminOverview {
  stats: {
    merchantsCount: number;
    customersCount: number;
    emailAccountsCount: number;
    boundPhonesCount: number;
    totalActivePoints: number;
    totalLifetimePoints: number;
    claimedTokensCount: number;
    pendingTokensCount: number;
    redemptionsCount: number;
    notificationsSentCount: number;
    notificationsFailedCount: number;
  };
  merchants: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    primaryColor: string;
    email: string | null;
    phone: string | null;
    qrExpiryMinutes: number;
    hasFonnteToken: boolean;
    hasApiKey: boolean;
    apiKeyPreview: string | null;
    createdAt: string;
    counts: {
      wallets: number;
      pointSystems: number;
      rewards: number;
      claimTokens: number;
      redemptions: number;
    };
  }>;
  customerAccounts: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
    phones: Array<{
      id: string;
      phone: string;
      label: string | null;
      createdAt: string;
    }>;
  }>;
  recentClaims: Array<{
    id: string;
    token: string;
    merchantName: string;
    pointSystemName: string;
    points: number;
    transactionAmount: number;
    billReference: string | null;
    status: string;
    claimedByPhone: string | null;
    claimedAt: string | null;
    createdAt: string;
  }>;
  recentRedemptions: Array<{
    id: string;
    voucherCode: string;
    merchantName: string;
    rewardTitle: string;
    customerPhone: string;
    pointsSpent: number;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>;
  notificationLogs: Array<{
    id: string;
    phone: string;
    provider: string;
    status: string;
    message: string;
    apiResponse: string | null;
    createdAt: string;
  }>;
}

export async function getSystemAdminOverview(): Promise<SystemAdminOverview> {
  const [
    merchants,
    customersCount,
    customerAccounts,
    boundPhonesCount,
    walletAgg,
    claimedTokensCount,
    pendingTokensCount,
    redemptionsCount,
    notificationsSentCount,
    notificationsFailedCount,
    recentClaims,
    recentRedemptions,
    notificationLogs,
  ] = await Promise.all([
    prisma.merchant.findMany({
      include: {
        _count: {
          select: {
            wallets: true,
            pointSystems: true,
            rewards: true,
            claimTokens: true,
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count(),
    prisma.customerAccount.findMany({
      include: {
        phoneLinks: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.customerPhoneLink.count(),
    prisma.customerWallet.aggregate({
      _sum: {
        totalPoints: true,
        lifetimePoints: true,
      },
    }),
    prisma.claimToken.count({ where: { status: 'CLAIMED' } }),
    prisma.claimToken.count({ where: { status: 'PENDING' } }),
    prisma.redemption.count(),
    prisma.notificationLog.count({ where: { status: 'SENT' } }),
    prisma.notificationLog.count({ where: { status: 'FAILED' } }),
    prisma.claimToken.findMany({
      include: {
        merchant: { select: { name: true } },
        pointSystem: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.redemption.findMany({
      include: {
        merchant: { select: { name: true } },
        reward: { select: { title: true } },
        customer: { select: { phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    stats: {
      merchantsCount: merchants.length,
      customersCount,
      emailAccountsCount: customerAccounts.length,
      boundPhonesCount,
      totalActivePoints: walletAgg._sum.totalPoints ?? 0,
      totalLifetimePoints: walletAgg._sum.lifetimePoints ?? 0,
      claimedTokensCount,
      pendingTokensCount,
      redemptionsCount,
      notificationsSentCount,
      notificationsFailedCount,
    },
    merchants: merchants.map((m) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      logoUrl: m.logoUrl,
      primaryColor: m.primaryColor,
      email: m.email,
      phone: m.phone,
      qrExpiryMinutes: m.qrExpiryMinutes,
      hasFonnteToken: Boolean(m.fonnteToken && m.fonnteToken.trim().length > 0),
      hasApiKey: Boolean(m.apiKey),
      apiKeyPreview: m.apiKey ? `${m.apiKey.slice(0, 12)}••••${m.apiKey.slice(-4)}` : null,
      createdAt: m.createdAt.toISOString(),
      counts: m._count,
    })),
    customerAccounts: customerAccounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      name: acc.name,
      createdAt: acc.createdAt.toISOString(),
      phones: acc.phoneLinks.map((p) => ({
        id: p.id,
        phone: p.phone,
        label: p.label,
        createdAt: p.createdAt.toISOString(),
      })),
    })),
    recentClaims: recentClaims.map((c) => ({
      id: c.id,
      token: c.token,
      merchantName: c.merchant.name,
      pointSystemName: c.pointSystem.name,
      points: c.points,
      transactionAmount: c.transactionAmount,
      billReference: c.billReference,
      status: c.status,
      claimedByPhone: c.claimedByPhone,
      claimedAt: c.claimedAt ? c.claimedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    })),
    recentRedemptions: recentRedemptions.map((r) => ({
      id: r.id,
      voucherCode: r.voucherCode,
      merchantName: r.merchant.name,
      rewardTitle: r.reward.title,
      customerPhone: r.customer.phone,
      pointsSpent: r.pointsSpent,
      status: r.status,
      expiresAt: r.expiresAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
    notificationLogs: notificationLogs.map((n) => ({
      id: n.id,
      phone: n.phone,
      provider: n.provider,
      status: n.status,
      message: n.message,
      apiResponse: n.apiResponse,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}
