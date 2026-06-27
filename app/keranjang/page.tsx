import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { KeranjangView } from './keranjang-view';
import { redirect } from 'next/navigation';

export default async function KeranjangPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AuthenticatedLayout>
      <KeranjangView userId={user.id} />
    </AuthenticatedLayout>
  );
}
