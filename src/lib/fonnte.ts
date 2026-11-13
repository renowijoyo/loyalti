import prisma from './prisma';

export interface SendWhatsAppParams {
  phone: string;
  message: string;
  merchantId?: string;
  customerId?: string;
  customToken?: string | null;
}

export interface FonnteResponse {
  status: boolean;
  message?: string;
  reason?: string;
  id?: string[];
  process?: string;
}

/**
 * Normalizes phone numbers to standard Indonesian WhatsApp format (e.g., 6281234567890 or 08123456789)
 */
export function normalizePhoneNumber(rawPhone: string): string {
  // Remove non-numeric characters except +
  let cleaned = rawPhone.trim().replace(/[^0-9]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 8) {
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Formats a phone number for display (e.g., 0812-3456-7890)
 */
export function formatPhoneForDisplay(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) {
    clean = '0' + clean.substring(2);
  }
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

/**
 * Sends a WhatsApp message via Fonnte API
 */
export async function sendWhatsAppMessage({
  phone,
  message,
  merchantId,
  customerId,
  customToken,
}: SendWhatsAppParams): Promise<{ success: boolean; data?: FonnteResponse; error?: string }> {
  const normalizedTarget = normalizePhoneNumber(phone);
  const token = customToken || process.env.FONNTE_DEFAULT_TOKEN || '';

  // If no token configured, simulate sending & log to database
  if (!token || token.trim() === '') {
    console.log('\n========================================');
    console.log('📱 [FONNTE SIMULATED WA MESSAGE]');
    console.log(`To: ${normalizedTarget}`);
    console.log(`Message:\n${message}`);
    console.log('========================================\n');

    await prisma.notificationLog.create({
      data: {
        phone: normalizedTarget,
        merchantId,
        customerId,
        provider: 'FONNTE',
        message,
        status: 'SENT',
        apiResponse: JSON.stringify({
          simulated: true,
          note: 'No FONNTE_DEFAULT_TOKEN provided, logged locally',
        }),
      },
    });

    return {
      success: true,
      data: {
        status: true,
        message: 'Simulated send (no Fonnte API token set)',
      },
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('target', normalizedTarget);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const result = (await res.json()) as FonnteResponse;

    await prisma.notificationLog.create({
      data: {
        phone: normalizedTarget,
        merchantId,
        customerId,
        provider: 'FONNTE',
        message,
        status: result.status ? 'SENT' : 'FAILED',
        apiResponse: JSON.stringify(result),
      },
    });

    if (!result.status) {
      console.error('Fonnte API error response:', result);
      return { success: false, error: result.reason || 'Failed to send WhatsApp message via Fonnte' };
    }

    return { success: true, data: result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Fonnte API network exception:', err);

    await prisma.notificationLog.create({
      data: {
        phone: normalizedTarget,
        merchantId,
        customerId,
        provider: 'FONNTE',
        message,
        status: 'FAILED',
        apiResponse: JSON.stringify({ error: errorMsg }),
      },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * Message template builder for claim notifications
 */
export function buildClaimNotificationMessage({
  merchantName,
  pointsEarned,
  pointSystemName,
  totalBalance,
  availableRewards,
  walletUrl,
  expirationNote,
}: {
  merchantName: string;
  pointsEarned: number;
  pointSystemName: string;
  totalBalance: number;
  availableRewards: Array<{ title: string; pointsCost: number }>;
  walletUrl: string;
  expirationNote?: string;
}): string {
  let rewardText = '';
  if (availableRewards.length > 0) {
    rewardText =
      '\n🎁 *Hadiah & Kupon yang bisa kamu tukarkan:*\n' +
      availableRewards.map((r) => `• *${r.title}* (${r.pointsCost} stempel)`).join('\n') +
      '\n';
  } else {
    rewardText = '\nKumpulkan terus stempelmu untuk menukarkan berbagai voucher menarik!\n';
  }

  const expiryLine = expirationNote ? `\n⏳ _Catatan: ${expirationNote}_\n` : '';

  return (
    `🎉 *Selamat! Kamu baru saja mendapatkan stempel di ${merchantName}!*\n\n` +
    `➕ *Stempel Masuk:* +${pointsEarned} (${pointSystemName})\n` +
    `⭐ *Total Stempel Kamu Saat Ini:* *${totalBalance} stempel*\n` +
    rewardText +
    expiryLine +
    `\n📱 *Buka Kartu Loyalitas & Kupon Kamu:* \n${walletUrl}\n\n` +
    `_Terima kasih telah berbelanja di ${merchantName}!_`
  );
}

/**
 * Message template builder for WhatsApp number binding confirmation
 */
export function buildPhoneBindNotificationMessage({
  displayPhone,
  email,
  label,
  accountUrl,
}: {
  displayPhone: string;
  email: string;
  label?: string | null;
  accountUrl: string;
}): string {
  const labelLine = label ? `🏷️ *Label:* ${label}\n` : '';
  return (
    `✅ *Nomor WhatsApp Berhasil Terhubung ke Akun Loyalti!*\n\n` +
    `📱 *Nomor WA:* ${displayPhone}\n` +
    labelLine +
    `📧 *Email Akun:* ${email}\n\n` +
    `Sekarang kamu bisa melihat seluruh poin dan riwayat transaksi dari nomor ini di:\n${accountUrl}\n\n` +
    `_Jika kamu tidak merasa melakukan tindakan ini, segera lepaskan nomor ini dari halaman Akun Pelanggan._`
  );
}
