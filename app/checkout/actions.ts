'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createOrder(data: {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_date: string;
  pickup_address: string;
  notes: string;
  subtotal: number;
  total_amount: number;
  items: {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}) {
  const supabase = await createClient();
  
  // Verify user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== data.customer_id) {
    throw new Error('Unauthorized');
  }

  // 1. Generate Order Number
  // Format: JP-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.getFullYear().toString() + 
                 (today.getMonth() + 1).toString().padStart(2, '0') + 
                 today.getDate().toString().padStart(2, '0');
  
  // To get XXXX, we find count of orders today
  // Alternatively, just query max order number like JP-YYYYMMDD-%
  const { data: latestOrders } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', `JP-${dateStr}-%`)
    .order('order_number', { ascending: false })
    .limit(1);

  let seq = 1;
  if (latestOrders && latestOrders.length > 0) {
    const lastNum = latestOrders[0].order_number.split('-').pop();
    if (lastNum) {
      seq = parseInt(lastNum, 10) + 1;
    }
  }

  const orderNumber = `JP-${dateStr}-${seq.toString().padStart(4, '0')}`;

  // 2. Insert Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      pickup_date: data.pickup_date,
      pickup_address: data.pickup_address,
      notes: data.notes,
      status: 'pending_payment',
      subtotal: data.subtotal,
      total_amount: data.total_amount,
    })
    .select('id')
    .single();

  if (orderError) {
    console.error('Create order error:', orderError);
    throw new Error('Failed to create order');
  }

  // 3. Insert Order Items
  const orderItemsData = data.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.name,
    product_price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData);

  if (itemsError) {
    console.error('Create order items error:', itemsError);
    throw new Error('Failed to save order items');
  }
  
  // Create first history record
  await supabase
    .from('order_status_history')
    .insert({
      order_id: order.id,
      new_status: 'pending_payment',
      note: 'Pesanan dibuat'
    });

  revalidatePath('/katalog');
  revalidatePath('/orders');
  
  return { success: true, orderId: order.id };
}
