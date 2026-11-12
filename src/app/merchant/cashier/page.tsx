import { redirect } from 'next/navigation';

export default function MerchantCashierRedirect() {
  redirect('/merchant/pos');
}
