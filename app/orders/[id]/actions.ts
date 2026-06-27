'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { addDays, isAfter, setHours, setMinutes, parseISO } from 'date-fns';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Credentials for admin operations are missing');
  }
  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

export async function cancelOrder(orderId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized: Silakan masuk terlebih dahulu.');
    }

    // Fetch order to verify ownership and status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Pesanan tidak ditemukan.');
    }

    if (order.customer_id !== user.id) {
      throw new Error('Unauthorized: Anda tidak memiliki akses ke pesanan ini.');
    }

    if (order.status !== 'pending_payment') {
      throw new Error('Hanya pesanan yang belum dibayar yang dapat dibatalkan.');
    }

    // Use admin client to perform the status update and history insertion
    const adminSupabase = createAdminClient();

    // Update order status to cancelled
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (updateError) throw updateError;

    // Insert order status history
    const { error: historyError } = await adminSupabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        new_status: 'cancelled',
        note: 'Dibatalkan oleh pelanggan'
      });

    if (historyError) throw historyError;

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/keranjang');
    return { success: true };
  } catch (err: any) {
    console.error('cancelOrder error:', err);
    return { success: false, error: err.message };
  }
}

interface EditOrderInput {
  pickup_date: string;
  pickup_time?: string;
  notes?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_price: number;
    quantity: number;
  }>;
}

export async function editOrder(orderId: string, input: EditOrderInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized: Silakan masuk terlebih dahulu.');
    }

    // 1. Fetch order to verify ownership and status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('customer_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Pesanan tidak ditemukan.');
    }

    if (order.customer_id !== user.id) {
      throw new Error('Unauthorized: Anda tidak memiliki akses ke pesanan ini.');
    }

    if (order.status !== 'pending_payment') {
      throw new Error('Hanya pesanan yang belum dibayar yang dapat diubah.');
    }

    // 2. Fetch store settings for lead days and cutoff validation
    const { data: storeSettings, error: settingsError } = await supabase
      .from('store_settings')
      .select('cutoff_time, minimum_lead_days')
      .single();

    if (settingsError) throw settingsError;

    // 3. Validate pickup date
    const now = new Date();
    const cutoffTime = storeSettings?.cutoff_time || '18:00:00';
    const cutoffParts = cutoffTime.split(':');
    const cutoffDateTime = setMinutes(setHours(new Date(), parseInt(cutoffParts[0], 10)), parseInt(cutoffParts[1] || '0', 10));

    const leadDays = storeSettings?.minimum_lead_days || 3;
    let minDate = addDays(now, leadDays);
    if (isAfter(now, cutoffDateTime)) {
      minDate = addDays(now, leadDays + 1);
    }

    // Clear hours for comparison
    const minCompare = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const inputDate = parseISO(input.pickup_date);
    const inputCompare = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());

    if (inputCompare < minCompare) {
      throw new Error(`Tanggal pengambilan tidak valid. Minimum pengambilan adalah ${minCompare.toLocaleDateString('id-ID')}`);
    }

    // 4. Validate items quantities (minimum 30 per item)
    if (!input.items || input.items.length === 0) {
      throw new Error('Pesanan harus memiliki minimal 1 produk.');
    }

    for (const item of input.items) {
      if (item.quantity < 30) {
        throw new Error(`Minimal pemesanan untuk ${item.product_name} adalah 30 pcs.`);
      }
    }

    // Recalculate total
    const totalAmount = input.items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

    const adminSupabase = createAdminClient();

    // 5. Update order items (Delete existing and insert new ones)
    const { error: deleteItemsError } = await adminSupabase
      .from('order_items')
      .delete()
      .eq('order_id', orderId);

    if (deleteItemsError) throw deleteItemsError;

    const orderItemsData = input.items.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.product_price * item.quantity,
    }));

    const { error: insertItemsError } = await adminSupabase
      .from('order_items')
      .insert(orderItemsData);

    if (insertItemsError) throw insertItemsError;

    // 6. Update main order details
    const { error: updateOrderError } = await adminSupabase
      .from('orders')
      .update({
        pickup_date: input.pickup_date,
        pickup_time: input.pickup_time || null,
        notes: input.notes || '',
        subtotal: totalAmount,
        total_amount: totalAmount
      })
      .eq('id', orderId);

    if (updateOrderError) throw updateOrderError;

    // 7. Insert to history
    const { error: historyError } = await adminSupabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        new_status: 'pending_payment',
        note: 'Detail pesanan diperbarui oleh pelanggan'
      });

    if (historyError) throw historyError;

    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/keranjang');
    return { success: true };
  } catch (err: any) {
    console.error('editOrder error:', err);
    return { success: false, error: err.message };
  }
}
