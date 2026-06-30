'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateOrderStatus } from '../actions';
import { toast } from 'sonner';
import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';
import { normalizePhone } from '@/lib/phone';
import { ChevronLeft, Image as ImageIcon, MessageCircle, Package, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AdminOrderDetailViewProps {
  orderId: string;
  adminId: string;
  storeSettings?: any;
}

export function AdminOrderDetailView({ orderId, adminId, storeSettings }: AdminOrderDetailViewProps) {
  const supabase = createClient();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        payment_proofs (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      toast.error('Gagal memuat detail pesanan');
    } else {
      // payment_proofs returns an array because it's a one-to-many relationship in PostgREST unless there's a unique constraint that it recognizes.
      // Assuming unique constraint, it might return an object. We'll handle both.
      if (data && data.payment_proofs && Array.isArray(data.payment_proofs)) {
        data.payment_proof = data.payment_proofs[0];
      } else if (data && data.payment_proofs) {
        data.payment_proof = data.payment_proofs;
      }
      setOrder(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();

    const channel = supabase
      .channel(`public:orders:${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, () => {
        fetchOrder();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_proofs', filter: `order_id=eq.${orderId}` }, () => {
        fetchOrder();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, supabase]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus, adminId);
      if (res.success) {
        toast.success('Status pesanan diperbarui');
        fetchOrder();
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status');
    }
  };

  const openCustomerWA = (newStatus: string) => {
    if (!order) return;
    const msg = generateWhatsAppMessage(newStatus, order, 'admin_to_customer', storeSettings?.store_name || 'Jajanan Pasar');
    const normalizedCustomerPhone = normalizePhone(order.customer_phone);
    const url = getWhatsAppURL(normalizedCustomerPhone, msg);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-64 flex-col gap-4">
        <p className="text-gray-500">Pesanan tidak ditemukan.</p>
        <Link href="/admin/orders" className="text-[#C96A3D] font-medium hover:underline">
          Kembali ke daftar pesanan
        </Link>
      </div>
    );
  }

  // Determine available transitions
  // pending_verification → payment_accepted
  // pending_verification → cancelled
  // payment_accepted → processing
  // processing → ready_for_pickup
  // ready_for_pickup → completed
  // any → cancelled
  let availableTransitions: { value: string; label: string }[] = [];
  if (order.status === 'pending_verification') {
    availableTransitions = [
      { value: 'payment_accepted', label: 'Terima Pembayaran' },
      { value: 'cancelled', label: 'Batalkan Pesanan' }
    ];
  } else if (order.status === 'payment_accepted') {
    availableTransitions = [
      { value: 'processing', label: 'Proses Pesanan' },
      { value: 'cancelled', label: 'Batalkan Pesanan' }
    ];
  } else if (order.status === 'processing') {
    availableTransitions = [
      { value: 'ready_for_pickup', label: 'Siap Diambil' },
      { value: 'cancelled', label: 'Batalkan Pesanan' }
    ];
  } else if (order.status === 'ready_for_pickup') {
    availableTransitions = [
      { value: 'completed', label: 'Selesai' },
      { value: 'cancelled', label: 'Batalkan Pesanan' }
    ];
  } else if (order.status !== 'completed' && order.status !== 'cancelled') {
    availableTransitions = [
      { value: 'cancelled', label: 'Batalkan Pesanan' }
    ];
  }

  return (
    <div className="flex flex-col space-y-6 pb-24 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Informasi Pelanggan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                  <p className="text-base text-gray-900 font-medium">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Nomor WhatsApp</p>
                  <p className="text-base text-gray-900 font-medium">{normalizePhone(order.customer_phone)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal Pickup</p>
                  <p className="text-base text-gray-900 font-medium">
                    {new Date(order.pickup_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Alamat Pickup</p>
                  <p className="text-base text-gray-900 font-medium whitespace-pre-line">{order.pickup_address}</p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-[8px] border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">Catatan Tambahan:</p>
                <p className="text-sm text-gray-800">{order.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Item Pesanan</h2>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    <p className="text-sm text-gray-500">{item.quantity} x Rp {item.price_at_time?.toLocaleString('id-ID')}</p>
                  </div>
                  <p className="font-bold text-gray-900">
                    Rp {(item.quantity * item.price_at_time)?.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-xl font-bold text-[#C96A3D]">Rp {order.total_amount?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Status Pesanan</h2>
            <div className="mb-4">
              <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-800 text-sm font-bold rounded-[8px]">
                {order.status}
              </span>
            </div>

            {availableTransitions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500">Ubah Status:</p>
                <div className="flex flex-col gap-2">
                  {availableTransitions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleStatusChange(t.value)}
                      className={`w-full py-2.5 rounded-[8px] font-bold text-sm transition ${
                        t.value === 'cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-2">Notifikasi Customer:</p>
              <button
                onClick={() => openCustomerWA(order.status)}
                className="w-full bg-[#25D366] text-white py-2.5 rounded-[8px] font-bold text-sm hover:bg-[#20bd5a] transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim Update via WhatsApp
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Bukti Pembayaran</h2>
            {order.payment_proof ? (
              <div className="space-y-3">
                <div className="rounded-[8px] overflow-hidden border border-gray-200 bg-gray-50 p-1">
                  <a href={order.payment_proof.image_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.payment_proof.image_url} alt="Bukti Pembayaran" className="w-full h-auto object-contain rounded-[4px] max-h-48" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status Verifikasi</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-[6px] uppercase ${
                    order.payment_proof.verification_status === 'accepted' ? 'bg-green-100 text-green-700' : 
                    order.payment_proof.verification_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.payment_proof.verification_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-[8px] border border-gray-100 border-dashed text-center">
                <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Belum ada bukti pembayaran</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Customer belum mengupload bukti transfer</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
