import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
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

    return NextResponse.json({ success: true, merchants });
  } catch (error: unknown) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json({ error: 'Gagal mengambil data merchant' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      description,
      logoUrl,
      address,
      primaryColor = '#F59E0B',
      pointSystemName = 'Stempel Kunjungan',
      pointsPerUnit = 1,
      pointValidityDays = 90,
      rewardTitle = 'Gratis 1 Produk / Menu Spesial',
      rewardCost = 10,
    } = body;

    // Validate merchant name
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama merchant/toko wajib diisi (minimal 2 karakter).' },
        { status: 400 }
      );
    }

    const trimmedEmail = email?.trim() || null;
    const trimmedPhone = phone?.trim() || null;

    // Rule: only email or phone necessary. can be both or just either is enough.
    if (!trimmedEmail && !trimmedPhone) {
      return NextResponse.json(
        { error: 'Harap masukkan setidaknya salah satu kontak: Email atau Nomor WhatsApp / Telepon.' },
        { status: 400 }
      );
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid. Silakan periksa kembali email Anda.' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) {
      baseSlug = 'merchant';
    }

    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.merchant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = new Date();
    const fiveYearsLater = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000);

    // Create merchant with initial point system & sample reward in a transaction
    const newMerchant = await prisma.$transaction(async (tx) => {
      // 1. Create Merchant
      const merchant = await tx.merchant.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          email: trimmedEmail,
          phone: trimmedPhone,
          description: description?.trim() || null,
          logoUrl: logoUrl || '🏪',
          address: address?.trim() || null,
          primaryColor,
        },
      });

      // 2. Create Active Promotion
      const promotion = await tx.promotion.create({
        data: {
          merchantId: merchant.id,
          title: `Program Loyalitas ${merchant.name}`,
          description: `Kumpulkan stempel setiap kunjungan dan tukarkan dengan hadiah menarik di ${merchant.name}.`,
          startAt: now,
          endAt: fiveYearsLater,
          isActive: true,
        },
      });

      // 3. Create Default Point System
      const pointSystem = await tx.pointSystem.create({
        data: {
          merchantId: merchant.id,
          promotionId: promotion.id,
          name: pointSystemName.trim() || 'Stempel Kunjungan',
          description: 'Dapatkan stempel loyalitas setiap kali berkunjung dan bertransaksi.',
          icon: 'star',
          ruleType: 'FIXED',
          pointsPerUnit: Number(pointsPerUnit) || 1,
          pointValidityDays: Number(pointValidityDays) || 90,
          startAt: now,
          endAt: fiveYearsLater,
          isActive: true,
        },
      });

      // 4. Create Initial Reward
      const reward = await tx.reward.create({
        data: {
          merchantId: merchant.id,
          pointSystemId: pointSystem.id,
          title: rewardTitle.trim() || 'Gratis 1 Produk / Menu Spesial',
          description: `Tukarkan ${Number(rewardCost) || 10} stempel untuk mendapatkan voucher reward spesial ini.`,
          pointsCost: Number(rewardCost) || 10,
          voucherValidityDays: 30,
          startAt: now,
          endAt: fiveYearsLater,
          isActive: true,
        },
      });

      return { merchant, promotion, pointSystem, reward };
    });

    return NextResponse.json({
      success: true,
      message: 'Merchant berhasil didaftarkan!',
      merchant: newMerchant.merchant,
      pointSystem: newMerchant.pointSystem,
      reward: newMerchant.reward,
    });
  } catch (error: unknown) {
    console.error('Error creating merchant:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat mendaftarkan merchant' },
      { status: 500 }
    );
  }
}
