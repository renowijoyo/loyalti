'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Store,
  ArrowRight,
  Receipt,
  SlidersHorizontal,
  Smartphone,
  RotateCcw,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

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
  qrExpiryMinutes?: number;
  pointSystems: PointSystemInfo[];
}

interface TodayTransaction {
  id: string;
  token: string;
  points: number;
  billReference?: string | null;
  status: string;
  claimedByPhone?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  claimUrl: string;
  qrDataUrl: string;
  pointSystemName: string;
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

  // Active cashier tab: 'pos' (QR generator) or 'history' (Today's transactions)
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Transaction input states (Effortless: only points + optional offline reference)
  const [stampsCount, setStampsCount] = useState<number>(1);
  const [billRef, setBillRef] = useState<string>('');

  // Active QR session
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    token: string;
    claimUrl: string;
    qrDataUrl: string;
    points: number;
    billReference?: string;
    status: string;
    claimedByPhone?: string | null;
    expiresAt?: string;
  } | null>(null);

  // Today's transactions state
  const [todayTransactions, setTodayTransactions] = useState<TodayTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch today's transactions
  const fetchTodayTransactions = useCallback(async () => {
    if (!selectedMerchantId) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/pos/today-transactions?merchantId=${selectedMerchantId}`);
      if (res.ok) {
        const data = await res.json();
        setTodayTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch today transactions:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedMerchantId]);

  useEffect(() => {
    fetchTodayTransactions();
  }, [fetchTodayTransactions]);

  // Generate QR code for customer
  const handleGenerateQR = async () => {
    if (!selectedMerchant) return;
    setLoadingGenerate(true);

    try {
      const res = await fetch('/api/pos/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: selectedMerchant.id,
          points: stampsCount,
          billReference: billRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActiveSession({
          token: data.token,
          claimUrl: data.claimUrl,
          qrDataUrl: data.qrDataUrl,
          points: data.points || stampsCount,
          billReference: data.billReference,
          status: 'PENDING',
          expiresAt: data.claimToken?.expiresAt,
        });
        setActiveTab('pos');
        fetchTodayTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGenerate(false);
    }
  };

  // Poll token status in real-time
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
            fetchTodayTransactions();
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
  }, [activeSession, fetchTodayTransactions]);

  const handleNextTransaction = () => {
    setActiveSession(null);
    setStampsCount(1);
    setBillRef('');
  };

  // Re-display a previous transaction QR from history
  const handleReopenQR = (tx: TodayTransaction) => {
    setActiveSession({
      token: tx.token,
      claimUrl: tx.claimUrl,
      qrDataUrl: tx.qrDataUrl,
      points: tx.points,
      billReference: tx.billReference || undefined,
      status: tx.status,
      claimedByPhone: tx.claimedByPhone,
      expiresAt: tx.expiresAt,
    });
    setActiveTab('pos');
  };

  const pendingCount = todayTransactions.filter((t) => t.status === 'PENDING').length;
  const claimedCount = todayTransactions.filter((t) => t.status === 'CLAIMED').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Header with Cashier vs Admin Mode Switcher */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
            L
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <span>Cashier Mode</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                POS QR
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              {selectedMerchant?.name || 'Toko'} • Generate QR stempel untuk HP pelanggan
            </p>
          </div>
        </div>

        {/* Central Mode Switcher (Cashier vs Admin) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
          <span className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1.5 cursor-default">
            <QrCode className="w-3.5 h-3.5" />
            <span>Cashier</span>
          </span>
          <Link
            href="/merchant/manage"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            title="Beralih ke Admin Mode"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin</span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/merchant/register"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            + Toko Baru
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            Beranda
          </Link>
        </div>
      </header>

      {/* Cashier Sub-navigation: Generate QR vs Today's Transactions */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Buat QR Stempel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              fetchTodayTransactions();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Transaksi Hari Ini</span>
            {todayTransactions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-mono">
                {todayTransactions.length}
              </span>
            )}
          </button>
        </div>

        {/* Store Selector */}
        {merchants.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Outlet:</span>
            <select
              value={selectedMerchantId}
              onChange={(e) => {
                setSelectedMerchantId(e.target.value);
                setActiveSession(null);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.logoUrl} {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-8 flex items-center justify-center">
        {activeTab === 'pos' ? (
          /* TAB 1: EFFORTLESS QR GENERATOR */
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left Column: Fast Effortless Input */}
            <div className="md:col-span-5 space-y-5 bg-white border border-slate-200/80 p-5 sm:p-7 rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Input Stempel Kasir
                </span>
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  Cepat & Praktis
                </span>
              </div>

              {/* 1. Point / Stamp Amount with 1-Tap Presets */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Jumlah Stempel yang Diberikan <span className="text-rose-500">*</span>
                </label>

                {/* Big Counter Stepper */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStampsCount((prev) => Math.max(1, prev - 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl transition-colors active:scale-95"
                    title="Kurangi"
                  >
                    <Minus className="w-6 h-6" />
                  </button>

                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3 text-center">
                    <div className="text-4xl font-black text-amber-600 tracking-tight">
                      +{stampsCount}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Stempel
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStampsCount((prev) => Math.min(50, prev + 1))}
                    className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl transition-colors active:scale-95"
                    title="Tambah"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick 1-Tap Preset Chips */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStampsCount(num)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        stampsCount === num
                          ? 'bg-amber-500 text-slate-950 shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Optional Reference Field (Traditional / Offline Transaction Number) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>No. Struk / Ref Offline</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={billRef}
                  onChange={(e) => setBillRef(e.target.value)}
                  placeholder="Contoh: 0042 atau INV-892"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Bisa dimasukkan nomor nota manual/kertas kasir kamu.
                </p>
              </div>

              {/* 3. Primary 1-Tap Generate Button */}
              <button
                type="button"
                onClick={handleGenerateQR}
                disabled={loadingGenerate}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50"
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

            {/* Right Column: Customer Scan Screen */}
            <div className="md:col-span-7 flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 min-h-[460px] text-center shadow-sm relative overflow-hidden">
              {!activeSession ? (
                /* Idle state waiting for cashier action */
                <div className="space-y-4 max-w-sm">
                  <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Siap Buat QR Stempel</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Pilih jumlah stempel di sebelah kiri dan klik{' '}
                    <span className="font-semibold text-slate-800">&quot;Tampilkan QR Stempel&quot;</span>.{' '}
                    Layar ini dioptimalkan untuk di-scan oleh kamera HP pelanggan.
                  </p>
                </div>
              ) : activeSession.status === 'CLAIMED' ? (
                /* Claimed Success Screen */
                <div className="space-y-6 animate-in zoom-in-95 duration-300 max-w-md w-full">
                  <div className="w-24 h-24 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 className="w-14 h-14" />
                  </div>

                  <div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
                      Klaim Stempel Berhasil!
                    </div>
                    <h3 className="text-3xl font-black text-slate-900">
                      +{activeSession.points} Stempel Masuk
                    </h3>
                    <p className="text-sm text-slate-600 mt-2">
                      WhatsApp Pelanggan:{' '}
                      <span className="font-mono font-bold text-amber-600 text-base">
                        {activeSession.claimedByPhone}
                      </span>
                    </p>
                    {activeSession.billReference && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Ref: #{activeSession.billReference}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-200/80">
                    Notifikasi rincian saldo dan kartu reward langsung dikirimkan ke WhatsApp pelanggan.
                  </div>

                  <button
                    type="button"
                    onClick={handleNextTransaction}
                    className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all"
                  >
                    <span>Transaksi Baru (+1)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Live QR Screen (Customer Facing) */
                <div className="space-y-4 max-w-sm w-full animate-in fade-in duration-200">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span>Menunggu HP Pelanggan Scan...</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    Arahkan Pelanggan Scan QR Code
                  </h3>

                  {/* QR Code Container (High Contrast, Large Touch target) */}
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeSession.qrDataUrl}
                      alt="QR Stempel Loyalti"
                      className="w-64 h-64 object-contain"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-700">
                      Nilai:{' '}
                      <span className="font-black text-amber-600 text-sm">
                        +{activeSession.points} Stempel
                      </span>
                      {activeSession.billReference && (
                        <span className="text-slate-500">
                          {' '}
                          • Ref:{' '}
                          <span className="font-mono font-bold text-slate-800">
                            #{activeSession.billReference}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 bg-slate-50 py-1.5 px-3 rounded-full border border-slate-200/80">
                    <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Tunjukkan layar ini ke kamera WhatsApp/HP pelanggan</span>
                  </div>

                  {/* Action row for cashier */}
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveSession(null)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ubah / Batal</span>
                    </button>

                    <a
                      href={activeSession.claimUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1.5 px-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 transition-colors"
                    >
                      <span>Simulasi HP Customer</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: TODAY'S TRANSACTIONS (In case previous customer wants to see their QR code again) */
          <div className="max-w-4xl w-full bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  <span>Daftar Transaksi Stempel Hari Ini</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klik transaksi di bawah ini jika pelanggan sebelumnya ingin melihat atau scan ulang
                  QR stempel mereka.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                  Total: {todayTransactions.length}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                  Diklaim: {claimedCount}
                </span>
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold">
                  Belum: {pendingCount}
                </span>
                <button
                  type="button"
                  onClick={fetchTodayTransactions}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                  title="Muat Ulang"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                <span>Memuat data transaksi hari ini...</span>
              </div>
            ) : todayTransactions.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Receipt className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-700">Belum Ada Transaksi Hari Ini</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Transaksi stempel yang kasir buat hari ini akan muncul di sini secara otomatis.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('pos')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Buat QR Stempel Pertama
                </button>
              </div>
            ) : (
              /* Transaction list */
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto pr-1">
                {todayTransactions.map((tx) => {
                  const txTime = new Date(tx.createdAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                            tx.status === 'CLAIMED'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : tx.status === 'EXPIRED'
                              ? 'bg-slate-100 text-slate-400'
                              : 'bg-amber-100 text-amber-700 border border-amber-300'
                          }`}
                        >
                          +{tx.points}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              {tx.billReference ? `#${tx.billReference}` : `Token: ${tx.token}`}
                            </span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {txTime}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mt-0.5">
                            {tx.status === 'CLAIMED' ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Diklaim oleh {tx.claimedByPhone}
                              </span>
                            ) : tx.status === 'EXPIRED' ? (
                              <span className="text-slate-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                Kedaluwarsa (Batas waktu habis)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Menunggu scan pelanggan
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action: Re-open QR */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleReopenQR(tx)}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          <span>Tampilkan QR Lagi</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
