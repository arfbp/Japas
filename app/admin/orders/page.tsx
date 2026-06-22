import { AdminLayout } from '@/components/layout/admin-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminOrdersView } from './orders-view';

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/katalog');
  }

  // Get Store Settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('whatsapp_admin')
    .single();

  return (
    <AdminLayout>
      <AdminOrdersView adminId={user.id} storeSettings={storeSettings} />
    </AdminLayout>
  );
}
