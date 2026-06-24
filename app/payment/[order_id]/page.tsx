import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PaymentView } from './payment-view';

export default async function PaymentPage({
  params
}: {
  params: Promise<{ order_id: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Await params per Next.js App Router rules
  const { order_id } = await params;

  // Verify order
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', order_id)
    .single();

  if (!order || order.customer_id !== user.id) {
    redirect('/katalog');
  }

  // Get Store Settings for QRIS
  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select('qris_image_url, whatsapp_admin')
    .single();

  // Check if proof already uploaded
  const { data: existingProof } = await supabase
    .from('payment_proofs')
    .select('id, verification_status')
    .eq('order_id', order.id)
    .single();

  return (
    <AuthenticatedLayout>
      <PaymentView 
        order={order} 
        storeSettings={storeSettings} 
        user={user} 
        existingProof={existingProof} 
      />
    </AuthenticatedLayout>
  );
}
