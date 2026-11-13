import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import type { Merchant, PointSystem } from '@prisma/client';

/**
 * Generates a prefixed, cryptographically random API key for external POS integrations.
 */
export function generatePosApiKey(): string {
  return `loy_live_${crypto.randomBytes(24).toString('hex')}`;
}

/**
 * Extracts the POS API key from `Authorization: Bearer <key>` or `x-api-key: <key>`.
 */
export function extractApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  const xApiKey = req.headers.get('x-api-key')?.trim();
  if (xApiKey) return xApiKey;

  return null;
}

/**
 * Authenticates an external POS API request and returns the associated Merchant,
 * or a 401 NextResponse if the key is missing or invalid.
 */
export async function authenticatePosRequest(
  req: NextRequest
): Promise<{ merchant: Merchant; error?: never } | { merchant?: never; error: NextResponse }> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Missing API key. Provide it via "Authorization: Bearer <key>" or "x-api-key" header.',
        },
        { status: 401 }
      ),
    };
  }

  const merchant = await prisma.merchant.findUnique({
    where: { apiKey },
  });

  if (!merchant) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Invalid API key.',
        },
        { status: 401 }
      ),
    };
  }

  return { merchant };
}

/**
 * Computes points earned for a transaction based on a PointSystem's ruleType,
 * or uses explicitPoints when provided by the external POS.
 */
export function calculatePointsForSystem(
  pointSystem: Pick<
    PointSystem,
    'ruleType' | 'pointsPerUnit' | 'amountPerPoint' | 'minSpendAmount' | 'maxPointsPerTx'
  >,
  transactionAmount: number,
  explicitPoints?: number
): number {
  if (explicitPoints !== undefined && explicitPoints !== null && Number(explicitPoints) > 0) {
    return Math.floor(Number(explicitPoints));
  }

  const amount = Math.max(0, Number(transactionAmount) || 0);
  if (pointSystem.minSpendAmount > 0 && amount < pointSystem.minSpendAmount) {
    return 0;
  }

  let calculated = pointSystem.pointsPerUnit;
  if (pointSystem.ruleType === 'AMOUNT_RATIO') {
    const divisor = Math.max(1, pointSystem.amountPerPoint);
    calculated = Math.floor(amount / divisor) * pointSystem.pointsPerUnit;
  }

  if (pointSystem.maxPointsPerTx > 0) {
    calculated = Math.min(calculated, pointSystem.maxPointsPerTx);
  }

  return Math.max(0, calculated);
}

/**
 * Resolves the public base URL from env or incoming request headers.
 */
export function getBaseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
}
