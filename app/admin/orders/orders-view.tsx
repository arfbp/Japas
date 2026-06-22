'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, ExternalLink, Image as ImageIcon, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { updateOrderStatus } from './actions';
import { toast } from 'sonner';
import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';
import Image from 'next/image';

interface AdminOrdersViewProps {
  adminId: string;
  storeSettings: any;
}

export function AdminOrdersView({ adminId, storeSettings }: AdminOrdersViewProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select(`
        *,
        payment_proofs (
          image_url,
          verification_status
        )
      `)
      .order('created_at', { ascending: false });

    // Assuming a simple way. If there are many orders, pagination is needed.
    // For now we get top 200.
    query = query.limit(200);

    const { data, error } = await query;
    if (error) {
      toast.error('Gagal memuat pesanan');
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        // Fast refresh
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await updateOrderStatus(orderId, newStatus, adminId);
      if (res.success) {
        toast.success('Status pesanan diperbarui');
        // It will auto-refresh via realtime or we can call fetchOrders
        fetchOrders();
      }
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah status');
    }
  };

  const openCustomerWA = (order: any, newStatus: string) => {
    const msg = generateWhatsAppMessage(newStatus, order, 'admin_to_customer');
    const url = getWhatsAppURL(order.customer_phone, msg);
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || 
                          o.customer_phone.includes(search) ||
                          o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || o.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'pending_verification': return 'bg-orange-100 text-orange-800';
      case 'payment_accepted': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-indigo-100 text-indigo-800';
      case 'ready_for_pickup': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending_payment': return 'Menunggu Pembayaran';
      case 'pending_verification': return 'Verifikasi Pembayaran';
      case 'payment_accepted': return 'Pembayaran Diterima';
      case 'processing': return 'Diproses';
      case 'ready_for_pickup': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">Kelola Pesanan</h1>
        <button 
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-50 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Cari order #, nama, nomor WA..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200 rounded-[12px]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border text-sm border-gray-200 rounded-[12px] px-3 py-2 w-full md:w-auto"
        >
          <option value="all">Semua Status</option>
          <option value="pending_payment">Menunggu Pembayaran</option>
          <option value="pending_verification">Verifikasi Pembayaran</option>
          <option value="payment_accepted">Pembayaran Diterima</option>
          <option value="processing">Diproses</option>
          <option value="ready_for_pickup">Siap Diambil</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>
      </div>

      <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <th className="px-4 py-3 font-medium rounded-tl-[16px]">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Bukti Bayar</th>
              <th className="px-4 py-3 font-medium rounded-tr-[16px]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat pesanan...</td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada pesanan ditemukan</td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900">{order.order_number}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-4 py-4 font-medium text-[#C96A3D]">
                    Rp {order.total_amount?.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {order.payment_proofs ? (
                      <a 
                        href={order.payment_proofs.image_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#C96A3D] hover:underline text-xs font-medium"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Lihat Bukti
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 flex items-center gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="bg-white border border-gray-200 text-xs rounded-[6px] px-2 py-1.5 focus:ring-1 focus:ring-[#C96A3D] focus:border-[#C96A3D]"
                    >
                      <option value="pending_payment">Menunggu Pembayaran</option>
                      <option value="pending_verification">Verifikasi Pembayaran</option>
                      <option value="payment_accepted">Terima Pembayaran</option>
                      <option value="processing">Proses Pesanan</option>
                      <option value="ready_for_pickup">Siap Diambil</option>
                      <option value="completed">Selesai</option>
                      <option value="cancelled">Batalkan</option>
                    </select>
                    <button
                      onClick={() => openCustomerWA(order, order.status)}
                      className="p-1.5 text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-[6px] transition flex-shrink-0"
                      title="Hubungi Customer (WA)"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <a 
                      href={`/orders/${order.id}`}
                      target="_blank"
                      className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-[6px] transition flex-shrink-0"
                      title="Lihat Detail Pesanan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
