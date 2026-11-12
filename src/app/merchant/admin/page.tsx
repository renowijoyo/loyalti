import { redirect } from 'next/navigation';

export default function MerchantAdminRedirect() {
  redirect('/merchant/manage');
}
