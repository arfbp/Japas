import { AdminLayout } from '@/components/layout/admin-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminOrderDetailView } from './order-detail-view';

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;

  return (
    <AdminLayout>
      <AdminOrderDetailView orderId={id} adminId={user.id} />
    </AdminLayout>
  );
}
