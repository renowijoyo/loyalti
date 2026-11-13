import Link from 'next/link';
import {
  ArrowLeft,
  Code2,
  KeyRound,
  Terminal,
  QrCode,
  UserCheck,
  TicketCheck,
  Store,
  CheckCircle2,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'POS Integration API Docs | Loyalti',
  description:
    'REST API documentation for integrating external POS systems (Moka, Pawoon, Majoo, custom POS) with Loyalti.',
};

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/pos/info',
    title: 'Get Merchant & Active Point Rules',
    desc: 'Fetch merchant profile, active point systems (FIXED / AMOUNT_RATIO), and active reward catalog.',
    curl: `curl -X GET https://your-domain.com/api/v1/pos/info \\
  -H "x-api-key: loy_live_your_api_key"`,
    response: `{
  "success": true,
  "merchant": {
    "id": "clx...",
    "name": "Kopi Kenangan Senopati",
    "slug": "kopi-kenangan",
    "qrExpiryMinutes": 15
  },
  "pointSystems": [
    {
      "id": "ps_123",
      "name": "Stempel Kopi Harian",
      "ruleType": "FIXED",
      "pointsPerUnit": 1,
      "amountPerPoint": 10000,
      "minSpendAmount": 0,
      "maxPointsPerTx": 10,
      "pointValidityDays": 90
    }
  ],
  "rewards": [
    {
      "id": "rew_123",
      "title": "Gratis 1 Americano",
      "pointsCost": 10,
      "voucherValidityDays": 30
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/pos/transactions',
    title: 'Issue Points or QR Claim Token',
    desc: 'Record a POS transaction. Omit customerPhone to generate a dynamic QR claim token, or include customerPhone to award points directly and trigger a WhatsApp notification.',
    curl: `curl -X POST https://your-domain.com/api/v1/pos/transactions \\
  -H "x-api-key: loy_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transactionAmount": 55000,
    "billReference": "INV-2026-0042",
    "customerPhone": "08123456789"
  }'`,
    response: `{
  "success": true,
  "mode": "DIRECT_AWARD",
  "status": "CLAIMED",
  "token": "9a8b7c6d5e4f3a2b",
  "billReference": "INV-2026-0042",
  "pointsEarned": 1,
  "customerPhone": "628123456789",
  "newTotalBalance": 7,
  "walletUrl": "https://your-domain.com/wallet/kopi-kenangan?phone=628123456789"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/pos/transactions/{token}',
    title: 'Check QR Claim Status',
    desc: 'Poll whether a generated QR claim token is PENDING, CLAIMED, or EXPIRED.',
    curl: `curl -X GET https://your-domain.com/api/v1/pos/transactions/9a8b7c6d5e4f3a2b \\
  -H "x-api-key: loy_live_your_api_key"`,
    response: `{
  "success": true,
  "token": "9a8b7c6d5e4f3a2b",
  "status": "CLAIMED",
  "points": 1,
  "billReference": "INV-2026-0042",
  "claimedByPhone": "628123456789",
  "claimedAt": "2026-11-13T08:15:00.000Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/pos/customers/{phone}',
    title: 'Lookup Customer Balance & Active Vouchers',
    desc: 'Look up a customer by WhatsApp number (08... or 628...) to view their point balance and unredeemed vouchers.',
    curl: `curl -X GET https://your-domain.com/api/v1/pos/customers/08123456789 \\
  -H "x-api-key: loy_live_your_api_key"`,
    response: `{
  "success": true,
  "found": true,
  "customer": {
    "id": "cust_123",
    "phone": "628123456789",
    "name": "Budi"
  },
  "totalPoints": 7,
  "lifetimePoints": 17,
  "activeVouchers": [
    {
      "voucherCode": "LOK-9F2A-3K8P",
      "status": "ACTIVE",
      "pointsSpent": 10,
      "expiresAt": "2026-12-13T08:15:00.000Z",
      "reward": {
        "id": "rew_123",
        "title": "Gratis 1 Americano"
      }
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/pos/vouchers/verify',
    title: 'Verify or Redeem Customer Voucher',
    desc: 'Validate a voucher code at the cashier (action: "check") or mark it as used (action: "redeem").',
    curl: `curl -X POST https://your-domain.com/api/v1/pos/vouchers/verify \\
  -H "x-api-key: loy_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "voucherCode": "LOK-9F2A-3K8P",
    "action": "redeem"
  }'`,
    response: `{
  "success": true,
  "valid": true,
  "redeemed": true,
  "voucherCode": "LOK-9F2A-3K8P",
  "status": "USED",
  "usedAt": "2026-11-13T08:20:00.000Z",
  "reward": {
    "id": "rew_123",
    "title": "Gratis 1 Americano"
  }
}`,
  },
];

export default function PosApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900">
                  Loyalti POS API
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  v1 REST
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Integrasi sistem kasir eksternal (Moka, Pawoon, Majoo, Custom POS)
              </p>
            </div>
          </div>

          <Link
            href="/merchant/manage"
            className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ambil API Key</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Intro & Auth */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 text-indigo-600">
            <Code2 className="w-5 h-5" />
            <h1 className="text-2xl font-black text-slate-900">
              Autentikasi &amp; Alur Integrasi
            </h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Semua endpoint eksternal berada di bawah <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs">/api/v1/pos/*</code> dan
            memerlukan API Key unik per merchant yang dapat dibuat di{' '}
            <Link href="/merchant/manage" className="text-indigo-600 font-semibold hover:underline">
              Admin Mode → Pengaturan Toko
            </Link>
            .
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span>QR Claim atau Direct Award</span>
              </div>
              <p className="text-xs text-slate-600">
                Kirim transaksi tanpa nomor HP untuk cetak QR di struk, atau sertakan nomor WhatsApp untuk langsung menambah poin.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Cek Saldo Pelanggan</span>
              </div>
              <p className="text-xs text-slate-600">
                Kasir dapat melihat saldo poin dan daftar voucher aktif milik pelanggan cukup dengan nomor WhatsApp.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <TicketCheck className="w-4 h-4 text-indigo-600" />
                <span>Validasi Voucher</span>
              </div>
              <p className="text-xs text-slate-600">
                Verifikasi kode voucher <code className="font-mono">LOK-XXXX-XXXX</code> dan tandai terpakai langsung dari mesin POS.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-slate-400"># Kirim API Key di salah satu header berikut:</div>
            <div>x-api-key: loy_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
            <div>Authorization: Bearer loy_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-slate-900">
            <Terminal className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-black">Daftar Endpoint</h2>
          </div>

          {endpoints.map((ep) => (
            <div
              key={ep.path}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                    ep.method === 'POST'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {ep.method}
                </span>
                <code className="text-sm font-mono font-bold text-slate-900">{ep.path}</code>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{ep.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{ep.desc}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Contoh Request (cURL)
                  </div>
                  <pre className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">
                    {ep.curl}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contoh Response (200 OK)</span>
                  </div>
                  <pre className="bg-slate-900 text-emerald-300 rounded-2xl p-4 text-[11px] font-mono overflow-x-auto leading-relaxed">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Store className="w-6 h-6 text-amber-700 shrink-0" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Siap menghubungkan POS Anda?</h3>
              <p className="text-xs text-slate-600">
                Buka Admin Mode → Pengaturan Toko untuk membuat API Key merchant Anda.
              </p>
            </div>
          </div>
          <Link
            href="/merchant/manage"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shrink-0"
          >
            Buka Admin Mode
          </Link>
        </div>
      </main>
    </div>
  );
}
