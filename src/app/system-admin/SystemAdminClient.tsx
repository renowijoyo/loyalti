'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Store,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import type { SystemAdminOverview } from '@/lib/system-admin-auth';

type AdminTab = 'merchants' | 'customers' | 'transactions' | 'notifications';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SystemAdminClient({
  initialOverview,
}: {
  initialOverview: SystemAdminOverview | null;
}) {
  const [overview, setOverview] = useState<SystemAdminOverview | null>(initialOverview);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('merchants');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'SENT' | 'FAILED'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [revealedApiKey, setRevealedApiKey] = useState<{
    merchantName: string;
    key: string;
  } | null>(null);
  const [editingExpiry, setEditingExpiry] = useState<Record<string, string>>({});
  const [busyMerchantId, setBusyMerchantId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/system-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Login gagal.');
      } else {
        setOverview(data.overview);
        setPassword('');
      }
    } catch {
      setAuthError('Terjadi kesalahan jaringan.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/system-admin/logout', { method: 'POST' });
    setOverview(null);
    setRevealedApiKey(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setActionError(null);
    try {
      const res = await fetch('/api/system-admin/overview');
      if (res.status === 401) {
        setOverview(null);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setOverview(data.overview);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleMerchantPatch = async (
    merchantId: string,
    merchantName: string,
    payload: { qrExpiryMinutes?: number; apiKeyAction?: 'regenerate' | 'revoke' }
  ) => {
    setActionMsg(null);
    setActionError(null);
    setBusyMerchantId(merchantId);
    try {
      const res = await fetch(`/api/system-admin/merchants/${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Gagal memperbarui merchant.');
      } else {
        setOverview(data.overview);
        if (data.generatedApiKey) {
          setRevealedApiKey({ merchantName, key: data.generatedApiKey });
          setActionMsg(`API key baru untuk ${merchantName} berhasil dibuat.`);
        } else if (payload.apiKeyAction === 'revoke') {
          setRevealedApiKey(null);
          setActionMsg(`API key untuk ${merchantName} telah dicabut.`);
        } else {
          setActionMsg(`Pengaturan ${merchantName} berhasil disimpan.`);
        }
      }
    } catch {
      setActionError('Terjadi kesalahan jaringan.');
    } finally {
      setBusyMerchantId(null);
    }
  };

  const handleDeleteMerchant = async (merchantId: string, merchantName: string) => {
    if (!window.confirm(`Hapus merchant "${merchantName}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    setActionMsg(null);
    setActionError(null);
    setBusyMerchantId(merchantId);
    try {
      const res = await fetch(`/api/system-admin/merchants/${merchantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Gagal menghapus merchant.');
      } else {
        setOverview(data.overview);
        setActionMsg(`Merchant "${merchantName}" berhasil dihapus.`);
      }
    } catch {
      setActionError('Terjadi kesalahan jaringan.');
    } finally {
      setBusyMerchantId(null);
    }
  };

  const filteredMerchants = useMemo(() => {
    if (!overview) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return overview.merchants;
    return overview.merchants.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phone && m.phone.includes(q))
    );
  }, [overview, searchQuery]);

  const filteredAccounts = useMemo(() => {
    if (!overview) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return overview.customerAccounts;
    return overview.customerAccounts.filter(
      (acc) =>
        acc.email.toLowerCase().includes(q) ||
        (acc.name && acc.name.toLowerCase().includes(q)) ||
        acc.phones.some((p) => p.phone.includes(q))
    );
  }, [overview, searchQuery]);

  const filteredNotifications = useMemo(() => {
    if (!overview) return [];
    const q = searchQuery.trim().toLowerCase();
    return overview.notificationLogs.filter((n) => {
      if (notifFilter !== 'ALL' && n.status !== notifFilter) return false;
      if (!q) return true;
      return n.phone.includes(q) || n.message.toLowerCase().includes(q);
    });
  }, [overview, notifFilter, searchQuery]);

  // Unauthenticated view
  if (!overview) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <nav className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white">Loyalti</span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                  System Admin
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </nav>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white">System Admin Console</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masuk untuk mengelola seluruh merchant, akun pelanggan, transaksi QR, dan log WhatsApp Fonnte.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  System Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:border-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm transition-all cursor-pointer"
              >
                {authLoading ? 'Memverifikasi...' : 'Masuk ke System Admin'}
              </button>
            </form>

            <p className="text-[11px] text-slate-500 text-center">
              Dikonfigurasi melalui env <code className="text-slate-300">SYSTEM_ADMIN_PASSWORD</code> (default dev: <code className="text-slate-300">admin123</code>).
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-slate-900 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight">Loyalti System Admin</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                  Platform Control
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Isolated admin module (/system-admin &amp; /api/system-admin)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Beranda
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-rose-300 hover:text-rose-200 px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-6">
        {/* System-wide KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Merchants</span>
              <Store className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.merchantsCount}
            </div>
            <div className="text-[11px] text-slate-400">Terdaftar</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>WA Customers</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.customersCount}
            </div>
            <div className="text-[11px] text-slate-400">
              {overview.stats.emailAccountsCount} akun email ({overview.stats.boundPhonesCount} WA)
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Poin Aktif</span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.totalActivePoints}
            </div>
            <div className="text-[11px] text-slate-400">
              Lifetime: {overview.stats.totalLifetimePoints}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>QR Claims</span>
              <QrCode className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.claimedTokensCount}
            </div>
            <div className="text-[11px] text-slate-400">
              {overview.stats.pendingTokensCount} pending
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Redemptions</span>
              <Ticket className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.redemptionsCount}
            </div>
            <div className="text-[11px] text-slate-400">Voucher ditukar</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Fonnte WA</span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">
              {overview.stats.notificationsSentCount}
            </div>
            <div className="text-[11px] text-slate-400">
              {overview.stats.notificationsFailedCount} gagal
            </div>
          </div>
        </div>

        {/* Alerts */}
        {actionMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMsg}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {revealedApiKey && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>POS API Key Baru untuk {revealedApiKey.merchantName} (salin sekarang):</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 font-mono text-xs flex-1 overflow-x-auto">
                {revealedApiKey.key}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(revealedApiKey.key)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            {(
              [
                { id: 'merchants', label: 'Merchants', count: overview.merchants.length },
                { id: 'customers', label: 'Akun Email & WA', count: overview.customerAccounts.length },
                { id: 'transactions', label: 'Claims & Redemptions', count: overview.recentClaims.length + overview.recentRedemptions.length },
                { id: 'notifications', label: 'Fonnte Logs', count: overview.notificationLogs.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    activeTab === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari merchant, email, nomor WA..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tab 1: Merchants */}
        {activeTab === 'merchants' && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-3.5 px-5">Merchant</th>
                    <th className="py-3.5 px-4">Statistik</th>
                    <th className="py-3.5 px-4">Integrasi</th>
                    <th className="py-3.5 px-4">QR Expiry (Menit)</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMerchants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400">
                        Tidak ada merchant ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMerchants.map((m) => {
                      const expiryVal = editingExpiry[m.id] ?? String(m.qrExpiryMinutes);
                      const isBusy = busyMerchantId === m.id;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base border border-slate-100 shrink-0"
                                style={{ backgroundColor: `${m.primaryColor}15` }}
                              >
                                {m.logoUrl || '🏪'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{m.name}</div>
                                <div className="text-[11px] text-slate-400">
                                  /{m.slug} {m.phone ? `• ${m.phone}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-[11px] text-slate-600 space-y-0.5">
                            <div>
                              <span className="font-bold text-slate-900">{m.counts.wallets}</span> pelanggan •{' '}
                              <span className="font-bold text-slate-900">{m.counts.claimTokens}</span> klaim
                            </div>
                            <div className="text-slate-400">
                              {m.counts.pointSystems} sistem poin • {m.counts.rewards} reward • {m.counts.redemptions} redeem
                            </div>
                          </td>

                          <td className="py-4 px-4 space-y-1">
                            <div className="flex flex-wrap gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.hasFonnteToken
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {m.hasFonnteToken ? 'Fonnte Custom' : 'Fonnte Default'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  m.hasApiKey
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {m.hasApiKey ? m.apiKeyPreview : 'No POS Key'}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={1440}
                                value={expiryVal}
                                onChange={(e) =>
                                  setEditingExpiry((prev) => ({
                                    ...prev,
                                    [m.id]: e.target.value,
                                  }))
                                }
                                className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                              <button
                                disabled={isBusy}
                                onClick={() =>
                                  handleMerchantPatch(m.id, m.name, {
                                    qrExpiryMinutes: Number(expiryVal),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer disabled:opacity-50"
                              >
                                Simpan
                              </button>
                            </div>
                          </td>

                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                disabled={isBusy}
                                onClick={() =>
                                  handleMerchantPatch(m.id, m.name, {
                                    apiKeyAction: 'regenerate',
                                  })
                                }
                                title="Buat / Regenerate POS API Key"
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                              >
                                {m.hasApiKey ? 'Reset Key' : 'Buat Key'}
                              </button>
                              {m.hasApiKey && (
                                <button
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleMerchantPatch(m.id, m.name, {
                                      apiKeyAction: 'revoke',
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                                >
                                  Cabut
                                </button>
                              )}
                              <Link
                                href={`/merchant/manage`}
                                title="Buka Merchant Admin"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                disabled={isBusy}
                                onClick={() => handleDeleteMerchant(m.id, m.name)}
                                title="Hapus Merchant"
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Customer Accounts */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>Akun Pelanggan (Email &amp; Nomor WhatsApp Terhubung)</span>
            </h2>

            {filteredAccounts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Belum ada akun pelanggan terdaftar.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {acc.email}{' '}
                        {acc.name && (
                          <span className="font-normal text-slate-500">({acc.name})</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Dibuat {formatDateTime(acc.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {acc.phones.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Belum ada WA terhubung
                        </span>
                      ) : (
                        acc.phones.map((p) => (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            {p.phone}
                            {p.label ? ` (${p.label})` : ''}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Claims & Redemptions */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Claim Tokens Terbaru</span>
              </h2>
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {overview.recentClaims.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada claim token.
                  </div>
                ) : (
                  overview.recentClaims.map((c) => (
                    <div key={c.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {c.merchantName} • +{c.points} poin
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.pointSystemName}
                          {c.billReference ? ` • Bill: ${c.billReference}` : ''}
                          {c.transactionAmount > 0 ? ` • ${formatRupiah(c.transactionAmount)}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.claimedByPhone ? `WA: ${c.claimedByPhone} • ` : ''}
                          {formatDateTime(c.claimedAt || c.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          c.status === 'CLAIMED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-600" />
                <span>Redemptions Terbaru</span>
              </h2>
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {overview.recentRedemptions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Belum ada penukaran hadiah.
                  </div>
                ) : (
                  overview.recentRedemptions.map((r) => (
                    <div key={r.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">
                          {r.merchantName} • {r.rewardTitle}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Voucher: <span className="font-mono font-semibold">{r.voucherCode}</span> • -{r.pointsSpent} poin
                        </div>
                        <div className="text-[11px] text-slate-400">
                          WA: {r.customerPhone} • {formatDateTime(r.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          r.status === 'ACTIVE'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : r.status === 'USED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fonnte Notification Logs */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Fonnte WhatsApp Notification Logs</span>
              </h2>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start">
                {(['ALL', 'SENT', 'FAILED'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setNotifFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      notifFilter === status
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  Tidak ada log notifikasi.
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div key={n.id} className="py-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{n.phone}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {n.provider}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            n.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {n.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
