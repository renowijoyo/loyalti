'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Store,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Gift,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

const EMOJI_OPTIONS = ['☕', '🥐', '🍔', '🍕', '🥟', '🍣', '👗', '💈', '🛍️', '💆', '🧁', '🏪'];

interface CreatedMerchant {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
  phone?: string | null;
  description?: string | null;
  logoUrl?: string | null;
}

export default function RegisterClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('☕');
  const [rewardTitle, setRewardTitle] = useState('Gratis 1 Minuman / Menu Pilihan');
  const [rewardCost, setRewardCost] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdData, setCreatedData] = useState<CreatedMerchant | null>(null);

  // Computed slug preview
  const previewSlug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'nama-toko-kamu';

  // Contact validation check: only email or phone necessary, can be both or just either
  const hasEmail = email.trim().length > 0;
  const hasPhone = phone.trim().length > 0;
  const hasAtLeastOneContact = hasEmail || hasPhone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || name.trim().length < 2) {
      setError('Masukkan nama usaha/merchant (minimal 2 karakter).');
      return;
    }

    if (!hasAtLeastOneContact) {
      setError('Harap masukkan salah satu kontak: Email atau Nomor WhatsApp/Telepon.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: hasEmail ? email.trim() : undefined,
          phone: hasPhone ? phone.trim() : undefined,
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          logoUrl,
          rewardTitle: rewardTitle.trim() || undefined,
          rewardCost: Number(rewardCost) || 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mendaftarkan merchant.');
        setLoading(false);
        return;
      }

      setCreatedData(data.merchant);

      // Celebrate with confetti
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.error(err);
      setError('Terjadi kendala jaringan, silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
              L
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">loyalti</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-500">Pendaftaran Merchant</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
          <Link
            href="/merchant/manage"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
          >
            Masuk Admin Mode
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        {!createdData ? (
          /* Registration Form */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8 animate-in fade-in duration-300">
            {/* Title & Introduction */}
            <div className="space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>DAFTARKAN USAHA KAMU</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Mulai Program Loyalitas Toko Kamu
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Buat program stempel digital instan untuk pelanggan tanpa ribet unduh aplikasi. Cukup
                isi nama toko dan salah satu kontak.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama Usaha */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nama Toko / Usaha <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Kopi Senja Nusantara"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                  Tautan kartu digital kamu: <span className="text-slate-700 font-semibold">loyalti/wallet/{previewSlug}</span>
                </p>
              </div>

              {/* Logo / Emoji Icon Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Ikon / Logo Toko
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setLogoUrl(emoji)}
                      className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        logoUrl === emoji
                          ? 'bg-amber-100 border-2 border-amber-500 shadow-sm scale-105'
                          : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Information (Email OR Phone required, both allowed) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Informasi Kontak
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    Cukup salah satu atau keduanya
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Email</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {hasPhone ? '(Opsional)' : '(Diperlukan jika tanpa WA)'}
                      </span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@toko.com"
                      className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Phone / WhatsApp Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp / Telepon</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {hasEmail ? '(Opsional)' : '(Diperlukan jika tanpa Email)'}
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-1 text-xs">
                  {hasEmail && hasPhone ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Email & WhatsApp terisi lengkap!</span>
                    </div>
                  ) : hasEmail ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Email terisi (WhatsApp dapat ditambahkan nanti)</span>
                    </div>
                  ) : hasPhone ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Nomor WhatsApp terisi (Email dapat ditambahkan nanti)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Isi minimal salah satu: Email atau WhatsApp.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Store Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Deskripsi Singkat <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Kedai kopi santai dengan aneka seduhan biji lokal"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Alamat / Lokasi <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Senopati No. 45, Jakarta Selatan"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Initial Loyalty Reward Preview */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <Gift className="w-4 h-4 text-amber-600" />
                  <span>Hadiah Reward Pertama untuk Pelanggan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Nama Hadiah
                    </label>
                    <input
                      type="text"
                      value={rewardTitle}
                      onChange={(e) => setRewardTitle(e.target.value)}
                      placeholder="Gratis 1 Kopi Pilihan"
                      className="w-full bg-white border border-amber-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Jumlah Stempel
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={rewardCost}
                      onChange={(e) => setRewardCost(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-amber-200 text-slate-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-amber-700/90 leading-relaxed">
                  Program stempel langsung siap dipakai dan dapat kamu ubah atau tambahkan kapan saja
                  lewat dashboard merchant.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !hasAtLeastOneContact}
                className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Daftarkan Usaha Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Pendaftaran Berhasil!
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Selamat Datang di Loyalti, {createdData.name}! 🎉
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Toko kamu kini sudah memiliki kartu stempel digital dan siap memberikan reward kepada
                pelanggan.
              </p>
            </div>

            {/* Merchant Info Summary */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shadow-sm">
                  {createdData.logoUrl || '☕'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{createdData.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">
                    ID: {createdData.slug}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {createdData.email && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{createdData.email}</span>
                  </div>
                )}
                {createdData.phone && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{createdData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/merchant/pos"
                className="py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all"
              >
                <span>Buka Cashier Mode</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/merchant/manage"
                className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Buka Admin Mode</span>
              </Link>
            </div>

            <div className="pt-1">
              <Link
                href={`/wallet/${createdData.slug}?phone=08123456789`}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                <span>Pratinjau Kartu Stempel Pelanggan ({createdData.slug})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
