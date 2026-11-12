import { Metadata } from 'next';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Daftar Merchant Baru | Loyalti',
  description:
    'Daftarkan usaha atau tokomu dan mulai buat program stempel digital WhatsApp dalam hitungan menit.',
};

export default function RegisterPage() {
  return <RegisterClient />;
}
