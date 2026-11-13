import { Metadata } from 'next';
import {
  getSystemAdminOverview,
  isSystemAdminAuthenticated,
} from '@/lib/system-admin-auth';
import SystemAdminClient from './SystemAdminClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'System Admin Dashboard | Loyalti',
  description:
    'System-wide administration for Loyalti merchants, customer accounts, transactions, and Fonnte WhatsApp logs.',
};

export default async function SystemAdminPage() {
  const authenticated = await isSystemAdminAuthenticated();
  const initialOverview = authenticated ? await getSystemAdminOverview() : null;

  return <SystemAdminClient initialOverview={initialOverview} />;
}
