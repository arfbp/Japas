import { SupabaseClient } from '@supabase/supabase-js';

export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  newStatus: string,
  changedBy: string,
  note?: string
) {
  // 1. Get current order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    throw new Error('Order not found or failed to fetch order.');
  }

  // If status is already the same, just return the order without creating history
  if (order.status === newStatus) {
    return order;
  }

  // 2. Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  // 3. Insert history record
  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({
      order_id: orderId,
      old_status: order.status,
      new_status: newStatus,
      changed_by: changedBy,
      note: note || `Status updated to ${newStatus}`,
    });

  if (historyError) {
    console.error('Failed to insert order status history:', historyError);
    // Non-blocking error for the main transaction in this application context, 
    // but ideally should be logged to error tracking.
  }

  // Return the updated order object
  return updatedOrder;
}
