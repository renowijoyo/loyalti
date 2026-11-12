import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data for idempotency
  await prisma.notificationLog.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.pointBatch.deleteMany();
  await prisma.customerWallet.deleteMany();
  await prisma.claimToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.pointSystem.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.merchant.deleteMany();

  // Create Merchant 1
  const merchantKopi = await prisma.merchant.create({
    data: {
      name: 'Kopi Kenangan Senopati',
      slug: 'kopi-kenangan',
      description: 'Tempat ngopi favorit anak Senopati. Kumpulkan stempel untuk dapatkan kopi gratis!',
      logoUrl: '☕',
      primaryColor: '#854d0e', // Amber / Coffee tone
      phone: '081298765432',
      address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan',
      fonnteToken: '', // Can be set via dashboard or .env
    },
  });

  // Create Merchant 2
  const merchantDimsum = await prisma.merchant.create({
    data: {
      name: 'Dimsum Hao Hao Bar',
      slug: 'haohao-dimsum',
      description: 'Artisan Dimsum & Chinese Tea. Nikmati kelezatan dimsum kukus & goreng renyah.',
      logoUrl: '🥟',
      primaryColor: '#dc2626', // Red
      phone: '081388990011',
      address: 'Jl. Panglima Polim IX No. 12, Jakarta Selatan',
      fonnteToken: '',
    },
  });

  const now = new Date();
  const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Promotion for Kopi Kenangan
  const promoKopi = await prisma.promotion.create({
    data: {
      merchantId: merchantKopi.id,
      title: 'Festival Stempel Kenangan 2026',
      description: 'Beli minuman favoritmu, scan stempel, dan nikmati traktiran kopi dari kami!',
      startAt: now,
      endAt: nextMonth, // Promotion campaign period
      isActive: true,
    },
  });

  // Point System 1: Fixed Stamp per Cup / Visit
  const psStamp = await prisma.pointSystem.create({
    data: {
      merchantId: merchantKopi.id,
      promotionId: promoKopi.id,
      name: 'Stempel Kopi Kenangan',
      description: 'Dapatkan 1 stempel untuk setiap gelas kopi yang kamu pesan.',
      icon: 'coffee',
      ruleType: 'FIXED',
      pointsPerUnit: 1,
      minSpendAmount: 0,
      maxPointsPerTx: 10,
      pointValidityDays: 90, // Stempel kedaluwarsa 90 hari setelah didapat (bisa melampaui promo)
      startAt: now,
      endAt: nextYear,
      isActive: true,
    },
  });

  // Point System 2: Amount Ratio
  const psRatio = await prisma.pointSystem.create({
    data: {
      merchantId: merchantKopi.id,
      promotionId: promoKopi.id,
      name: 'Poin Belanja Makan & Minum (Rp20.000 = 1 Poin)',
      description: 'Setiap pembelanjaan kelipatan Rp20.000 mendapatkan 1 poin.',
      icon: 'star',
      ruleType: 'AMOUNT_RATIO',
      pointsPerUnit: 1,
      amountPerPoint: 20000,
      minSpendAmount: 20000,
      maxPointsPerTx: 50,
      pointValidityDays: 180, // Poin berlaku 180 hari
      startAt: now,
      endAt: nextYear,
      isActive: true,
    },
  });

  // Rewards for Kopi Kenangan
  await prisma.reward.createMany({
    data: [
      {
        merchantId: merchantKopi.id,
        pointSystemId: psStamp.id,
        title: 'Gratis 1 Americano / Espresso',
        description: 'Tukarkan 5 stempel untuk 1 gelas Americano hangat atau dingin.',
        pointsCost: 5,
        quota: 100,
        voucherValidityDays: 30, // Berlaku 30 hari setelah voucher ditukarkan
        startAt: now,
        endAt: nextYear,
        isActive: true,
      },
      {
        merchantId: merchantKopi.id,
        pointSystemId: psStamp.id,
        title: 'Gratis 1 Kopi Kenangan Mantan (Large)',
        description: 'Menu legendaris dengan gula aren murni & susu segar ukuran Large.',
        pointsCost: 10,
        quota: 50,
        voucherValidityDays: 30,
        startAt: now,
        endAt: nextYear,
        isActive: true,
      },
      {
        merchantId: merchantKopi.id,
        pointSystemId: psStamp.id,
        title: 'Kombo Kenangan: 1 Toast & 1 Minuman',
        description: 'Bebas pilih varian toast asin/manis + 1 minuman reguler.',
        pointsCost: 15,
        quota: 30,
        voucherValidityDays: 45,
        startAt: now,
        endAt: nextYear,
        isActive: true,
      },
    ],
  });

  // Rewards for Dimsum
  const psDimsum = await prisma.pointSystem.create({
    data: {
      merchantId: merchantDimsum.id,
      name: 'Stempel Dimsum Hao Hao',
      description: '1 stempel setiap kedatangan dengan pesanan minimal 2 porsi dimsum.',
      icon: 'heart',
      ruleType: 'FIXED',
      pointsPerUnit: 1,
      pointValidityDays: 60,
      startAt: now,
      endAt: nextYear,
      isActive: true,
    },
  });

  await prisma.reward.createMany({
    data: [
      {
        merchantId: merchantDimsum.id,
        pointSystemId: psDimsum.id,
        title: 'Gratis 1 Porsi Siomay Ayam Jamur',
        description: 'Nikmati siomay kukus hangat isi 4 pcs.',
        pointsCost: 5,
        voucherValidityDays: 14,
        startAt: now,
        endAt: nextYear,
        isActive: true,
      },
      {
        merchantId: merchantDimsum.id,
        pointSystemId: psDimsum.id,
        title: 'Gratis 1 Porsi Hakau Udang & Es Teh Krisan',
        description: 'Kulit transparan kenyal dengan udang utuh segar.',
        pointsCost: 8,
        voucherValidityDays: 30,
        startAt: now,
        endAt: nextYear,
        isActive: true,
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`- Merchant 1: ${merchantKopi.name} (Slug: ${merchantKopi.slug})`);
  console.log(`- Merchant 2: ${merchantDimsum.name} (Slug: ${merchantDimsum.slug})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
