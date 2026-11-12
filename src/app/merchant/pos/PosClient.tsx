'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Store,
  Layers,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PointSystemInfo {
  id: string;
  name: string;
  ruleType: string;
  pointsPerUnit: number;
  amountPerPoint: number;
  icon: string;
}

interface MerchantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  pointSystems: PointSystemInfo[];
}

export default function PosClient({
  initialMerchants,
}: {
  initialMerchants: MerchantInfo[];
}) {
  const [merchants] = useState<MerchantInfo[]>(initialMerchants);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    initialMerchants[0]?.id || ''
  );

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  const [selectedPsId, setSelectedPsId] = useState<string>(
    selectedMerchant?.pointSystems[0]?.id || ''
  );

  useEffect(() => {
    if (selectedMerchant?.pointSystems[0]) {
      setSelectedPsId(selectedMerchant.pointSystems[0].id);
    }
  }, [selectedMerchantId, selectedMerchant]);

  const selectedPs = selectedMerchant?.pointSystems.find((ps) => ps.id === selectedPsId);

  // Transaction input states
  const [stampsCount, setStampsCount] = useState<number>(1);
  const [billAmount, setBillAmount] = useState<number>(50000);
  const [billRef, setBillRef] = useState<string>('');

  // Active QR session
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    token: string;
    claimUrl: string;
    qrDataUrl: string;
    points: number;
    status: string;
    claimedByPhone?: string | null;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate points for AMOUNT_RATIO
  useEffect(() => {
    if (selectedPs?.ruleType === 'AMOUNT_RATIO') {
      const calculated = Math.max(1, Math.floor(billAmount / (selectedPs.amountPerPoint || 10000)));
      setStampsCount(calculated);
    }
  }, [billAmount, selectedPs]);

  // Generate QR
  const handleGenerateQR = async () => {
    if (!selectedMerchant) return;
    setLoadingGenerate(true);

    try {
      const res = await fetch('/api/pos/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant.id,
          pointSystemId: selectedPsId,
          points: stampsCount,
          transactionAmount: selectedPs?.ruleType === 'AMOUNT_RATIO' ? billAmount : 0,
          billReference: billRef.trim() || undefined,
          expiryMinutes: 15,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveSession({
          token: data.token,
          claimUrl: data.claimUrl,
          qrDataUrl: data.qrDataUrl,
          points: stampsCount,
          status: 'PENDING',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Poll token status
  useEffect(() => {
    if (!activeSession || activeSession.status === 'CLAIMED') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/pos/token-status/${activeSession.token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'CLAIMED') {
            setActiveSession((prev) =>
              prev
                ? {
                    ...prev,
                    status: 'CLAIMED',
                    claimedByPhone: data.claimedByPhone,
                  }
                : null
            );
          }
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    };

    pollingRef.current = setInterval(poll, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeSession]);

  const handleNextTransaction = () => {
    setActiveSession(null);
    setStampsCount(1);
    setBillRef('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl">
            L
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              Loyalti POS Terminal
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                KASIR ONLINE
              </span>
            </h1>
            <p className="text-xs text-slate-400">Pemberian stempel & poin transaksi pelanggan</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/merchant/manage"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            Pengaturan Program
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            Beranda
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Column: Transaction Input */}
          <div className="md:col-span-5 space-y-6 bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-2xl backdrop-blur">
            {/* Merchant Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-400" />
                <span>Pilih Outlet / Merchant</span>
              </label>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.logoUrl} {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Point System Selector */}
            {selectedMerchant && selectedMerchant.pointSystems.length > 0 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Sistem Stempel / Poin</span>
                </label>
                <div className="space-y-2">
                  {selectedMerchant.pointSystems.map((ps) => (
                    <button
                      key={ps.id}
                      type="button"
                      onClick={() => setSelectedPsId(ps.id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                        selectedPsId === ps.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 font-medium hover:border-slate-600'
                      }`}
                    >
                      <div>{ps.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ps.ruleType === 'FIXED'
                          ? `Stempel Tetap (Default +${ps.pointsPerUnit} stempel)`
                          : `Kelipatan Belanja (Rp${ps.amountPerPoint.toLocaleString()} = 1 Poin)`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stamp Count or Bill Amount */}
            {selectedPs?.ruleType === 'AMOUNT_RATIO' ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>Total Tagihan Belanja (IDR)</span>
                </label>
                <input
                  type="number"
                  step="5000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="text-xs text-amber-400 font-semibold mt-1.5">
                  = Diberikan: {stampsCount} Poin
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Jumlah Stempel yang Diberikan
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStampsCount((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-200 transition-colors"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-3 text-center text-3xl font-black text-amber-400">
                    +{stampsCount}
                  </div>
                  <button
                    type="button"
                    onClick={() => setStampsCount((prev) => Math.min(20, prev + 1))}
                    className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick preset stamps */}
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStampsCount(num)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        stampsCount === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerateQR}
              disabled={loadingGenerate}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loadingGenerate ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Tampilkan QR Stempel</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live QR Code Display / Claim Confirmation */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-3xl p-8 min-h-[460px] text-center shadow-2xl relative overflow-hidden">
            {!activeSession ? (
              <div className="space-y-4 max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center mx-auto">
                  <QrCode className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-300">QR Stempel Belum Dibuat</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih jumlah stempel pada panel kiri dan klik tombol{' '}
                  <span className="text-slate-300 font-semibold">&quot;Tampilkan QR Stempel&quot;</span>{' '}
                  untuk menampilkan QR code dinamis kepada pelanggan.
                </p>
              </div>
            ) : activeSession.status === 'CLAIMED' ? (
              /* Success Screen when claimed! */
              <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-md">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-14 h-14" />
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">
                    Klaim Stempel Berhasil!
                  </div>
                  <h3 className="text-3xl font-black text-white">
                    +{activeSession.points} Stempel Masuk
                  </h3>
                  <p className="text-sm text-slate-300 mt-2">
                    Pelanggan:{' '}
                    <span className="font-mono font-bold text-amber-400">
                      {activeSession.claimedByPhone}
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-400 border border-slate-800">
                  Notifikasi rincian reward & link kartu loyalitas telah otomatis dikirimkan ke WhatsApp pelanggan via Fonnte.
                </div>

                <button
                  type="button"
                  onClick={handleNextTransaction}
                  className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Transaksi Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Live Waiting for Scan & Phone Registration */
              <div className="space-y-4 max-w-sm">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menunggu Pelanggan Scan & Input Nomor...</span>
                </div>

                <h3 className="text-lg font-bold text-white">
                  Arahkan Pelanggan Scan QR Code
                </h3>

                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeSession.qrDataUrl}
                    alt="QR Stempel Loyalti"
                    className="w-64 h-64 object-contain"
                  />
                </div>

                <div className="text-xs text-slate-400">
                  Nilai: <span className="font-bold text-amber-400">+{activeSession.points} Stempel</span> •
                  Masa berlaku QR 15 menit
                </div>

                {/* Simulation button for easy testing */}
                <div className="pt-2">
                  <a
                    href={activeSession.claimUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    <span>Buka Tampilan HP Customer (Simulasi)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
