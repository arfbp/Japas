'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { updateOrderStatus as lifecycleUpdateOrderStatus } from '@/lib/order-lifecycle';

export async function updateOrderStatus(orderId: string, newStatus: string, adminId: string, rejectReason?: string) {
  const supabase = await createClient();

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== adminId) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // Get current order
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Order not found');
  }

  // Handle special cases (payment proofs)
  if (newStatus === 'payment_accepted') {
    // Update payment proof
    await supabase
      .from('payment_proofs')
      .update({
        verification_status: 'accepted',
        verified_by: adminId,
        verified_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
  } else if (newStatus === 'pending_payment' && order.status === 'pending_verification') {
    // This implies rejecting payment
    await supabase
      .from('payment_proofs')
      .update({
        verification_status: 'rejected',
        verified_by: adminId,
        verified_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
  }

  const note = rejectReason ? `Ditolak: ${rejectReason}` : 'Status diperbarui oleh admin';
  await lifecycleUpdateOrderStatus(supabase, orderId, newStatus, adminId, note);

  revalidatePath('/admin/orders');
  revalidatePath(`/orders/${orderId}`);

  return { success: true };
}
