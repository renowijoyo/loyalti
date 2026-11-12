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
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/70 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              L
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">lokaloyal</span>
              <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                WhatsApp + Fonnte
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/merchant/manage"
              className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-all"
            >
              Pengaturan Program
            </Link>
            <Link
              href="/merchant/pos"
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              Terminal Kasir POS
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6 max-w-6xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Loyalty & Stamp Card Tanpa Ribet Download App & Akun</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          Stempel Loyalitas Digital{' '}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
            Cukup Pakai Nomor WhatsApp
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Merchant membuat promosi stempel dan katalog hadiah. Pelanggan scan QR code saat transaksi,
          masukkan nomor WhatsApp, dan otomatis menerima stempel serta tautan kartu loyalitas.
        </p>

        {/* Quick Demo CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/merchant/pos"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all"
          >
            <QrCode className="w-5 h-5" />
            <span>Mulai dari Kasir POS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/wallet/kopi-kenangan?phone=08123456789"
            className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <span>Tampilan Kartu Pelanggan</span>
          </Link>

          <Link
            href="/merchant/manage"
            className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
          >
            <Store className="w-5 h-5 text-emerald-400" />
            <span>Dashboard Merchant</span>
          </Link>
        </div>
      </section>

      {/* 4-Step Interactive Flow Breakdown */}
      <section className="border-t border-slate-800/80 bg-slate-950/50 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Alur Transaksi & Klaim Stempel</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Bagaimana Lokaloyal menghubungkan kasir, scan QR, WhatsApp, dan reward:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 font-black text-base flex items-center justify-center mb-4">
                  01
                </div>
                <h3 className="font-bold text-white text-base mb-2">Kasir Bikin QR</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Setelah transaksi, kasir memilih sistem poin (misal 1 stempel/kopi) dan menekan{' '}
                  <span className="text-slate-200 font-semibold">&quot;Tampilkan QR&quot;</span> pada layar kasir.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Single-use dynamic QR</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 font-black text-base flex items-center justify-center mb-4">
                  02
                </div>
                <h3 className="font-bold text-white text-base mb-2">Pelanggan Scan & Input No. WA</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kamera HP langsung membuka web klaim stempel. Tanpa unduh aplikasi, pelanggan cukup
                  mengetikkan nomor WhatsApp miliknya.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Zero login friction</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 font-black text-base flex items-center justify-center mb-4">
                  03
                </div>
                <h3 className="font-bold text-white text-base mb-2">Notifikasi Fonnte WhatsApp</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sistem langsung mengirimkan pesan WhatsApp berisi total stempel, rincian hadiah yang
                  bisa ditukar, dan tautan kartu stempel.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Otomatis via Fonnte API</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 font-black text-base flex items-center justify-center mb-4">
                  04
                </div>
                <h3 className="font-bold text-white text-base mb-2">Tukar Hadiah & Voucher</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pelanggan menukarkan stempel dengan voucher kopi/makanan. Voucher memiliki kode dan
                  masa kedaluwarsa tersendiri.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-purple-400 font-semibold flex items-center gap-1">
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
          <div className="p-6 bg-slate-800/50 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Multi Point Systems</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap merchant dapat memiliki lebih dari satu sistem poin (misal: kartu stempel kopi
              harian vs sistem poin belanja VIP).
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Masa Kedaluwarsa Terpisah</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Poin dan voucher memiliki masa berlaku tersendiri (misal 90 hari atau 30 hari) yang dapat
              melampaui periode promosi merchant.
            </p>
          </div>

          <div className="p-6 bg-slate-800/50 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white">Aman & Anti-Double Claim</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Setiap QR code memiliki token acak berdurasi terbatas dan hanya dapat diklaim satu kali
              oleh satu nomor telepon.
            </p>
          </div>
        </div>

        {/* Demo Merchant Showcase */}
        <div className="mt-12 bg-slate-800/30 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Contoh Merchant Terdaftar di Database Lokaloyal
            </div>
            <h4 className="text-xl font-bold text-white">
              Coba Buka Kartu Loyalitas Langsung:
            </h4>
            <p className="text-xs text-slate-400">
              Lihat visualisasi kartu stempel 10 slot dan katalog reward yang bisa langsung ditukar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/wallet/kopi-kenangan?phone=08123456789"
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Coffee className="w-4 h-4" />
              <span>Kopi Kenangan Senopati</span>
            </Link>
            <Link
              href="/wallet/haohao-dimsum?phone=08123456789"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <span>🥟 Dimsum Hao Hao Bar</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto py-8 text-center text-xs text-slate-500">
        <p>Lokaloyal © 2026 • Platform Loyalty Stempel WhatsApp Modern</p>
      </footer>
    </div>
  );
}
