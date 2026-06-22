import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrderTrackingView } from './order-tracking-view';

export default async function OrderTrackingPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Get order
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!order || order.customer_id !== user.id) {
    redirect('/katalog');
  }

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  // Get status history
  const { data: history } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false });

  // Get store settings
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('whatsapp_admin')
    .single();

  return (
    <AuthenticatedLayout>
      <OrderTrackingView 
        order={order} 
        items={items || []} 
        history={history || []} 
        storeSettings={storeSettings}
      />
    </AuthenticatedLayout>
  );
}
