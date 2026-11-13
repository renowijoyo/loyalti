import { Metadata } from 'next';
import {
  getCustomerAccountOverview,
  getCustomerSession,
} from '@/lib/customer-auth';
import AccountClient from './AccountClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Akun Pelanggan | Loyalti',
  description:
    'Buat atau masuk akun pelanggan dengan email, hubungkan nomor WhatsApp, dan pantau poin serta riwayat transaksi Anda.',
};

export default async function AccountPage() {
  const session = await getCustomerSession();
  const initialOverview = session
    ? await getCustomerAccountOverview(session.account.id)
    : null;

  return <AccountClient initialOverview={initialOverview} />;
}
