'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Gift,
  ArrowRight,
  Coffee,
  Star,
  ShoppingBag,
  Heart,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface TokenData {
  points: number;
  status: string;
  claimedByPhone?: string | null;
  expiresAt: string;
  merchant: {
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string;
    description?: string | null;
  };
  pointSystem: {
    name: string;
    icon: string;
    pointValidityDays: number;
  };
  rewards: Array<{
    id: string;
    title: string;
    description?: string | null;
    pointsCost: number;
  }>;
}

export default function ClaimClient({
  token,
  initialTokenData,
}: {
  token: string;
  initialTokenData: TokenData;
}) {
  const [tokenData] = useState<TokenData>(initialTokenData);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<{
    newBalance: number;
    walletUrl: string;
    phone: string;
  } | null>(null);

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return <Coffee className="w-5 h-5" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-5 h-5" />;
      case 'heart':
        return <Heart className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone || phone.trim().length < 8) {
      setError('Masukkan nomor WhatsApp kamu yang aktif (contoh: 08123456789).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengklaim stempel');
        setLoading(false);
        return;
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.log('Confetti effect failed', err);
      }

      setClaimSuccess({
        newBalance: data.newTotalBalance,
        walletUrl: data.walletUrl,
        phone: data.phone,
      });
    } catch (err: unknown) {
      console.error(err);
      setError('Terjadi kendala koneksi, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Already claimed view
  if (tokenData.status === 'CLAIMED' && !claimSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Stempel Telah Diklaim</h1>
          <p className="text-slate-600 mb-6 text-sm">
            QR code stempel ini sudah pernah diklaim sebelumnya oleh pelanggan{' '}
            <span className="font-semibold text-slate-800">{tokenData.claimedByPhone}</span>.
          </p>
          <Link
            href={`/wallet/${tokenData.merchant.slug}`}
            className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-2xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-md"
          >
            Lihat Kartu Loyalitas Merchant
          </Link>
        </div>
      </div>
    );
  }

  // Expired QR view
  if (tokenData.status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">QR Code Kedaluwarsa</h1>
          <p className="text-slate-600 mb-6 text-sm">
            Batas waktu klaim untuk QR code stempel ini sudah habis. Silakan minta kasir untuk
            menghasilkan QR code baru.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 px-6 rounded-2xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Merchant Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 text-3xl mb-3">
            {tokenData.merchant.logoUrl || '🏷️'}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{tokenData.merchant.name}</h2>
          {tokenData.merchant.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {tokenData.merchant.description}
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Points acquired highlight banner */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-15">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-3">
              {renderIcon(tokenData.pointSystem.icon)}
              <span>{tokenData.pointSystem.name}</span>
            </div>
            <div className="text-5xl font-black tracking-tight mb-1">
              +{tokenData.points}
            </div>
            <div className="text-sm font-medium text-amber-100">
              Stempel Baru Siap Diklaim!
            </div>
          </div>

          <div className="p-6">
            {!claimSuccess ? (
              /* Claim Input Form */
              <form onSubmit={handleClaim} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nomor WhatsApp Kamu
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      required
                      autoFocus
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium text-base shadow-sm"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Info stempel & katalog reward akan dikirim via WhatsApp Fonnte.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nama Panggilan <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama kamu"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm"
                  />
                </div>

                {/* Expiration Note */}
                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100/80 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    Stempel berlaku selama{' '}
                    <span className="font-semibold">{tokenData.pointSystem.pointValidityDays} hari</span>{' '}
                    setelah diklaim. Tidak perlu unduh aplikasi apapun!
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] transition-all text-white font-bold text-base shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Klaim Stempel Sekarang</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Success View */
              <div className="text-center py-2 space-y-5 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Stempel Berhasil Masuk!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Nomor: <span className="font-semibold text-slate-700">{claimSuccess.phone}</span>
                  </p>
                </div>

                {/* Total Balance Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md text-center">
                  <div className="text-xs font-medium text-slate-300 uppercase tracking-wider mb-1">
                    Total Stempel Kamu di {tokenData.merchant.name}
                  </div>
                  <div className="text-4xl font-black text-amber-400">
                    {claimSuccess.newBalance} <span className="text-lg font-bold text-white">Stempel</span>
                  </div>
                </div>

                {/* WhatsApp Notification Notice */}
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 text-left flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 leading-relaxed">
                    <span className="font-bold">Notifikasi WhatsApp Terkirim!</span>
                    <br />
                    Rincian stempel dan daftar promo hadiah telah dikirim ke nomor WhatsApp kamu.
                  </div>
                </div>

                {/* Action button to open card */}
                <Link
                  href={claimSuccess.walletUrl}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Buka Kartu Loyalitas Saya</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* Reward Teaser */}
            {tokenData.rewards.length > 0 && !claimSuccess && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Hadiah Yang Bisa Ditukar</span>
                </div>
                <div className="space-y-2">
                  {tokenData.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="font-medium text-slate-800">{reward.title}</div>
                      <div className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold shrink-0">
                        {reward.pointsCost} stempel
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400">
            Didukung oleh <span className="font-semibold text-slate-600">Loyalti</span> • Loyalty tanpa ribet akun
          </p>
        </div>
      </div>
    </div>
  );
}
