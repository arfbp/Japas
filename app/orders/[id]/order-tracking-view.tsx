'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Package, CheckSquare, ShoppingBag, XCircle, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

import { generateWhatsAppMessage, getWhatsAppURL } from '@/lib/whatsapp';

interface OrderTrackingViewProps {
  order: any;
  items: any[];
  history: any[];
  storeSettings: any;
}

const STATUS_STEPS = [
  { id: 'pending_payment', label: 'Menunggu Pembayaran', icon: Clock },
  { id: 'pending_verification', label: 'Verifikasi Pembayaran', icon: CheckSquare },
  { id: 'payment_accepted', label: 'Pembayaran Diterima', icon: CheckSquare },
  { id: 'processing', label: 'Diproses', icon: Package },
  { id: 'ready_for_pickup', label: 'Siap Diambil', icon: ShoppingBag },
  { id: 'completed', label: 'Selesai', icon: CheckCircle2 },
];

export function OrderTrackingView({ order: initialOrder, items, history: initialHistory, storeSettings }: OrderTrackingViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [history, setHistory] = useState(initialHistory);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (payload) => {
        setOrder((prev: any) => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${order.id}` }, (payload) => {
        setHistory((prev: any) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, supabase]);
  
  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  
  const getStepStatus = (stepId: string, index: number) => {
    if (order.status === 'cancelled') {
       if (index === 0) return 'completed';
       return 'cancelled';
    }
    
    if (index < currentStatusIndex || order.status === 'completed') return 'completed';
    if (index === currentStatusIndex) return 'current';
    return 'upcoming';
  };

  const getStatusLabel = (status: string) => {
    const found = STATUS_STEPS.find(s => s.id === status);
    if (found) return found.label;
    if (status === 'payment_accepted') return 'Pembayaran Diterima';
    if (status === 'cancelled') return 'Dibatalkan';
    return status;
  };

  const handleWhatsApp = () => {
     if (!storeSettings?.whatsapp_admin) return;

     const text = generateWhatsAppMessage(order.status, order, 'customer_to_admin');
     const url = getWhatsAppURL(storeSettings.whatsapp_admin, text);
     
     window.open(url, '_blank');
  };

  // Determine if we should show the generic "Hubungi Admin" button or "Konfirmasi Pengambilan"
  const isReadyForPickup = order.status === 'ready_for_pickup';

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <div className="flex flex-col space-y-1">
        <h1 className="text-xl font-bold text-gray-900">Status Pesanan</h1>
        <p className="text-sm text-gray-500">Order #{order.order_number}</p>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-gray-900">Timeline</h2>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#C96A3D]'}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-gray-100">
          {STATUS_STEPS.map((step, index) => {
            const stepStatus = getStepStatus(step.id, index);
            const Icon = step.icon;
            
            let iconColor = 'text-gray-400';
            let bgColor = 'bg-white border-2 border-gray-200';
            
            if (stepStatus === 'completed') {
              iconColor = 'text-white';
              bgColor = 'bg-[#C96A3D] border-2 border-[#C96A3D]';
            } else if (stepStatus === 'current') {
              iconColor = 'text-[#C96A3D]';
              bgColor = 'bg-white border-2 border-[#C96A3D]';
            } else if (stepStatus === 'cancelled') {
              iconColor = 'text-red-400';
              bgColor = 'bg-white border-2 border-red-200';
              if (index === currentStatusIndex) {
                 iconColor = 'text-white';
                 bgColor = 'bg-red-500 border-2 border-red-500';
              }
            }

            return (
              <div key={step.id} className="relative z-10 flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 -ml-[23px] ${bgColor} transition-colors`}>
                  {stepStatus === 'cancelled' && index === currentStatusIndex ? (
                    <XCircle className={`w-3.5 h-3.5 ${iconColor}`} />
                  ) : stepStatus === 'completed' ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${iconColor}`} />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className={`text-sm font-semibold ${stepStatus === 'current' ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </div>
                  {/* Show history note if matches */}
                  {history.find(h => h.new_status === step.id) && (
                     <div className="text-xs text-gray-500 mt-0.5">
                       {format(new Date(history.find(h => h.new_status === step.id).created_at), 'd MMM yyyy, HH:mm', { locale: id })}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-5 rounded-[16px] shadow-sm border border-gray-100 flex flex-col space-y-4">
        <h2 className="font-semibold text-gray-900">Rincian Pesanan</h2>
        
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tanggal Pengambilan</span>
            <span className="font-medium text-gray-900">{format(new Date(order.pickup_date), 'd MMMM yyyy', { locale: id })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Informasi Pemesan</span>
            <span className="font-medium text-gray-900 text-right">{order.customer_name}<br/>{order.customer_phone}</span>
          </div>
          {order.notes && (
            <div className="flex flex-col mt-2 p-3 bg-gray-50 rounded-[8px] text-sm">
              <span className="text-gray-500 font-medium mb-1">Catatan:</span>
              <span className="text-gray-900 italic">{order.notes}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4 flex flex-col space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{item.product_name}</span>
                <div className="text-gray-500">{item.quantity} pcs x Rp {item.product_price.toLocaleString('id-ID')}</div>
              </div>
              <span className="font-medium text-gray-900">Rp {item.subtotal.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg font-bold">
          <span className="text-gray-900">Total</span>
          <span className="text-[#C96A3D]">Rp {order.total_amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {isReadyForPickup && (
        <button 
          onClick={handleWhatsApp}
          className="w-full bg-[#25D366] text-white py-3.5 rounded-[12px] font-bold text-center hover:bg-[#20bd5a] transition flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Hubungi Admin via WhatsApp
        </button>
      )}
    </div>
  );
}
