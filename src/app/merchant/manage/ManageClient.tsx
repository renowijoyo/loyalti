'use client';

import React, { useState } from 'react';
import {
  Store,
  Layers,
  Gift,
  Calendar,
  MessageSquare,
  Plus,
  Clock,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
  QrCode,
  SlidersHorizontal,
  KeyRound,
  Copy,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface PromotionData {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

interface PointSystemData {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  ruleType: string;
  pointsPerUnit: number;
  amountPerPoint: number;
  pointValidityDays: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
}

interface RewardData {
  id: string;
  title: string;
  description?: string | null;
  pointsCost: number;
  quota?: number | null;
  redeemedCount: number;
  voucherValidityDays: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  pointSystemId?: string | null;
}

interface MerchantManageData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string;
  fonnteToken?: string | null;
  qrExpiryMinutes?: number;
  apiKey?: string | null;
  description?: string | null;
  promotions: PromotionData[];
  pointSystems: PointSystemData[];
  rewards: RewardData[];
  stats: {
    customersCount: number;
    claimsCount: number;
    redemptionsCount: number;
  };
}

export default function ManageClient({
  initialMerchants,
}: {
  initialMerchants: MerchantManageData[];
}) {
  const [merchants, setMerchants] = useState<MerchantManageData[]>(initialMerchants);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>(
    initialMerchants[0]?.id || ''
  );

  const currentMerchant = merchants.find((m) => m.id === selectedMerchantId);

  const [activeTab, setActiveTab] = useState<'point-systems' | 'rewards' | 'promotions' | 'whatsapp'>('point-systems');

  // WhatsApp Fonnte & QR Settings State
  const [fonnteToken, setFonnteToken] = useState(currentMerchant?.fonnteToken || '');
  const [qrExpiryMinutes, setQrExpiryMinutes] = useState(currentMerchant?.qrExpiryMinutes || 15);
  const [testPhone, setTestPhone] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal State for New Point System
  const [showAddPs, setShowAddPs] = useState(false);
  const [newPsName, setNewPsName] = useState('');
  const [newPsRuleType, setNewPsRuleType] = useState('FIXED');
  const [newPsPointsPerUnit, setNewPsPointsPerUnit] = useState(1);
  const [newPsAmountPerPoint, setNewPsAmountPerPoint] = useState(20000);
  const [newPsValidityDays, setNewPsValidityDays] = useState(90);
  const [newPsStartAt, setNewPsStartAt] = useState(new Date().toISOString().slice(0, 10));
  const [newPsEndAt, setNewPsEndAt] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Modal State for New Reward
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardCost, setNewRewardCost] = useState(5);
  const [newRewardVoucherDays, setNewRewardVoucherDays] = useState(30);
  const [newRewardStartAt, setNewRewardStartAt] = useState(new Date().toISOString().slice(0, 10));
  const [newRewardEndAt, setNewRewardEndAt] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const handleSaveFonnteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant) return;
    setSavingSettings(true);
    setSettingsNotice(null);

    try {
      const res = await fetch('/api/merchants/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          fonnteToken,
          qrExpiryMinutes: Number(qrExpiryMinutes) || 15,
          testPhone: testPhone || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsNotice({
          type: 'success',
          msg: testPhone
            ? 'Pengaturan tersimpan & pesan WhatsApp uji coba berhasil dikirim!'
            : 'Pengaturan toko & masa berlaku QR berhasil disimpan!',
        });
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === currentMerchant.id
              ? {
                  ...m,
                  fonnteToken: data.merchant?.fonnteToken,
                  qrExpiryMinutes: data.merchant?.qrExpiryMinutes,
                }
              : m
          )
        );
      } else {
        setSettingsNotice({ type: 'error', msg: data.error || 'Gagal menyimpan pengaturan' });
      }
    } catch (err) {
      console.error(err);
      setSettingsNotice({ type: 'error', msg: 'Terjadi kesalahan sistem' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!currentMerchant) return;
    setRegeneratingKey(true);
    setSettingsNotice(null);
    try {
      const res = await fetch('/api/merchants/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          regenerateApiKey: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === currentMerchant.id ? { ...m, apiKey: data.merchant?.apiKey } : m
          )
        );
        setSettingsNotice({
          type: 'success',
          msg: 'POS API Key baru berhasil dibuat! Gunakan header X-API-Key pada sistem POS Anda.',
        });
      } else {
        setSettingsNotice({ type: 'error', msg: data.error || 'Gagal membuat API Key' });
      }
    } catch (err) {
      console.error(err);
      setSettingsNotice({ type: 'error', msg: 'Terjadi kesalahan sistem' });
    } finally {
      setRegeneratingKey(false);
    }
  };

  const handleCopyApiKey = () => {
    if (!currentMerchant?.apiKey) return;
    navigator.clipboard.writeText(currentMerchant.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCreatePointSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant) return;

    try {
      const res = await fetch('/api/merchants/point-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          name: newPsName,
          ruleType: newPsRuleType,
          pointsPerUnit: newPsPointsPerUnit,
          amountPerPoint: newPsAmountPerPoint,
          pointValidityDays: newPsValidityDays,
          startAt: new Date(newPsStartAt).toISOString(),
          endAt: new Date(newPsEndAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddPs(false);
        setNewPsName('');
        // Update local state
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === currentMerchant.id
              ? { ...m, pointSystems: [data.pointSystem, ...m.pointSystems] }
              : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMerchant) return;

    try {
      const res = await fetch('/api/merchants/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: currentMerchant.id,
          title: newRewardTitle,
          description: newRewardDesc,
          pointsCost: newRewardCost,
          voucherValidityDays: newRewardVoucherDays,
          startAt: new Date(newRewardStartAt).toISOString(),
          endAt: new Date(newRewardEndAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddReward(false);
        setNewRewardTitle('');
        setNewRewardDesc('');
        setMerchants((prev) =>
          prev.map((m) =>
            m.id === currentMerchant.id
              ? { ...m, rewards: [...m.rewards, data.reward] }
              : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentMerchant) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Admin Mode</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
              MANAGEMENT
            </span>
          </h1>
        </div>

        {/* Central Mode Switcher (Cashier vs Admin) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
          <Link
            href="/merchant/pos"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            title="Pindah ke Cashier Mode"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-600" />
            <span>Cashier</span>
          </Link>
          <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 cursor-default">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Admin</span>
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/merchant/register"
            className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors shadow-sm"
          >
            + Toko Baru
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        {/* Merchant Selector & Overview Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl">
              {currentMerchant.logoUrl || '🏪'}
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                Merchant Aktif
              </div>
              <h2 className="text-2xl font-black text-slate-900">{currentMerchant.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Slug: <span className="font-mono text-slate-700">{currentMerchant.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-500">Ganti Merchant:</label>
            <select
              value={selectedMerchantId}
              onChange={(e) => {
                setSelectedMerchantId(e.target.value);
                const next = merchants.find((m) => m.id === e.target.value);
                setFonnteToken(next?.fonnteToken || '');
                setQrExpiryMinutes(next?.qrExpiryMinutes || 15);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Pelanggan Terdaftar</div>
              <div className="text-2xl font-black text-slate-900">
                {currentMerchant.stats.customersCount}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total QR Stempel Dibuat</div>
              <div className="text-2xl font-black text-slate-900">
                {currentMerchant.stats.claimsCount}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Voucher Telah Ditukarkan</div>
              <div className="text-2xl font-black text-slate-900">
                {currentMerchant.stats.redemptionsCount}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab('point-systems')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'point-systems'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Sistem Poin & Stempel ({currentMerchant.pointSystems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'rewards'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Katalog Hadiah & Voucher ({currentMerchant.rewards.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'promotions'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Periode Promosi ({currentMerchant.promotions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-3 flex items-center gap-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Pengaturan Toko & Validitas QR</span>
          </button>
        </div>

        {/* TAB 1: POINT SYSTEMS */}
        {activeTab === 'point-systems' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sistem Poin & Stempel</h3>
                <p className="text-xs text-slate-500">
                  Konfigurasikan aturan perolehan poin dan masa kedaluwarsa stempel pelanggan.
                </p>
              </div>
              <button
                onClick={() => setShowAddPs(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Sistem Poin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentMerchant.pointSystems.map((ps) => (
                <div
                  key={ps.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {ps.ruleType === 'FIXED' ? 'Stempel Tetap' : 'Kelipatan Belanja'}
                      </span>
                      <h4 className="font-bold text-base text-slate-900 mt-1">{ps.name}</h4>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>

                  {ps.description && (
                    <p className="text-xs text-slate-500">{ps.description}</p>
                  )}

                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Aturan Perolehan:</span>
                      <span className="font-semibold text-slate-800">
                        {ps.ruleType === 'FIXED'
                          ? `+${ps.pointsPerUnit} stempel / transaksi`
                          : `Rp${ps.amountPerPoint.toLocaleString()} = 1 poin`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Masa Kedaluwarsa Poin:</span>
                      </span>
                      <span className="font-semibold text-amber-700">
                        {ps.pointValidityDays} hari (sejak didapat)
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Periode Program: {new Date(ps.startAt).toLocaleDateString('id-ID')} s/d{' '}
                      {new Date(ps.endAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Add Point System */}
            {showAddPs && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Buat Sistem Poin Baru</h3>
                  <form onSubmit={handleCreatePointSystem} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Nama Sistem Poin</label>
                      <input
                        type="text"
                        value={newPsName}
                        onChange={(e) => setNewPsName(e.target.value)}
                        placeholder="Contoh: Stempel Kopi Harian"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Jenis Perhitungan</label>
                        <select
                          value={newPsRuleType}
                          onChange={(e) => setNewPsRuleType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="FIXED">Stempel Tetap (Per Kunjungan)</option>
                          <option value="AMOUNT_RATIO">Kelipatan Nominal Belanja</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          Masa Berlaku Poin (Hari)
                        </label>
                        <input
                          type="number"
                          value={newPsValidityDays}
                          onChange={(e) => setNewPsValidityDays(Number(e.target.value))}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {newPsRuleType === 'AMOUNT_RATIO' && (
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          Nominal Belanja per 1 Poin (IDR)
                        </label>
                        <input
                          type="number"
                          value={newPsAmountPerPoint}
                          onChange={(e) => setNewPsAmountPerPoint(Number(e.target.value))}
                          step="1000"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Mulai Berlaku</label>
                        <input
                          type="date"
                          value={newPsStartAt}
                          onChange={(e) => setNewPsStartAt(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Selesai</label>
                        <input
                          type="date"
                          value={newPsEndAt}
                          onChange={(e) => setNewPsEndAt(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddPs(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                      >
                        Simpan Sistem Poin
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REWARDS CATALOG */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Katalog Hadiah & Voucher</h3>
                <p className="text-xs text-slate-500">
                  Tentukan reward yang dapat ditukarkan pelanggan dan masa aktif masing-masing voucher.
                </p>
              </div>
              <button
                onClick={() => setShowAddReward(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hadiah Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentMerchant.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-xl font-black text-xs">
                        {reward.pointsCost} Stempel
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Ditukar: {reward.redeemedCount}x
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{reward.title}</h4>
                    {reward.description && (
                      <p className="text-xs text-slate-500 mt-1">{reward.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Masa Aktif Voucher:</span>
                      <span className="font-bold text-indigo-600">
                        {reward.voucherValidityDays} Hari
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tersedia s/d {new Date(reward.endAt).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Add Reward */}
            {showAddReward && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">Tambah Hadiah Baru</h3>
                  <form onSubmit={handleCreateReward} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Nama Hadiah</label>
                      <input
                        type="text"
                        value={newRewardTitle}
                        onChange={(e) => setNewRewardTitle(e.target.value)}
                        placeholder="Contoh: Gratis 1 Botol Kopi 1 Liter"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">Deskripsi Singkat</label>
                      <textarea
                        value={newRewardDesc}
                        onChange={(e) => setNewRewardDesc(e.target.value)}
                        rows={2}
                        placeholder="Ketentuan penukaran..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          Biaya Stempel / Poin
                        </label>
                        <input
                          type="number"
                          value={newRewardCost}
                          onChange={(e) => setNewRewardCost(Number(e.target.value))}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          Masa Berlaku Voucher (Hari)
                        </label>
                        <input
                          type="number"
                          value={newRewardVoucherDays}
                          onChange={(e) => setNewRewardVoucherDays(Number(e.target.value))}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Mulai Tersedia</label>
                        <input
                          type="date"
                          value={newRewardStartAt}
                          onChange={(e) => setNewRewardStartAt(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">Selesai</label>
                        <input
                          type="date"
                          value={newRewardEndAt}
                          onChange={(e) => setNewRewardEndAt(e.target.value)}
                          required
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowAddReward(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                      >
                        Simpan Hadiah
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROMOTIONS */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Periode Promosi Merchant</h3>
            <div className="space-y-3">
              {currentMerchant.promotions.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{promo.title}</h4>
                    {promo.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{promo.description}</p>
                    )}
                    <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Periode: {new Date(promo.startAt).toLocaleDateString('id-ID')} s/d{' '}
                        {new Date(promo.endAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-xs">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STORE SETTINGS, QR VALIDITY & WHATSAPP FONNTE */}
        {activeTab === 'whatsapp' && (
          <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full text-xs font-bold mb-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                <span>Pengaturan Mode Kasir & Notifikasi</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Pengaturan Toko & Masa Berlaku QR
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Kelola masa berlaku QR code yang dihasilkan di Cashier Mode serta integrasi notifikasi WhatsApp Fonnte.
              </p>
            </div>

            <form onSubmit={handleSaveFonnteSettings} className="space-y-6">
              {/* QR Validity Duration Setting */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      Masa Berlaku QR Code di Mode Kasir
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Durasi waktu sebelum QR stempel otomatis kedaluwarsa jika belum di-scan oleh pelanggan.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                    {qrExpiryMinutes} Menit
                  </span>
                </div>

                {/* Preset minute buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[5, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setQrExpiryMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        Number(qrExpiryMinutes) === mins
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {mins} Menit {mins === 15 && '(Default)'}
                    </button>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Atau tentukan menit kustom:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={qrExpiryMinutes}
                    onChange={(e) => setQrExpiryMinutes(Math.max(1, Number(e.target.value)))}
                    className="w-24 bg-white border border-slate-200 text-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500">menit</span>
                </div>
              </div>

              {/* Fonnte WhatsApp API Gateway */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Fonnte WhatsApp API Token</span>
                  </div>
                  <input
                    type="text"
                    value={fonnteToken}
                    onChange={(e) => setFonnteToken(e.target.value)}
                    placeholder="Masukkan token dari dashboard.fonnte.com"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digunakan untuk mengirim notifikasi saldo & kartu stempel otomatis ke WhatsApp pelanggan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Kirim Pesan Uji Coba (Nomor WhatsApp Penerima)
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {settingsNotice && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                    settingsNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {settingsNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{settingsNotice.msg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-all disabled:opacity-50"
              >
                {savingSettings ? (
                  'Menyimpan...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Toko & QR</span>
                  </>
                )}
              </button>
            </form>

            {/* External POS Integration API Key */}
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Integrasi API POS Eksternal
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Hubungkan Moka, Pawoon, Majoo, atau sistem kasir kustom Anda ke Loyalti.
                    </p>
                  </div>
                </div>
                <Link
                  href="/docs/pos-api"
                  className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <span>Baca Dokumentasi API</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentMerchant?.apiKey || 'Belum ada API Key — klik Generate di samping'}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  {currentMerchant?.apiKey && (
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRegenerateApiKey}
                    disabled={regeneratingKey}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regeneratingKey ? 'animate-spin' : ''}`} />
                    <span>{currentMerchant?.apiKey ? 'Rotate Key' : 'Generate API Key'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Kirim header <code className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800 font-mono">x-api-key</code> atau{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800 font-mono">Authorization: Bearer &lt;key&gt;</code> ke endpoint{' '}
                  <code className="px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-800 font-mono">/api/v1/pos/*</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
