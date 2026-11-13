This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## External POS Integration API (`/api/v1/pos/*`)

Loyalti provides an API-key-authenticated REST API for integrating external POS systems (Moka, Pawoon, Majoo, or custom POS).

1. Generate a merchant API key in **Admin Mode** (`/merchant/manage` → Store Settings) or via `POST /api/merchants/settings` with `{ "merchantId": "...", "regenerateApiKey": true }`.
2. Pass the key in `x-api-key: loy_live_...` or `Authorization: Bearer loy_live_...`.
3. Available endpoints (see interactive docs at `/docs/pos-api`):
   - `GET /api/v1/pos/info` — Merchant info, active point systems, and active rewards
   - `POST /api/v1/pos/transactions` — Issue points directly (`customerPhone` provided) or generate a QR claim token
   - `GET /api/v1/pos/transactions/:token` — Poll QR claim token status (`PENDING` / `CLAIMED` / `EXPIRED`)
   - `GET /api/v1/pos/customers/:phone` — Look up customer point balance and active vouchers
   - `POST /api/v1/pos/vouchers/verify` — Check (`action: "check"`) or redeem (`action: "redeem"`) a voucher code
