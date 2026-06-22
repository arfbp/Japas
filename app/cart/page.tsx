import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { CartView } from './cart-view';
import { redirect } from 'next/navigation';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuthenticatedLayout>
      <CartView userId={user.id} />
    </AuthenticatedLayout>
  );
}
