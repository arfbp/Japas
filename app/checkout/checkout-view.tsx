'use client';

import { useCartStore } from '@/lib/store/cart';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { addDays, format, isAfter, setHours, setMinutes } from 'date-fns';
import { createClient as createClientComponentClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { normalizePhone } from '@/lib/phone';

interface CheckoutViewProps {
  userId: string;
  profile: any;
  storeSettings: any;
}

const EMPTY_ARRAY: any[] = [];

export function CheckoutView({ userId, profile, storeSettings }: CheckoutViewProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const cartItems = useCartStore((state) => (userId ? state.itemsByUserId[userId] : undefined) || EMPTY_ARRAY);
  const getCartTotal = useCartStore((state) => state.getCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const total = getCartTotal(userId);

  const supabase = createClientComponentClient();

  // Form states
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [pickupDate, setPickupDate] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate min pickup date
  const now = new Date();
  const cutoffTime = storeSettings?.cutoff_time || '18:00:00';
  const cutoffParts = cutoffTime.split(':');
  
  const cutoffDateTime = setMinutes(setHours(new Date(), parseInt(cutoffParts[0])), parseInt(cutoffParts[1]));
  
  // Default is H+3, but if it's past cutoff time, it's H+4
  const leadDays = storeSettings?.minimum_lead_days || 3;
  let minDate = addDays(now, leadDays);
  
  if (isAfter(now, cutoffDateTime)) {
    minDate = addDays(now, leadDays + 1);
  }
  
  const minDateStr = format(minDate, 'yyyy-MM-dd');

  const fetchCart = useCartStore((state) => state.fetchCart);
  const [cartLoaded, setCartLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      setMounted(true);
      if (userId) {
        await fetchCart(userId);
      }
      setCartLoaded(true);
    };
    load();
  }, [userId, fetchCart]);

  useEffect(() => {
    if (mounted && cartLoaded && cartItems.length === 0 && !isSuccess) {
      router.replace('/keranjang');
    }
  }, [cartItems, router, isSuccess, mounted, cartLoaded]);

  if (!mounted || !cartLoaded || (cartItems.length === 0 && !isSuccess)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!name.trim()) return toast.error('Nama lengkap wajib diisi');
    
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone.startsWith('+62') || normalizedPhone.startsWith('+620')) {
      return toast.error('Gunakan format +62 tanpa angka 0 di depan');
    }
    if (!pickupDate) return toast.error('Tanggal pickup wajib dipilih');
    
    const qtyValid = cartItems.every(item => item.quantity >= 30);
    if (!qtyValid) return toast.error('Minimum pemesanan 30 quantity per kue');

    try {
      setSubmitting(true);

      // 1. Generate Order Number
      // Format: JP-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      
      const { data: latestOrders, error: latestError } = await supabase
        .from('orders')
        .select('order_number')
        .like('order_number', `JP-${dateStr}-%`)
        .order('order_number', { ascending: false })
        .limit(1);

      if (latestError) throw latestError;

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
          customer_id: userId,
          customer_name: name,
          customer_phone: phone,
          pickup_date: pickupDate,
          pickup_address: storeSettings?.pickup_address || 'Alamat tidak tersedia',
          notes: notes,
          status: 'pending_payment',
          subtotal: total,
          total_amount: total,
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      if (!order) throw new Error('Gagal mendapatkan ID pesanan setelah berhasil dibuat.');

      // 3. Insert Order Items (Must use same authenticated client and happen after orders insert succeeds)
      const orderItemsData = cartItems.map(item => ({
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

      if (itemsError) throw itemsError;

      // Create first history record
      const { error: historyError } = await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          new_status: 'pending_payment',
          note: 'Pesanan dibuat'
        });
      
      if (historyError) throw historyError;

      // 4. Check cart clear logic (Must only run after both orders and order_items insert succeed)
      setIsSuccess(true);
      clearCart(userId);
      toast.success('Pesanan berhasil dibuat');
      router.push(`/payment/${order.id}`);
    } catch (error: any) {
      console.error('Full checkout error:', error);
      toast.error(error.message || 'Gagal membuat pesanan, silakan coba lagi');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        
        {/* Customer Data Snapshot */}
        <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            Data Pemesan
          </h2>
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input 
              value={name}
              readOnly
              placeholder="Masukkan nama"
              className="bg-gray-100 border-gray-200 text-gray-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nomor WhatsApp</Label>
            <Input 
              value={phone}
              readOnly
              placeholder="+628..."
              className="bg-gray-100 border-gray-200 text-gray-500"
              required
            />
          </div>
        </div>

        {/* Pickup Info */}
        <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            Informasi Pickup
          </h2>
          <div className="p-3 bg-orange-50 border border-orange-100 rounded-[8px] text-sm text-[#C96A3D] mb-2 leading-relaxed">
            Pesanan memerlukan waktu pembuatan. Pemesanan di atas jam {cutoffParts[0]}:{cutoffParts[1]} akan diproses hari berikutnya (H+{leadDays+1}).
          </div>
          
          <div className="space-y-2">
            <Label>Tanggal Pengambilan</Label>
            <Input 
              type="date"
              value={pickupDate}
              min={minDateStr}
              onChange={(e) => setPickupDate(e.target.value)}
              className="bg-gray-50 border-gray-200"
              required
            />
          </div>

          <div className="space-y-2 pt-2">
            <Label>Lokasi Pengambilan (Toko)</Label>
            <div className="p-3 bg-gray-50 rounded-[8px] text-sm text-gray-700 font-medium">
              {storeSettings?.pickup_address}
            </div>
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            Ringkasan Pesanan
          </h2>
          
          <div className="flex flex-col space-y-3">
             {cartItems.map((item) => (
               <div key={item.product_id} className="flex justify-between items-start text-sm">
                 <div>
                   <div className="font-medium text-gray-900">{item.name}</div>
                   <div className="text-gray-500">{item.quantity} pcs x Rp {item.price.toLocaleString('id-ID')}</div>
                 </div>
                 <div className="font-semibold text-gray-900">
                   Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                 </div>
               </div>
             ))}
          </div>

          <div className="border-t border-dashed border-gray-200 my-2 pt-4">
             <div className="flex justify-between items-center font-bold text-lg">
                <span className="text-gray-900">Total Harga</span>
                <span className="text-[#C96A3D]">Rp {total.toLocaleString('id-ID')}</span>
             </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <Label>Catatan Tambahan (Opsional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tolong bungkus yang rapi"
              className="flex min-h-[80px] w-full rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C96A3D]"
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 md:left-64 bg-white border-t border-gray-100 z-40">
           <div className="max-w-7xl mx-auto flex flex-col justify-center">
             <button 
               type="submit"
               disabled={submitting}
               className="w-full bg-[#C96A3D] text-white py-3.5 rounded-[12px] font-bold text-center hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
               {submitting ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   Memproses...
                 </>
               ) : (
                 'Konfirmasi & Bayar'
               )}
             </button>
           </div>
        </div>
      </form>
    </div>
  );
}
