'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PackageOpen } from 'lucide-react';

interface OrdersListViewProps {
  orders: any[];
}

export function OrdersListView({ orders }: OrdersListViewProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <span className="bg-orange-100 text-[#C96A3D] px-2 py-1 rounded-md text-xs font-semibold">Menunggu Pembayaran</span>;
      case 'pending_verification':
        return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold">Verifikasi Pembayaran</span>;
      case 'payment_accepted':
        return <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-md text-xs font-semibold">Pembayaran Diterima</span>;
      case 'processing':
        return <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-semibold">Diproses</span>;
      case 'ready_for_pickup':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs font-semibold">Siap Diambil</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">Selesai</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-semibold">Dibatalkan</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs font-semibold">{status}</span>;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
          <PackageOpen className="w-8 h-8 text-gray-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Belum ada pesanan</h2>
          <p className="text-sm text-gray-500 max-w-[250px]">Anda belum memiliki pesanan saat ini.</p>
        </div>
        <button 
          onClick={() => router.push('/katalog')}
          className="mt-4 bg-[#C96A3D] text-white px-6 py-2.5 rounded-[10px] font-bold text-sm hover:bg-[#b05a30] transition"
        >
          Mulai Belanja
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan Saya</h1>
        <p className="text-sm text-gray-500">Daftar riwayat pesanan Anda</p>
      </div>

      <div className="flex flex-col space-y-3">
        {orders.map((order) => (
          <div 
            key={order.id}
            onClick={() => router.push(`/orders/${order.id}`)}
            className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-3 cursor-pointer hover:border-[#C96A3D] transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 text-sm">#{order.order_number}</span>
                <span className="text-xs text-gray-500 mt-0.5">
                  Pickup: {format(new Date(order.pickup_date), 'd MMM yyyy', { locale: id })}
                </span>
              </div>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="border-t border-gray-50 pt-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Belanja</span>
              <span className="font-bold text-gray-900">Rp {order.total_amount?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
