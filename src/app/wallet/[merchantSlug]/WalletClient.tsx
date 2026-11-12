'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Coffee,
  Gift,
  Clock,
  Ticket,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  User,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { formatPhoneForDisplay } from '@/lib/fonnte';

interface RewardItem {
  id: string;
  title: string;
  description?: string | null;
  pointsCost: number;
  voucherValidityDays: number;
  quota?: number | null;
  redeemedCount: number;
}

interface PointBatchItem {
  id: string;
  pointsRemaining: number;
  expiresAt: string | null;
  notes?: string | null;
  createdAt: string;
}

interface RedemptionItem {
  id: string;
  voucherCode: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  rewardTitle: string;
  pointsSpent: number;
}

interface MerchantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string;
  description?: string | null;
  promotions: Array<{
    id: string;
    title: string;
    description?: string | null;
    endAt: string;
  }>;
  rewards: RewardItem[];
}

export default function WalletClient({
  merchant,
  initialPhone,
  initialCustomer,
  initialWallet,
  initialBatches,
  initialRedemptions,
}: {
  merchant: MerchantInfo;
  initialPhone: string;
  initialCustomer: { phone: string; name?: string | null } | null;
  initialWallet: { totalPoints: number; lifetimePoints: number };
  initialBatches: PointBatchItem[];
  initialRedemptions: RedemptionItem[];
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [customer, setCustomer] = useState(initialCustomer);
  const [wallet, setWallet] = useState(initialWallet);
  const [batches, setBatches] = useState(initialBatches);
  const [redemptions, setRedemptions] = useState(initialRedemptions);

  const [activeTab, setActiveTab] = useState<'card' | 'rewards' | 'vouchers' | 'expiry'>('card');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<RedemptionItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [loadingLookup, setLoadingLookup] = useState(false);

  // Handle looking up phone number
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.trim().length < 8) return;

    setLoadingLookup(true);
    try {
      const res = await fetch(`/api/wallet/${merchant.slug}?phone=${encodeURIComponent(phoneInput)}`);
      const data = await res.json();
      if (res.ok) {
        setPhone(phoneInput);
        setCustomer(data.customer);
        setWallet(data.wallet || { totalPoints: 0, lifetimePoints: 0 });
        setBatches(
          (data.batches || []).map((b: any) => ({
            id: b.id,
            pointsRemaining: b.pointsRemaining,
            expiresAt: b.expiresAt,
            notes: b.notes,
            createdAt: b.createdAt,
          }))
        );
        setRedemptions(
          (data.redemptions || []).map((rd: any) => ({
            id: rd.id,
            voucherCode: rd.voucherCode,
            status: rd.status,
            expiresAt: rd.expiresAt,
            createdAt: rd.createdAt,
            rewardTitle: rd.reward.title,
            pointsSpent: rd.pointsSpent,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLookup(false);
    }
  };

  // Handle reward redemption
  const handleRedeem = async (reward: RewardItem) => {
    if (!customer?.phone) {
      setActiveTab('card');
      return;
    }

    if (wallet.totalPoints < reward.pointsCost) {
      setErrorMsg(`Stempel tidak mencukupi (${wallet.totalPoints}/${reward.pointsCost} stempel)`);
      return;
    }

    const confirmRedeem = confirm(
      `Tukarkan ${reward.pointsCost} stempel untuk "${reward.title}"?`
    );
    if (!confirmRedeem) return;

    setRedeemingId(reward.id);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/wallet/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.phone,
          rewardId: reward.id,
          merchantSlug: merchant.slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menukarkan voucher');
        setRedeemingId(null);
        return;
      }

      // Trigger confetti
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch (err) {
        console.log(err);
      }

      setWallet((prev) => ({
        ...prev,
        totalPoints: data.remainingPoints,
      }));

      const newRedemption: RedemptionItem = {
        id: data.redemption.id,
        voucherCode: data.redemption.voucherCode,
        status: data.redemption.status,
        expiresAt: data.redemption.expiresAt,
        createdAt: data.redemption.createdAt,
        rewardTitle: reward.title,
        pointsSpent: reward.pointsCost,
      };

      setRedemptions([newRedemption, ...redemptions]);
      setRedeemSuccess(newRedemption);
      setActiveTab('vouchers');
    } catch (err) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setRedeemingId(null);
    }
  };

  // Stamp slots for digital stamp card visualization (standard 10 slots)
  const STAMP_SLOTS = 10;
  const currentStamps = wallet.totalPoints % STAMP_SLOTS;
  const completedCards = Math.floor(wallet.totalPoints / STAMP_SLOTS);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 pb-20">
      <div className="w-full max-w-md">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Lokaloyal Pass
          </div>
        </div>

        {/* Merchant Card Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/50 flex items-center justify-center text-3xl shrink-0">
              {merchant.logoUrl || '☕'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-slate-900 truncate">{merchant.name}</h1>
              {merchant.promotions.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  {merchant.promotions[0].title}
                </span>
              )}
            </div>
          </div>

          {/* Customer info or phone prompt */}
          {customer ? (
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">
                  {formatPhoneForDisplay(customer.phone)}
                </span>
                {customer.name && <span className="text-slate-400">({customer.name})</span>}
              </div>
              <button
                onClick={() => {
                  setCustomer(null);
                  setPhone('');
                }}
                className="text-[11px] text-indigo-600 hover:underline font-medium"
              >
                Ganti Nomor
              </button>
            </div>
          ) : (
            <form onSubmit={handleLookup} className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-700">
                Masukkan nomor WhatsApp untuk melihat stempelmu:
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="08123456789"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0"
                >
                  {loadingLookup ? '...' : 'Cari'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 rounded-2xl mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('card')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'card'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kartu
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hadiah ({merchant.rewards.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`py-2 rounded-xl transition-all relative ${
              activeTab === 'vouchers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Voucher
            {redemptions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                {redemptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('expiry')}
            className={`py-2 rounded-xl transition-all ${
              activeTab === 'expiry'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Masa Berlaku
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-2xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: DIGITAL STAMP CARD */}
        {activeTab === 'card' && (
          <div className="space-y-4">
            {/* Visual Loyalty Stamp Card */}
            <div className="bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[11px] font-semibold text-amber-200 uppercase tracking-widest">
                    Digital Stamp Card
                  </div>
                  <div className="text-2xl font-black">{merchant.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-amber-100">
                    {wallet.totalPoints}
                  </div>
                  <div className="text-[11px] text-amber-200 font-medium">Total Stempel</div>
                </div>
              </div>

              {/* 10 Stamps Grid */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: STAMP_SLOTS }).map((_, index) => {
                    const isStamped =
                      index < currentStamps || (wallet.totalPoints > 0 && currentStamps === 0);
                    const isTarget = index === 9; // 10th slot is bonus/free reward
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                          isStamped
                            ? 'bg-white text-amber-600 shadow-md scale-105'
                            : 'border-2 border-dashed border-white/40 text-white/50'
                        }`}
                      >
                        {isStamped ? (
                          <div className="animate-in zoom-in duration-200 flex flex-col items-center">
                            <Coffee className="w-5 h-5 fill-amber-600" />
                            <span className="text-[9px] font-black mt-0.5">{index + 1}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            {isTarget ? (
                              <Gift className="w-5 h-5 opacity-70 text-amber-200" />
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {completedCards > 0 && (
                <div className="mt-3 text-center text-xs font-medium text-amber-100">
                  🏆 Kamu sudah menyelesaikan{' '}
                  <span className="font-bold text-white">{completedCards} kartu stempel penuh</span>!
                </div>
              )}
            </div>

            {/* Quick Next Reward Teaser */}
            {merchant.rewards.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Hadiah Terdekat:</div>
                    <div className="text-sm font-bold text-slate-900">
                      {merchant.rewards[0].title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('rewards')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl"
                >
                  <span>Tukar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REWARDS CATALOG */}
        {activeTab === 'rewards' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Katalog Hadiah
              </span>
              <span className="text-xs font-semibold text-amber-600">
                Saldo: {wallet.totalPoints} Stempel
              </span>
            </div>

            {merchant.rewards.map((reward) => {
              const canAfford = wallet.totalPoints >= reward.pointsCost;
              const progressPct = Math.min(
                100,
                Math.round((wallet.totalPoints / reward.pointsCost) * 100)
              );

              return (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{reward.title}</h3>
                      {reward.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{reward.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Voucher aktif {reward.voucherValidityDays} hari setelah ditukar</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl font-black text-sm shrink-0 border border-amber-200/50">
                      {reward.pointsCost} <span className="text-[10px] font-bold">stempel</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
                      <span>Progres stempel</span>
                      <span>
                        {wallet.totalPoints} / {reward.pointsCost}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || redeemingId === reward.id}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      canAfford
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === reward.id ? (
                      'Memproses...'
                    ) : canAfford ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tukarkan Sekarang</span>
                      </>
                    ) : (
                      `Kurang ${reward.pointsCost - wallet.totalPoints} stempel lagi`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: ACTIVE VOUCHERS */}
        {activeTab === 'vouchers' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Voucher & Kupon Saya
            </div>

            {redeemSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
                <div className="font-bold text-emerald-900 text-sm">Voucher Berhasil Diterbitkan!</div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  Tunjukkan kode voucher berikut kepada kasir saat pembayaran.
                </div>
              </div>
            )}

            {redemptions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/70 text-slate-400">
                <Ticket className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-slate-600">Belum ada voucher aktif</p>
                <p className="text-xs mt-1">
                  Kumpulkan stempelmu dan tukarkan hadiah di tab Hadiah!
                </p>
              </div>
            ) : (
              redemptions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      Kupon Siap Pakai
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kedaluwarsa:{' '}
                      {new Date(item.expiresAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-3">{item.rewardTitle}</h4>

                  {/* Voucher code box */}
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-3 text-center">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                      Kode Voucher Kasir
                    </div>
                    <div className="text-2xl font-mono font-black text-indigo-700 tracking-wider">
                      {item.voucherCode}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PER-BATCH EXPIRY TRACKER */}
        {activeTab === 'expiry' && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Rincian Masa Berlaku Stempel (FIFO)
            </div>

            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Ketentuan Masa Berlaku:</span>
              <br />
              Setiap stempel memiliki masa kedaluwarsa tersendiri yang dihitung sejak tanggal transaksi.
              Stempel yang mendekati kedaluwarsa akan digunakan terlebih dahulu saat penukaran voucher.
            </div>

            {batches.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/70 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold text-slate-600">Belum ada riwayat stempel aktif</p>
              </div>
            ) : (
              batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">
                      +{batch.pointsRemaining} Stempel
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {batch.notes || 'Poin transaksi'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Didapat:{' '}
                      {new Date(batch.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5" />
                      {batch.expiresAt
                        ? new Date(batch.expiresAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Tidak Kedaluwarsa'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
