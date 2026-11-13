import Link from 'next/link';
import {
  QrCode,
  Smartphone,
  MessageSquare,
  Gift,
  ArrowRight,
  Store,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Coffee,
  Code2,
  User,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-md shadow-amber-500/20">
              L
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">loyalti</span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                WhatsApp + Fonnte
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/simulator"
              className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulator QR</span>
            </Link>
            <Link
              href="/merchant/register"
              className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              + Daftar Toko
            </Link>
            <Link
              href="/docs/pos-api"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm bg-white hidden md:inline-flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>POS API</span>
            </Link>
            <Link
              href="/account"
              className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akun Pelanggan</span>
            </Link>
            <Link
              href="/merchant/manage"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm bg-white hidden sm:inline-flex"
            >
              Admin Mode
            </Link>
            <Link
              href="/merchant/pos"
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-[0.98]"
            >
              Cashier Mode
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Loyalty & Stamp Card Tanpa Ribet Download App & Akun</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
          Stempel Loyalitas Digital{' '}
          <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent">
            Cukup Pakai Nomor WhatsApp
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Merchant membuat promosi stempel dan katalog hadiah. Pelanggan scan QR code saat transaksi,
          masukkan nomor WhatsApp, dan otomatis menerima stempel serta tautan kartu loyalitas.
        </p>

        {/* Quick Demo CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/simulator"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Coba Simulator QR Interaktif</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/merchant/register"
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all"
          >
            <Store className="w-5 h-5 text-amber-400" />
            <span>Daftar Toko Gratis</span>
          </Link>

          <Link
            href="/merchant/pos"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
          >
            <QrCode className="w-5 h-5 text-amber-600" />
            <span>Cashier Mode (POS QR)</span>
          </Link>

          <Link
            href="/merchant/manage"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
          >
            <Store className="w-5 h-5 text-indigo-600" />
            <span>Admin Mode (Kelola Toko)</span>
          </Link>

          <Link
            href="/account"
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all"
          >
            <User className="w-5 h-5" />
            <span>Akun Pelanggan (Email &amp; WA)</span>
          </Link>

          <Link
            href="/wallet/kopi-kenangan?phone=08123456789"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm flex items-center gap-2 transition-all"
          >
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <span>Kartu Loyalitas Pelanggan</span>
          </Link>
        </div>
      </section>

      {/* 4-Step Interactive Flow Breakdown */}
      <section className="border-t border-b border-slate-200/80 bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Alur Transaksi & Klaim Stempel</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Bagaimana Loyalti menghubungkan kasir, scan QR, WhatsApp, dan reward:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-black text-base flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">Kasir Bikin QR</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah transaksi, kasir memilih sistem poin (misal 1 stempel/kopi) dan menekan{' '}
                  <span className="text-slate-900 font-semibold">&quot;Tampilkan QR&quot;</span> pada layar kasir.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Single-use dynamic QR</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">Pelanggan Scan & Input No. WA</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kamera HP langsung membuka web klaim stempel. Tanpa unduh aplikasi, pelanggan cukup
                  mengetikkan nomor WhatsApp miliknya.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Zero login friction</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black text-base flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">Notifikasi Fonnte WhatsApp</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem langsung mengirimkan pesan WhatsApp berisi total stempel, rincian hadiah yang
                  bisa ditukar, dan tautan kartu stempel.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Otomatis via Fonnte API</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 relative flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black text-base flex items-center justify-center mb-4">
                  04
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">Tukar Hadiah & Voucher</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pelanggan menukarkan stempel dengan voucher kopi/makanan. Voucher memiliki kode dan
                  masa kedaluwarsa tersendiri.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-purple-700 font-semibold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>FIFO Point Expiration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Multi Point Systems</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap merchant dapat memiliki lebih dari satu sistem poin (misal: kartu stempel kopi
              harian vs sistem poin belanja VIP).
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Masa Kedaluwarsa Terpisah</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Poin dan voucher memiliki masa berlaku tersendiri (misal 90 hari atau 30 hari) yang dapat
              melampaui periode promosi merchant.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Aman & Anti-Double Claim</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap QR code memiliki token acak berdurasi terbatas dan hanya dapat diklaim satu kali
              oleh satu nomor telepon.
            </p>
          </div>
        </div>

        {/* External POS API Integration Highlight */}
        <div className="mt-12 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Open REST API v1 • Integrasi Kasir Eksternal</span>
            </div>
            <h4 className="text-xl font-bold text-white">
              Sudah Pakai Sistem POS Sendiri? Hubungkan via API!
            </h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Integrasikan Moka, Pawoon, Majoo, atau POS kustom Anda ke Loyalti dengan API Key per merchant.
              Terbitkan QR klaim atau poin langsung, cek saldo pelanggan, dan validasi voucher hadiah langsung dari mesin kasir Anda.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/docs/pos-api"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Code2 className="w-4 h-4" />
              <span>Lihat Dokumentasi POS API</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Demo Merchant Showcase */}
        <div className="mt-12 bg-amber-50/50 border border-amber-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Contoh Merchant Terdaftar di Database Loyalti
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              Coba Buka Kartu Loyalitas Langsung:
            </h4>
            <p className="text-xs text-slate-600">
              Lihat visualisasi kartu stempel 10 slot dan katalog reward yang bisa langsung ditukar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet/kopi-kenangan?phone=08123456789"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Coffee className="w-4 h-4" />
              <span>Kopi Kenangan Senopati</span>
            </Link>
            <Link
              href="/wallet/haohao-dimsum?phone=08123456789"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <span>🥟 Dimsum Hao Hao Bar</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-8 text-center text-xs text-slate-500 bg-white">
        <p>Loyalti © 2026 • Platform Loyalty Stempel WhatsApp Modern</p>
      </footer>
    </div>
  );
}
