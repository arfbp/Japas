import { redirect } from 'next/navigation';

export default function OrdersPage() {
  redirect('/keranjang?tab=orders');
}
