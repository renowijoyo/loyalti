'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  ExternalLink,
  History,
  LogOut,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Ticket,
  Trash2,
  UserCheck,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import type { CustomerAccountOverview } from '@/lib/customer-auth';

function formatPhoneDisplay(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) {
    clean = '0' + clean.substring(2);
  }
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountClient({
  initialOverview,
}: {
  initialOverview: CustomerAccountOverview | null;
}) {
  const [overview, setOverview] = useState<CustomerAccountOverview | null>(initialOverview);

  // Auth form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Bind WhatsApp form state
  const [newPhone, setNewPhone] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);
  const [bindSuccess, setBindSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Filters
  const [selectedPhoneFilter, setSelectedPhoneFilter] = useState<string>('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'EARN' | 'REDEEM'>('ALL');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Gagal masuk ke akun.');
      } else {
        setOverview(data.overview);
        setEmail('');
        setName('');
      }
    } catch {
      setAuthError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/customer/logout', { method: 'POST' });
    setOverview(null);
    setSelectedPhoneFilter('ALL');
    setTxTypeFilter('ALL');
    setBindError(null);
    setBindSuccess(null);
  };

  const handleBindPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setBindError(null);
    setBindSuccess(null);
    setBindLoading(true);
    try {
      const res = await fetch('/api/customer/phones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, label: newLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBindError(data.error || 'Gagal menghubungkan nomor WhatsApp.');
      } else {
        setOverview(data.overview);
        setNewPhone('');
        setNewLabel('');
        setBindSuccess('Nomor WhatsApp berhasil dihubungkan!');
      }
    } catch {
      setBindError('Terjadi kesalahan jaringan.');
    } finally {
      setBindLoading(false);
    }
  };

  const handleUnbindPhone = async (id: string) => {
    setBindError(null);
    setBindSuccess(null);
    setRemovingId(id);
    try {
      const res = await fetch(`/api/customer/phones/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setBindError(data.error || 'Gagal melepas nomor WhatsApp.');
      } else {
        setOverview(data.overview);
        setSelectedPhoneFilter('ALL');
      }
    } catch {
      setBindError('Terjadi kesalahan jaringan.');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredWallets = useMemo(() => {
    if (!overview) return [];
    if (selectedPhoneFilter === 'ALL') return overview.wallets;
    return overview.wallets.filter((w) => w.customerPhone === selectedPhoneFilter);
  }, [overview, selectedPhoneFilter]);

  const filteredTransactions = useMemo(() => {
    if (!overview) return [];
    return overview.transactions.filter((tx) => {
      if (selectedPhoneFilter !== 'ALL' && tx.phone !== selectedPhoneFilter) return false;
      if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false;
      return true;
    });
  }, [overview, selectedPhoneFilter, txTypeFilter]);

  // Unauthenticated view: Email-only account creation / login
  if (!overview) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                L
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">loyalti</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Akun Pelanggan Loyalti</h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Buat akun atau masuk cukup dengan <span className="font-semibold text-slate-700">email saja</span>.
                  Hubungkan satu atau beberapa nomor WhatsApp untuk melihat seluruh poin &amp; transaksi Anda.
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-slate-400 font-normal">(opsional, untuk akun baru)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-sm transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{authLoading ? 'Memproses...' : 'Masuk / Buat Akun dengan Email'}</span>
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tanpa password, langsung aktif dengan email Anda.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Bisa hubungkan banyak nomor WhatsApp ke satu akun email.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                L
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">loyalti</span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold hidden sm:inline-flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              {overview.account.email}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              Beranda
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        {/* Account Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Halo{overview.account.name ? `, ${overview.account.name}` : ''}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Akun: <span className="font-semibold text-slate-700">{overview.account.email}</span> • Pantau poin loyalitas dan transaksi dari semua nomor WhatsApp terhubung.
            </p>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Poin Aktif</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {overview.summary.totalActivePoints}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Siap ditukar hadiah</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Seumur Hidup</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {overview.summary.totalLifetimePoints}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Akumulasi poin</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Toko / Merchant</span>
              <Store className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {overview.summary.merchantsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Dompet aktif</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Nomor WhatsApp</span>
              <Phone className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {overview.summary.boundNumbersCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Terhubung ke email</div>
          </div>
        </div>

        {/* Bind WhatsApp Numbers Section */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <span>Nomor WhatsApp Terhubung</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Anda dapat menghubungkan lebih dari satu nomor WhatsApp untuk menggabungkan riwayat poin &amp; transaksi.
              </p>
            </div>
          </div>

          {overview.phoneLinks.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Belum ada nomor WhatsApp yang terhubung.</p>
                <p className="mt-0.5 text-amber-800">
                  Masukkan nomor WhatsApp yang biasa Anda pakai saat klaim stempel QR untuk melihat poin dan transaksi Anda.
                </p>
              </div>
            </div>
          )}

          {bindError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bindError}</span>
            </div>
          )}

          {bindSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{bindSuccess}</span>
            </div>
          )}

          {/* List of bound numbers */}
          {overview.phoneLinks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {overview.phoneLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {formatPhoneDisplay(link.phone)}
                      </span>
                      {link.label && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          {link.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Terhubung {formatShortDate(link.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnbindPhone(link.id)}
                    disabled={removingId === link.id}
                    title="Lepaskan nomor WhatsApp"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new WhatsApp number form */}
          <form onSubmit={handleBindPhone} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Nomor WhatsApp (cth: 08123456789)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-sm"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (opsional, cth: Pribadi / Kantor)"
              className="sm:w-56 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:outline-none text-sm"
            />
            <button
              type="submit"
              disabled={bindLoading}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{bindLoading ? 'Menghubungkan...' : 'Hubungkan WA'}</span>
            </button>
          </form>
        </section>

        {/* Filter by WhatsApp Number if multiple bound */}
        {overview.phoneLinks.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter Nomor WA:</span>
            <button
              onClick={() => setSelectedPhoneFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                selectedPhoneFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({overview.phoneLinks.length})
            </button>
            {overview.phoneLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => setSelectedPhoneFilter(link.phone)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  selectedPhoneFilter === link.phone
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {formatPhoneDisplay(link.phone)}
                {link.label ? ` (${link.label})` : ''}
              </button>
            ))}
          </div>
        )}

        {/* Wallets / Points by Merchant */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              <span>Poin per Toko</span>
            </h2>
          </div>

          {filteredWallets.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500">
              {overview.phoneLinks.length === 0
                ? 'Hubungkan nomor WhatsApp terlebih dahulu untuk melihat poin toko Anda.'
                : 'Belum ada poin di toko mana pun untuk nomor WhatsApp yang dipilih.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWallets.map((w) => {
                const earliestBatch = w.activeBatches.find((b) => b.expiresAt !== null);
                return (
                  <div
                    key={w.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100"
                          style={{ backgroundColor: `${w.merchant.primaryColor}15` }}
                        >
                          {w.merchant.logoUrl || '🏪'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{w.merchant.name}</h3>
                          <p className="text-[11px] text-slate-500">
                            WA: {formatPhoneDisplay(w.customerPhone)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-black text-amber-600">{w.totalPoints}</div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">
                          Poin Aktif
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <div className="text-[11px] text-slate-500">
                        <span>Total seumur hidup: </span>
                        <span className="font-bold text-slate-700">{w.lifetimePoints}</span>
                        {earliestBatch?.expiresAt && (
                          <span className="block text-[10px] text-amber-700 mt-0.5">
                            {earliestBatch.pointsRemaining} poin kedaluwarsa{' '}
                            {formatShortDate(earliestBatch.expiresAt)}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/wallet/${w.merchant.slug}?phone=${encodeURIComponent(w.customerPhone)}`}
                        className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <span>Buka Kartu</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Transactions History */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              <span>Riwayat Transaksi</span>
            </h2>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start">
              {(['ALL', 'EARN', 'REDEEM'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTxTypeFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    txTypeFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'Semua' : tab === 'EARN' ? 'Poin Masuk' : 'Tukar Hadiah'}
                </button>
              ))}
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              {overview.phoneLinks.length === 0
                ? 'Hubungkan nomor WhatsApp untuk melihat riwayat transaksi.'
                : 'Belum ada transaksi tercatat.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'EARN'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-purple-50 text-purple-600 border border-purple-200'
                      }`}
                    >
                      {tx.type === 'EARN' ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <Ticket className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {tx.merchant.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                          WA: {formatPhoneDisplay(tx.phone)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{tx.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatDateTime(tx.createdAt)}</span>
                        {tx.billReference && <span>• Bill: {tx.billReference}</span>}
                        {tx.transactionAmount && (
                          <span>• Belanja: {formatRupiah(tx.transactionAmount)}</span>
                        )}
                        {tx.voucherCode && (
                          <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {tx.voucherCode} ({tx.status})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 pl-13 sm:pl-0">
                    <span
                      className={`text-sm font-black inline-flex items-center gap-1 ${
                        tx.type === 'EARN' ? 'text-emerald-600' : 'text-purple-600'
                      }`}
                    >
                      {tx.type === 'EARN' ? (
                        <>+{tx.points} Poin</>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />-{tx.points} Poin
                        </>
                      )}
                    </span>
                    <Link
                      href={`/wallet/${tx.merchant.slug}?phone=${encodeURIComponent(tx.phone)}`}
                      className="text-[11px] font-semibold text-slate-500 hover:text-amber-700"
                    >
                      Lihat Kartu →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
