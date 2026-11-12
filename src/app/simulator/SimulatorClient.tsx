'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Smartphone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Gift,
  Plus,
  Minus,
  Check,
  Receipt,
  RotateCcw,
  Store,
  Share2,
  Coffee,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface DemoStorePreset {
  name: string;
  icon: string;
  category: string;
  rewardTitle: string;
}

const DEMO_STORES: DemoStorePreset[] = [
  {
    name: 'Kopi Senja Nusantara',
    icon: '☕',
    category: 'Coffee Shop',
    rewardTitle: 'Gratis 1 Iced Caramel Latte',
  },
  {
    name: 'Mama Bakery & Pastry',
    icon: '🥐',
    category: 'Bakery',
    rewardTitle: 'Gratis 1 Croissant Butter',
  },
  {
    name: 'Burger Brothers Bar',
    icon: '🍔',
    category: 'Resto & Cafe',
    rewardTitle: 'Gratis 1 Cheeseburger Spesial',
  },
  {
    name: 'Urban Chic Boutique',
    icon: '👗',
    category: 'Fashion & Retail',
    rewardTitle: 'Diskon 20% Pembelian Berikutnya',
  },
  {
    name: 'Gentlemen Barber Lounge',
    icon: '💈',
    category: 'Barbershop & Grooming',
    rewardTitle: 'Gratis 1x Cuci & Hair Treatment',
  },
];

export default function SimulatorClient() {
  const [selectedPreset, setSelectedPreset] = useState<DemoStorePreset>(DEMO_STORES[0]);
  const [customStoreName, setCustomStoreName] = useState(DEMO_STORES[0].name);
  const [pointsCount, setPointsCount] = useState(1);
  const [billRef, setBillRef] = useState('INV-042');

  // Generator states
  const [generating, setGenerating] = useState(false);
  const [qrSession, setQrSession] = useState<{
    token: string;
    claimUrl: string;
    qrDataUrl: string;
    points: number;
    billReference: string;
  } | null>(null);

  // Phone Mockup Simulation States
  // 'idle' -> 'scanning' -> 'claim_form' -> 'wa_notif' -> 'wallet_view'
  const [phoneStep, setPhoneStep] = useState<
    'idle' | 'scanning' | 'claim_form' | 'wa_notif' | 'wallet_view'
  >('idle');
  const [customerPhone, setCustomerPhone] = useState('0812-3456-7890');
  const [claimedRealTime, setClaimedRealTime] = useState(false);
  const [simulatedWalletStamps, setSimulatedWalletStamps] = useState(3);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initial auto-generate on page mount so potential subscribers see a live QR immediately!
  useEffect(() => {
    generateDemoQR(selectedPreset.name, selectedPreset.icon, 1, 'INV-042');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDemoQR = async (
    storeName: string,
    storeIcon: string,
    points: number,
    reference: string
  ) => {
    setGenerating(true);
    setClaimedRealTime(false);
    setPhoneStep('idle');

    try {
      const res = await fetch('/api/simulator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: storeName,
          icon: storeIcon,
          points,
          billReference: reference,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setQrSession({
          token: data.token,
          claimUrl: data.claimUrl,
          qrDataUrl: data.qrDataUrl,
          points: data.points,
          billReference: data.billReference,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Poll in case the potential subscriber scans with their REAL smartphone camera!
  useEffect(() => {
    if (!qrSession || claimedRealTime) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/pos/token-status/${qrSession.token}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'CLAIMED') {
            setClaimedRealTime(true);
            setCustomerPhone(data.claimedByPhone || '0812-xxxx-xxxx');
            setPhoneStep('wallet_view');
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    pollingRef.current = setInterval(poll, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [qrSession, claimedRealTime]);

  const handleSelectPreset = (preset: DemoStorePreset) => {
    setSelectedPreset(preset);
    setCustomStoreName(preset.name);
    generateDemoQR(preset.name, preset.icon, pointsCount, billRef);
  };

  // On-screen Phone Simulation actions
  const handleSimulateScan = () => {
    setPhoneStep('scanning');
    setTimeout(() => {
      setPhoneStep('claim_form');
    }, 1200);
  };

  const handleSimulateClaim = () => {
    setPhoneStep('wa_notif');
    setClaimedRealTime(true);
    setSimulatedWalletStamps((prev) => prev + (qrSession?.points || 1));

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });

    // Transition to wallet pass view after seeing WhatsApp notification banner
    setTimeout(() => {
      setPhoneStep('wallet_view');
    }, 2800);
  };

  const handleResetSimulation = () => {
    setPhoneStep('idle');
    setClaimedRealTime(false);
    generateDemoQR(customStoreName, selectedPreset.icon, pointsCount, `INV-${Math.floor(100 + Math.random() * 900)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
              L
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">loyalti</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            QR Simulator & Live Demo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/merchant/register"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            Daftarkan Toko Saya
          </Link>
          <Link
            href="/merchant/pos"
            className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            Cashier Mode
          </Link>
        </div>
      </header>

      {/* Hero Explainer for Potential Subscribers */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 pt-10 pb-8 px-4 sm:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>COBA SENDIRI CARA KERJA LOYALTI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Simulator QR Stempel Digital
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Lihat bagaimana staf kasir Anda menghasilkan QR stempel dalam hitungan detik, dan rasakan
            kemudahan pelanggan saat scan dan menerima kartu stempel langsung di WhatsApp tanpa ribet
            download aplikasi.
          </p>

          {/* Quick Real Camera Scan Tip */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-2xl text-xs font-medium mt-2 shadow-sm">
            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <b>Tips Live Demo:</b> Kamu juga bisa langsung scan QR code di layar ini memakai kamera HP
              aslimu untuk menguji coba secara nyata!
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Sandbox Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
        {/* Preset Sample Businesses */}
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 text-center sm:text-left">
            Pilih Jenis Usaha untuk Simulasi:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {DEMO_STORES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                  selectedPreset.name === preset.name
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl shrink-0">{preset.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs truncate font-bold">{preset.category}</div>
                  <div
                    className={`text-[10px] truncate ${
                      selectedPreset.name === preset.name ? 'text-slate-900/80' : 'text-slate-400'
                    }`}
                  >
                    {preset.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dual Interactive Sandbox: Left = Cashier Terminal, Right = Customer Phone */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ======================================================== */}
          {/* LEFT: CASHIER MODE SIMULATOR                             */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shadow-sm">
                  {selectedPreset.icon}
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    SISI KASIR (CASHIER MODE)
                  </div>
                  <h3 className="text-base font-black text-slate-900 truncate">
                    {customStoreName}
                  </h3>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                POS Terminal
              </span>
            </div>

            {/* Input fields */}
            <div className="space-y-4">
              {/* Point Stepper */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jumlah Stempel yang Diberikan:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.max(1, pointsCount - 1);
                      setPointsCount(next);
                      generateDemoQR(customStoreName, selectedPreset.icon, next, billRef);
                    }}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 text-center">
                    <span className="text-3xl font-black text-amber-600">+{pointsCount}</span>
                    <span className="text-xs text-slate-500 font-semibold ml-1.5">Stempel</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = Math.min(20, pointsCount + 1);
                      setPointsCount(next);
                      generateDemoQR(customStoreName, selectedPreset.icon, next, billRef);
                    }}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {[1, 2, 3, 5, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPointsCount(num);
                        generateDemoQR(customStoreName, selectedPreset.icon, num, billRef);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        pointsCount === num
                          ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Offline Receipt / Ref */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>No. Struk / Nota Kasir (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Contoh nomor kasir</span>
                </label>
                <input
                  type="text"
                  value={billRef}
                  onChange={(e) => setBillRef(e.target.value)}
                  onBlur={() => generateDemoQR(customStoreName, selectedPreset.icon, pointsCount, billRef)}
                  placeholder="INV-042"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Generated QR Code Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
              {generating ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
                  <span className="text-xs font-bold text-slate-500">Menghasilkan QR Stempel...</span>
                </div>
              ) : qrSession ? (
                <>
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR Code Dinamis Siap Di-scan</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Nilai:{' '}
                      <span className="font-black text-amber-600">+{qrSession.points} Stempel</span>{' '}
                      • Ref: <span className="font-mono text-slate-800">#{qrSession.billReference}</span>
                    </div>
                  </div>

                  {/* QR Image */}
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-md border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrSession.qrDataUrl}
                      alt="Demo QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>

                  {/* Status Indicator */}
                  {claimedRealTime ? (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs flex items-center justify-center gap-2 font-bold animate-in zoom-in-95">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Stempel Berhasil Diklaim oleh {customerPhone}!</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Menunggu scan pelanggan...</span>
                    </div>
                  )}

                  {/* Simulator action shortcut for desktop viewers */}
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>Simulasikan Scan di HP Sebelah 👉</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSimulation}
                      className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Reset Transaksi Baru"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT: CUSTOMER PHONE SIMULATOR (SMARTPHONE MOCKUP)      */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full text-center sm:text-left mb-3">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>SISI PELANGGAN (CUSTOMER EXPERIENCE)</span>
              </div>
              <p className="text-xs text-slate-500">
                Alur tanpa install aplikasi: Scan → WhatsApp otomatis → Kartu stempel aktif.
              </p>
            </div>

            {/* Smartphone Mockup Frame */}
            <div className="w-full max-w-[340px] bg-slate-900 p-3 rounded-[44px] shadow-2xl border-4 border-slate-800 relative">
              {/* Dynamic Island / Speaker Notch */}
              <div className="w-28 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              </div>

              {/* Phone Screen Area */}
              <div className="bg-white rounded-[32px] overflow-hidden min-h-[560px] flex flex-col justify-between p-4 text-slate-800 relative">
                {/* 1. STATE: IDLE / WAITING SCAN */}
                {phoneStep === 'idle' && (
                  <div className="my-auto text-center space-y-4 py-8">
                    <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Scan QR Code Toko</h4>
                      <p className="text-xs text-slate-500 px-4">
                        Pelanggan membuka kamera HP (atau kamera WhatsApp) lalu mengarahkan ke QR stempel.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Simulasikan Scan Kamera</span>
                    </button>
                  </div>
                )}

                {/* 2. STATE: CAMERA SCANNING ANIMATION */}
                {phoneStep === 'scanning' && (
                  <div className="my-auto text-center space-y-4 py-12 animate-in fade-in">
                    <div className="w-44 h-44 rounded-3xl border-2 border-dashed border-amber-500 bg-slate-950 text-white flex flex-col items-center justify-center mx-auto relative overflow-hidden shadow-inner">
                      <div className="absolute inset-x-0 h-1 bg-amber-400 shadow-lg shadow-amber-400 animate-bounce" />
                      <QrCode className="w-20 h-20 text-slate-600 opacity-60" />
                      <span className="text-[10px] text-amber-400 font-mono mt-2">Membaca QR...</span>
                    </div>
                    <div className="text-xs font-bold text-slate-700 animate-pulse">
                      Membuka Halaman Klaim Stempel...
                    </div>
                  </div>
                )}

                {/* 3. STATE: CLAIM FORM (Enter WhatsApp Number) */}
                {phoneStep === 'claim_form' && (
                  <div className="space-y-4 py-2 animate-in fade-in duration-200">
                    {/* Merchant banner */}
                    <div className="text-center pt-2">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mx-auto mb-1.5 shadow-sm">
                        {selectedPreset.icon}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{customStoreName}</h4>
                    </div>

                    {/* Reward Highlights */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-2xl text-white text-center shadow-md">
                      <div className="text-3xl font-black">+{qrSession?.points || 1} Stempel</div>
                      <div className="text-xs text-amber-100 font-medium">Siap ditambahkan ke akunmu!</div>
                    </div>

                    {/* Input Form */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Nomor WhatsApp Kamu:
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Notifikasi stempel & saldo dikirim via WA.</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleSimulateClaim}
                        className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Klaim Stempel Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. STATE: WHATSAPP PUSH NOTIFICATION POPUP */}
                {phoneStep === 'wa_notif' && (
                  <div className="space-y-4 py-3 animate-in fade-in duration-300">
                    {/* Simulated iOS WhatsApp Push Notification Banner */}
                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-800 space-y-1.5 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp • Sekarang</span>
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-tight">
                        🎉 Selamat! +{qrSession?.points || 1} Stempel masuk di {customStoreName}!
                      </div>
                      <div className="text-[11px] text-slate-300 leading-snug">
                        Total stempel: {simulatedWalletStamps} stempel. Buka kartu loyalitas kamu:{' '}
                        <span className="text-emerald-400 underline">loyalti.com/pass</span>
                      </div>
                    </div>

                    <div className="text-center py-12 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-500 shadow-md">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h4 className="text-base font-black text-slate-900">
                        Notifikasi WhatsApp Terkirim!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Pelanggan tidak perlu install aplikasi apapun. Semua info saldo tersimpan aman di
                        nomor WhatsApp.
                      </p>
                    </div>
                  </div>
                )}

                {/* 5. STATE: DIGITAL LOYALTY CARD (LOYALTI PASS) */}
                {phoneStep === 'wallet_view' && (
                  <div className="space-y-3.5 py-1 animate-in zoom-in-95 duration-300">
                    {/* Card Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-lg">
                          {selectedPreset.icon}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                          {customStoreName}
                        </div>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Loyalti Pass
                      </span>
                    </div>

                    {/* Digital 10-Slot Stamp Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Kartu Stempel Digital</span>
                        <span className="font-bold text-amber-400 font-mono">
                          {simulatedWalletStamps} / 10 Stempel
                        </span>
                      </div>

                      {/* 10-stamp grid visualization */}
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }).map((_, idx) => {
                          const isFilled = idx < simulatedWalletStamps;
                          return (
                            <div
                              key={idx}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                isFilled
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md scale-105'
                                  : 'bg-slate-800/80 border border-slate-700 text-slate-500'
                              }`}
                            >
                              {isFilled ? '★' : idx + 1}
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800">
                        Kumpulkan 10 stempel untuk menukar voucher gratis!
                      </div>
                    </div>

                    {/* Reward Catalog Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hadiah yang Bisa Ditukarkan:</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{selectedPreset.rewardTitle}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Butuh 10 stempel</div>
                        </div>
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px]"
                        >
                          Tukar
                        </button>
                      </div>
                    </div>

                    {/* Reset Simulation button */}
                    <button
                      type="button"
                      onClick={handleResetSimulation}
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ulangi Simulasi dari Awal</span>
                    </button>
                  </div>
                )}

                {/* Phone Bottom Home Bar */}
                <div className="w-24 h-1 bg-slate-300 rounded-full mx-auto mt-2" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Subscription Conversion Banner */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 py-12 px-6 mt-12 shadow-inner">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1.5">
            <div className="text-xs font-black uppercase tracking-wider text-slate-900">
              Tertarik Menerapkan Sistem Ini di Toko Anda?
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
              Mulai Program Loyalitas Toko Anda Hari Ini
            </h3>
            <p className="text-xs sm:text-sm text-slate-900/80 max-w-lg">
              Tingkatkan kunjungan berulang pelanggan hingga 2.5x lipat. Tanpa biaya perangkat mahal,
              cukup gunakan smartphone yang sudah ada di kasir Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/merchant/register"
              className="py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-slate-950/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Daftarkan Toko Gratis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/merchant/pos"
              className="py-3.5 px-5 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-bold text-xs transition-all shadow-sm"
            >
              Buka Cashier Mode
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>Loyalti © 2026 • Platform Loyalty Stempel WhatsApp Modern</p>
      </footer>
    </div>
  );
}
